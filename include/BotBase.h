#pragma once
#include <drogon/drogon.h>
#include <string>
#include <filesystem>

// Base abstract class for all modules. Demonstrates OOP concepts used across the app.
class BotBase {
protected:
    std::string dataRoot_;
public:
    inline static std::atomic<size_t> totalBots{0};

    BotBase(const std::string& dataRoot = "data")
        : dataRoot_(dataRoot) {
        ++totalBots;
        std::filesystem::create_directories(dataRoot_);
    }

    virtual ~BotBase() {
        --totalBots;
    }

    virtual std::string name() const = 0;

    const std::string& dataRoot() const { return dataRoot_; }
};
