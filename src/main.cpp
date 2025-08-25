#include <drogon/drogon.h>
#include <json/json.h>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <cstdlib>

using namespace drogon;
namespace fs = std::filesystem;

// Folders/files
static const fs::path kDataDir = fs::path("data");
static const fs::path kNotesDir = kDataDir / "notes";
static const fs::path kUploadDir = kDataDir / "uploads";
static const fs::path kUsers = kDataDir / "users.json";
static const fs::path kAnnPath = kDataDir / "announcements.json";
static const fs::path kLbPath = kDataDir / "leaderboard.json";

// ---------- helpers ----------
static Json::Value readJsonFile(const fs::path &p)
{
    if (!fs::exists(p))
        return Json::Value(Json::objectValue);
    std::ifstream ifs(p, std::ios::binary);
    Json::CharReaderBuilder rb;
    rb["collectComments"] = false;
    Json::Value out;
    std::string errs;
    if (!Json::parseFromStream(rb, ifs, &out, &errs))
        return Json::Value(Json::objectValue);
    return out;
}
static void writeJsonFile(const fs::path &p, const Json::Value &v)
{
    fs::create_directories(p.parent_path());
    std::ofstream ofs(p, std::ios::binary | std::ios::trunc);
    Json::StreamWriterBuilder wb;
    wb["indentation"] = "  ";
    ofs << Json::writeString(wb, v);
}
static void ensureFiles()
{
    fs::create_directories(kNotesDir);
    fs::create_directories(kUploadDir);
    if (!fs::exists(kUsers))
    {
        Json::Value root(Json::objectValue);
        root["users"] = Json::arrayValue;
        writeJsonFile(kUsers, root);
    }
    if (!fs::exists(kAnnPath))
    {
        Json::Value a(Json::objectValue);
        a["items"] = Json::arrayValue;
        writeJsonFile(kAnnPath, a);
    }
    if (!fs::exists(kLbPath))
    {
        Json::Value l(Json::objectValue);
        l["rows"] = Json::arrayValue;
        writeJsonFile(kLbPath, l);
    }
}
static HttpResponsePtr jsonResp(const Json::Value &v, HttpStatusCode code = k200OK)
{
    auto r = HttpResponse::newHttpJsonResponse(v);
    r->setStatusCode(code);
    r->addHeader("Access-Control-Allow-Origin", "*");
    r->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    r->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    return r;
}
static bool isTeacherOrAdmin(const HttpRequestPtr &req)
{
    auto s = req->session();
    if (!s->find("role"))
        return false;
    auto role = s->get<std::string>("role");
    for (auto &c : role)
        c = (char)tolower(c);
    return (role == "teacher" || role == "admin");
}
static bool isLoggedIn(const HttpRequestPtr &req)
{
    return req->session()->find("username");
}

// ---------- AI (DeepSeek/OpenAI‑compatible) ----------
static void callChatCompletions(const std::string &prompt,
                                const std::string &systemPrompt,
                                std::function<void(Json::Value)> done)
{
    const char *base = std::getenv("AI_API_BASE");
    const std::string apiBase = base ? base : "https://api.deepseek.com/v1";
    const char *k = std::getenv("AI_API_KEY");
    const std::string apiKey = k ? k : "";
    const char *mdl = std::getenv("AI_MODEL");
    const std::string model = mdl ? mdl : "deepseek-chat";

    auto cli = HttpClient::newHttpClient(apiBase);
    Json::Value body;
    body["model"] = model;
    body["messages"] = Json::arrayValue;

    if (!systemPrompt.empty())
    {
        Json::Value sys;
        sys["role"] = "system";
        sys["content"] = systemPrompt;
        body["messages"].append(sys);
    }
    Json::Value usr;
    usr["role"] = "user";
    usr["content"] = prompt;
    body["messages"].append(usr);

    auto req = HttpRequest::newHttpJsonRequest(body);
    req->setMethod(Post);
    req->setPath("/chat/completions");
    if (!apiKey.empty())
        req->addHeader("Authorization", "Bearer " + apiKey);

    cli->sendRequest(req, [done](ReqResult r, const HttpResponsePtr &resp)
                     {
        Json::Value out; out["ok"]=false;
        if (r==ReqResult::Ok && resp) {
            Json::Value j; Json::CharReaderBuilder rb;
            std::istringstream is(std::string(resp->body()));
            if (Json::parseFromStream(rb,is,&j,nullptr)) {
                out["ok"]=true;
                out["text"]=j["choices"][0]["message"]["content"];
            } else out["error"]="AI JSON parse error";
        } else out["error"]="AI request failed";
        done(out); });
}

int main()
{
    ensureFiles();

    int port = 8080;
    if (const char *p = std::getenv("PORT"))
    {
        try
        {
            port = std::stoi(p);
        }
        catch (...)
        {
        }
    }

    app().setLogLevel(trantor::Logger::kInfo).enableSession().setIdleConnectionTimeout(60).setDocumentRoot("./public").addListener("0.0.0.0", port);

    // ----- CORS preflight (use wildcard; no placeholder mismatch)
    // CORS preflight — REPLACE your current block with this one
    app().registerHandler(
        "/api/{1}",
        [](const HttpRequestPtr &,
           std::function<void(const HttpResponsePtr &)> &&cb,
           const std::string & /*p1*/)
        {
            Json::Value ok;
            ok["ok"] = true;
            cb(jsonResp(ok));
        },
        {Options});

    // ----- Health
    app().registerHandler("/api/health",
                          [](const HttpRequestPtr &, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              Json::Value v;
                              v["ok"] = true;
                              cb(jsonResp(v));
                          },
                          {Get});

    // ----- Sign up
    app().registerHandler("/api/signup",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto &j = *js;
                              std::string username = j.get("username", "").asString();
                              std::string password = j.get("password", "").asString();
                              std::string role = j.get("role", "Student").asString();
                              if (username.empty() || password.empty())
                              {
                                  Json::Value e;
                                  e["error"] = "username/password required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto db = readJsonFile(kUsers);
                              auto &arr = db["users"];
                              for (const auto &u : arr)
                                  if (u["username"].asString() == username)
                                  {
                                      Json::Value e;
                                      e["error"] = "user exists";
                                      return cb(jsonResp(e, k409Conflict));
                                  }
                              Json::Value u(Json::objectValue);
                              u["username"] = username;
                              u["password"] = password;
                              u["role"] = role;
                              arr.append(u);
                              writeJsonFile(kUsers, db);
                              Json::Value ok;
                              ok["ok"] = true;
                              cb(jsonResp(ok));
                          },
                          {Post});

    // ----- Login
    app().registerHandler("/api/login",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto &j = *js;
                              std::string username = j.get("username", "").asString();
                              std::string password = j.get("password", "").asString();
                              auto db = readJsonFile(kUsers);
                              for (const auto &u : db["users"])
                              {
                                  if (u["username"].asString() == username && u["password"].asString() == password)
                                  {
                                      req->session()->insert("username", username);
                                      req->session()->insert("role", u["role"].asString());
                                      Json::Value ok;
                                      ok["ok"] = true;
                                      ok["role"] = u["role"];
                                      return cb(jsonResp(ok));
                                  }
                              }
                              Json::Value e;
                              e["error"] = "invalid credentials";
                              cb(jsonResp(e, k401Unauthorized));
                          },
                          {Post});

    // ----- Logout
    app().registerHandler("/api/logout",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              req->session()->clear();
                              Json::Value ok;
                              ok["ok"] = true;
                              cb(jsonResp(ok));
                          },
                          {Post});

    // ----- Account (change password)
    app().registerHandler("/api/account/password",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              if (!isLoggedIn(req))
                              {
                                  Json::Value e;
                                  e["error"] = "login required";
                                  return cb(jsonResp(e, k401Unauthorized));
                              }
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto &j = *js;
                              std::string newPass = j.get("password", "").asString();
                              if (newPass.empty())
                              {
                                  Json::Value e;
                                  e["error"] = "password required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto db = readJsonFile(kUsers);
                              auto &arr = db["users"];
                              std::string me = req->session()->get<std::string>("username");
                              for (auto &u : arr)
                                  if (u["username"].asString() == me)
                                  {
                                      u["password"] = newPass;
                                      writeJsonFile(kUsers, db);
                                      Json::Value ok;
                                      ok["ok"] = true;
                                      return cb(jsonResp(ok));
                                  }
                              Json::Value e;
                              e["error"] = "user not found";
                              cb(jsonResp(e, k404NotFound));
                          },
                          {Post});

    // ----- Notes save/load (HTML content)
    app().registerHandler("/api/notes/save",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              if (!isLoggedIn(req))
                              {
                                  Json::Value e;
                                  e["error"] = "login required";
                                  return cb(jsonResp(e, k401Unauthorized));
                              }
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto &j = *js;
                              std::string content = j.get("content", "").asString();
                              std::string page = j.get("file", "default").asString();
                              std::string user = req->session()->get<std::string>("username");
                              fs::create_directories(kNotesDir);
                              fs::path out = kNotesDir / (user + "_" + page + ".html");
                              std::ofstream ofs(out, std::ios::binary | std::ios::trunc);
                              ofs << content;
                              ofs.close();
                              Json::Value ok;
                              ok["ok"] = true;
                              ok["path"] = out.string();
                              cb(jsonResp(ok));
                          },
                          {Post});

    app().registerHandler("/api/notes/load",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              if (!isLoggedIn(req))
                              {
                                  Json::Value e;
                                  e["error"] = "login required";
                                  return cb(jsonResp(e, k401Unauthorized));
                              }
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto &j = *js;
                              std::string page = j.get("file", "default").asString();
                              std::string user = req->session()->get<std::string>("username");
                              fs::path in = kNotesDir / (user + "_" + page + ".html");
                              std::string content;
                              if (fs::exists(in))
                              {
                                  std::ifstream ifs(in, std::ios::binary);
                                  content.assign((std::istreambuf_iterator<char>(ifs)), std::istreambuf_iterator<char>());
                              }
                              Json::Value out;
                              out["ok"] = true;
                              out["content"] = content;
                              cb(jsonResp(out));
                          },
                          {Post});

    // ----- Announcements (get/post)
    app().registerHandler("/api/announcements",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              if (req->getMethod() == Get)
                              {
                                  auto a = readJsonFile(kAnnPath);
                                  cb(jsonResp(a));
                              }
                              else if (req->getMethod() == Post)
                              {
                                  if (!isTeacherOrAdmin(req))
                                  {
                                      Json::Value e;
                                      e["error"] = "teacher/admin only";
                                      return cb(jsonResp(e, k403Forbidden));
                                  }
                                  auto js = req->getJsonObject();
                                  if (!js)
                                  {
                                      Json::Value e;
                                      e["error"] = "JSON required";
                                      return cb(jsonResp(e, k400BadRequest));
                                  }
                                  auto &j = *js;
                                  auto a = readJsonFile(kAnnPath);
                                  auto &arr = a["items"];
                                  Json::Value item(Json::objectValue);
                                  item["title"] = j.get("title", "").asString();
                                  item["text"] = j.get("text", "").asString();
                                  item["by"] = req->session()->find("username") ? req->session()->get<std::string>("username") : "system";
                                  item["ts"] = (Json::Int64)trantor::Date::now().microSecondsSinceEpoch();
                                  arr.append(item);
                                  writeJsonFile(kAnnPath, a);
                                  Json::Value ok;
                                  ok["ok"] = true;
                                  cb(jsonResp(ok));
                              }
                              else
                              {
                                  Json::Value ok;
                                  ok["ok"] = true;
                                  cb(jsonResp(ok));
                              }
                          },
                          {Get, Post, Options});

    // ----- File upload (multipart) → data/uploads, plus /files/{name} to serve
    app().registerHandler("/api/upload",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              if (!isTeacherOrAdmin(req))
                              {
                                  Json::Value e;
                                  e["error"] = "teacher/admin only";
                                  return cb(jsonResp(e, k403Forbidden));
                              }
                              MultiPartParser parser;
                              if (parser.parse(req) != 0)
                              {
                                  Json::Value e;
                                  e["error"] = "multipart parse failed";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              Json::Value out;
                              out["saved"] = Json::arrayValue;
                              for (const auto &f : parser.getFiles())
                              {
                                  auto name = f.getFileName().empty() ? std::string("upload.bin") : f.getFileName();
                                  fs::path target = kUploadDir / name;
                                  // Safer across Drogon versions: write from content view.
                                  auto data = f.fileContent(); // string_view
                                  std::ofstream ofs(target, std::ios::binary | std::ios::trunc);
                                  ofs.write(data.data(), (std::streamsize)data.size());
                                  Json::Value one;
                                  one["name"] = name;
                                  one["url"] = "/files/" + name;
                                  out["saved"].append(one);
                              }
                              out["ok"] = true;
                              cb(jsonResp(out));
                          },
                          {Post});

    app().registerHandler("/files/{1}",
                          [](const HttpRequestPtr &, std::function<void(const HttpResponsePtr &)> &&cb, const std::string &name)
                          {
                              fs::path p = kUploadDir / name;
                              if (!fs::exists(p))
                              {
                                  cb(HttpResponse::newNotFoundResponse());
                                  return;
                              }
                              cb(HttpResponse::newFileResponse(p.string()));
                          },
                          {Get});

    // ----- Leaderboard
    app().registerHandler("/api/quiz/submit",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              if (!isLoggedIn(req))
                              {
                                  Json::Value e;
                                  e["error"] = "login required";
                                  return cb(jsonResp(e, k401Unauthorized));
                              }
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              auto &j = *js;
                              auto lb = readJsonFile(kLbPath);
                              auto &rows = lb["rows"];
                              Json::Value r(Json::objectValue);
                              r["user"] = req->session()->get<std::string>("username");
                              r["topic"] = j.get("topic", "").asString();
                              r["score"] = j.get("score", 0).asInt();
                              r["timeMs"] = j.get("timeMs", 0).asInt64();
                              r["ts"] = (Json::Int64)trantor::Date::now().microSecondsSinceEpoch();
                              rows.append(r);
                              writeJsonFile(kLbPath, lb);
                              Json::Value ok;
                              ok["ok"] = true;
                              cb(jsonResp(ok));
                          },
                          {Post});

    app().registerHandler("/api/quiz/leaderboard",
                          [](const HttpRequestPtr &, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              auto lb = readJsonFile(kLbPath);
                              cb(jsonResp(lb));
                          },
                          {Get});

    // ----- AI: chat + paraphrase (DeepSeek by env)
    app().registerHandler("/api/ai/chat",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              std::string msg = (*js).get("message", "").asString();
                              callChatCompletions(msg, "You are a helpful assistant for a C++ OOP learning app.",
                                                  [cb](Json::Value out)
                                                  { cb(jsonResp(out, out["ok"].asBool() ? k200OK : k502BadGateway)); });
                          },
                          {Post});

    app().registerHandler("/api/ai/paraphrase",
                          [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&cb)
                          {
                              auto js = req->getJsonObject();
                              if (!js)
                              {
                                  Json::Value e;
                                  e["error"] = "JSON required";
                                  return cb(jsonResp(e, k400BadRequest));
                              }
                              std::string text = (*js).get("text", "").asString();
                              std::string prompt = "Rewrite the following text in clear, concise English, preserving meaning.\n\n" + text;
                              callChatCompletions(prompt, "You paraphrase text for students. Keep it faithful and easy.",
                                                  [cb](Json::Value out)
                                                  { cb(jsonResp(out, out["ok"].asBool() ? k200OK : k502BadGateway)); });
                          },
                          {Post});

    LOG_INFO << "OOPQuizBot on http://localhost:" << port;
    app().run();
}
