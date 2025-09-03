#include "QuizModule.h"
#include <drogon/drogon.h>
#include <fstream>

using namespace drogon;

QuizModule::QuizModule() { loadAll(); }

void QuizModule::loadAll()
{
    all_.clear();
    byChapter_.clear();

    // Try multiple filenames to match your folder tree
    static const std::vector<std::string> candidates = {
        "data/quizzes/quizzes.json",
        "data/quizzes/quizzee.json",
        "data/quizzes/quizzer.json"};

    Json::CharReaderBuilder rb;
    for (const auto &path : candidates)
    {
        std::ifstream is(path);
        if (!is.good())
            continue;

        Json::Value tmp;
        std::string errs;
        if (Json::parseFromStream(rb, is, &tmp, &errs))
        {
            all_ = tmp;
            if (tmp.isMember("chapters"))
            {
                for (const auto &ch : tmp["chapters"])
                {
                    const auto id = ch.get("id", "").asString();
                    if (!id.empty())
                        byChapter_[id] = ch;
                }
            }
            LOG_INFO << "Loaded quiz data from " << path;
            return;
        }
        else
        {
            LOG_WARN << "Failed to parse " << path << ": " << errs;
        }
    }
    LOG_WARN << "No quiz data was loaded; API will return empty lists.";
}

void QuizModule::getQuiz(const HttpRequestPtr &req,
                         std::function<void(const HttpResponsePtr &)> &&cb,
                         std::string chapter, std::string section) const
{
    Json::Value out;
    out["chapter"] = chapter;
    out["section"] = section;

    auto it = byChapter_.find(chapter);
    if (it != byChapter_.end())
    {
        const auto &ch = it->second;
        if (ch.isMember("sections") && ch["sections"].isMember(section))
        {
            out["questions"] = ch["sections"][section];
        }
        else
        {
            out["questions"] = Json::arrayValue; // section not found
        }
    }
    else
    {
        out["questions"] = Json::arrayValue; // chapter not found
    }

    auto resp = HttpResponse::newHttpJsonResponse(out);
    resp->addHeader("Access-Control-Allow-Origin", "*");
    cb(resp);
}

void QuizModule::submitQuiz(const HttpRequestPtr &req,
                            std::function<void(const HttpResponsePtr &)> &&cb)
{
    // Expected body: { "chapter":"ch1", "section":"Mastery", "answers":[...] }
    auto body = req->getJsonObject();
    Json::Value out;
    if (!body)
    {
        out["ok"] = false;
        out["message"] = "Body must be JSON.";
        cb(HttpResponse::newHttpJsonResponse(out));
        return;
    }

    const auto chapter = (*body)["chapter"].asString();
    const auto section = (*body)["section"].asString();
    const Json::Value &answers = (*body)["answers"];

    int total = 0, correct = 0;
    Json::Value details(Json::arrayValue);

    auto it = byChapter_.find(chapter);
    if (it != byChapter_.end() && it->second.isMember("sections") && it->second["sections"].isMember(section) && answers.isArray())
    {
        const auto &qs = it->second["sections"][section];
        total = static_cast<int>(qs.size());
        for (Json::ArrayIndex i = 0; i < qs.size() && i < answers.size(); ++i)
        {
            const auto &q = qs[i];
            Json::Value d;
            d["question"] = q["question"];
            d["yourAnswer"] = answers[i];
            d["correctAnswer"] = q["answer"];
            const bool ok = (q.isMember("answer") && q["answer"] == answers[i]);
            d["correct"] = ok;
            d["explanation"] = q["explanation"];
            details.append(d);
            if (ok)
                ++correct;
        }
    }

    out["ok"] = true;
    out["score"] = correct;
    out["total"] = total;
    out["details"] = details;

    auto resp = HttpResponse::newHttpJsonResponse(out);
    resp->addHeader("Access-Control-Allow-Origin", "*");
    cb(resp);
}
