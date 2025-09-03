#pragma once

#include <drogon/HttpController.h>
#include <json/json.h>
#include <unordered_map>
#include <string>

/**
 * QuizModule exposes two routes:
 *   GET  /api/quiz/{chapter}/{section}
 *   POST /api/quiz/submit
 *
 * It loads quiz data from data/quizzes/*.json at startup.
 */
class QuizModule : public drogon::HttpController<QuizModule>
{
public:
    QuizModule();

    // ---- HttpController route table ----
    METHOD_LIST_BEGIN
    // chapter examples: ch1, ch2, ...
    // section examples: Mastery, Review, Cumulative, Exercises
    ADD_METHOD_TO(QuizModule::getQuiz,
                  "/api/quiz/{1}/{2}", drogon::Get);
    ADD_METHOD_TO(QuizModule::submitQuiz,
                  "/api/quiz/submit", drogon::Post);
    METHOD_LIST_END

    // Handlers (must be public for HttpController)
    void getQuiz(const drogon::HttpRequestPtr &req,
                 std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                 std::string chapter, std::string section) const;

    void submitQuiz(const drogon::HttpRequestPtr &req,
                    std::function<void(const drogon::HttpResponsePtr &)> &&callback);

private:
    void loadAll(); // loads JSON files into memory

    // All quizzes loaded; also quick access map by "chX"
    Json::Value all_;
    std::unordered_map<std::string, Json::Value> byChapter_;
};
