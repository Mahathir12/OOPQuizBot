#include "AIHelper.h"

#include <drogon/drogon.h>
#include <json/json.h>
#include <cstdlib>
#include <string>

using namespace drogon;

namespace ai
{

  static std::string getenv_or(const char *k, const char *fallback)
  {
    const char *v = std::getenv(k);
    return (v && *v) ? std::string(v) : std::string(fallback);
  }

  std::string chat(const std::string &prompt)
  {
    // Defaults assume LM Studio running locally (no key required)
    std::string baseUrl = getenv_or("AI_BASE_URL", "http://127.0.0.1:1234");
    std::string path = getenv_or("AI_PATH", "/v1/chat/completions");
    std::string model = getenv_or("AI_MODEL", "lmstudio-community/Meta-Llama-3-8B-Instruct");
    std::string apiKey = getenv_or("AI_API_KEY", "");

    // Build OpenAI-compatible chat payload
    Json::Value payload;
    payload["model"] = model;
    Json::Value msgs(Json::arrayValue);
    Json::Value m;
    m["role"] = "user";
    m["content"] = prompt;
    msgs.append(m);
    payload["messages"] = msgs;

    auto req = HttpRequest::newHttpJsonRequest(payload);
    req->setMethod(Post);
    req->setPath(path);
    if (!apiKey.empty())
      req->addHeader("Authorization", "Bearer " + apiKey);

    auto client = HttpClient::newHttpClient(baseUrl);

    auto resPair = client->sendRequest(req); // synchronous
    if (resPair.first != ReqResult::Ok || !resPair.second)
    {
      return "ERROR: cannot reach AI server";
    }
    if (resPair.second->getStatusCode() != k200OK)
    {
      return "ERROR: HTTP " + std::to_string((int)resPair.second->getStatusCode()) + " from AI";
    }

    auto json = resPair.second->getJsonObject();
    if (!json)
      return resPair.second->getBody();

    const auto &j = *json;
    if (j.isMember("choices") && j["choices"].isArray() && !j["choices"].empty())
    {
      const auto &c = j["choices"][0];
      if (c.isMember("message") && c["message"].isMember("content"))
      {
        return c["message"]["content"].asString();
      }
      if (c.isMember("text"))
        return c["text"].asString();
    }
    return resPair.second->getBody();
  }

} // namespace ai
