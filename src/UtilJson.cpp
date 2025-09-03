#include "UtilJson.h"
#include <drogon/drogon.h>
#include <fstream>
#include <filesystem>
#include <algorithm>
#include <cctype>

using namespace drogon;

namespace
{
    std::string ltrim(std::string s)
    {
        s.erase(s.begin(), std::find_if(s.begin(), s.end(),
                                        [](unsigned char ch)
                                        { return !std::isspace(ch); }));
        return s;
    }
    std::string rtrim(std::string s)
    {
        s.erase(std::find_if(s.rbegin(), s.rend(),
                             [](unsigned char ch)
                             { return !std::isspace(ch); })
                    .base(),
                s.end());
        return s;
    }
}

namespace util
{

    std::string Trim(const std::string &s)
    {
        return rtrim(ltrim(s));
    }

    std::string Slug(const std::string &s)
    {
        std::string out;
        out.reserve(s.size());
        bool lastDash = false;
        for (unsigned char ch : s)
        {
            if (std::isalnum(ch))
            {
                out.push_back((char)std::tolower(ch));
                lastDash = false;
            }
            else if (!lastDash)
            {
                out.push_back('-');
                lastDash = true;
            }
        }
        // trim leading/trailing '-'
        if (!out.empty() && out.front() == '-')
            out.erase(out.begin());
        if (!out.empty() && out.back() == '-')
            out.pop_back();
        if (out.empty())
            out = "user";
        return out;
    }

    bool EnsureDir(const std::string &dir)
    {
        namespace fs = std::filesystem;
        std::error_code ec;
        if (dir.empty())
            return false;
        return fs::exists(dir, ec) ? true : fs::create_directories(dir, ec);
    }

    Json::Value LoadJson(const std::string &path)
    {
        std::ifstream in(path);
        if (!in)
            return Json::Value(); // null
        Json::CharReaderBuilder b;
        Json::Value root;
        std::string errs;
        if (!Json::parseFromStream(b, in, &root, &errs))
        {
            return Json::Value(); // null
        }
        return root;
    }

    bool SaveJson(const std::string &path, const Json::Value &v)
    {
        std::ofstream out(path, std::ios::binary | std::ios::trunc);
        if (!out)
            return false;
        Json::StreamWriterBuilder b;
        b["indentation"] = "  ";
        std::unique_ptr<Json::StreamWriter> w(b.newStreamWriter());
        return (w->write(v, &out), out.good());
    }

    static HttpResponsePtr makeJson(Json::Value v, HttpStatusCode code)
    {
        if (v.isNull())
            v = Json::Value(Json::objectValue);
        if (!v.isMember("status"))
            v["status"] = (code >= 200 && code < 300) ? "ok" : "error";
        auto resp = HttpResponse::newHttpJsonResponse(v);
        resp->setStatusCode(code);
        resp->setContentTypeCode(CT_APPLICATION_JSON);
        return resp;
    }

    HttpResponsePtr Ok()
    {
        Json::Value v;
        v["status"] = "ok";
        return makeJson(v, k200OK);
    }

    HttpResponsePtr Ok(const Json::Value &v)
    {
        return makeJson(v, k200OK);
    }

    HttpResponsePtr Err(const std::string &message, HttpStatusCode code)
    {
        Json::Value v;
        v["status"] = "error";
        v["message"] = message;
        return makeJson(v, code);
    }

} // namespace util
