#pragma once
#include "NoteModule.h"
#include "QuizModule.h"
#include <functional>

class OOPQuizBot : public NoteModule, public QuizModule
{
public:
    OOPQuizBot(const std::string &dataRoot = "data")
        : BotBase(dataRoot), NoteModule(dataRoot), QuizModule(dataRoot) {}

    std::string name() const override { return "OOPQuizBot"; }

    // Callback-based Ask-AI (works with C++17 and all Drogon versions)
    void askAI(const std::string &userPrompt,
               std::function<void(Json::Value)> done,
               const std::string &baseUrl = "http://127.0.0.1:1234/v1",
               const std::string &modelName = "lmstudio-community/llama-3.1-8b-instruct") const;
};
