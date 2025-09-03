#pragma once
#include <drogon/HttpController.h>
#include <json/json.h>

class AuthController : public drogon::HttpController<AuthController> {
public:
  METHOD_LIST_BEGIN
    ADD_METHOD_TO(AuthController::registerUser, "/api/auth/register", drogon::Post);
    ADD_METHOD_TO(AuthController::login,         "/api/auth/login",    drogon::Post);
    ADD_METHOD_TO(AuthController::logout,        "/api/auth/logout",   drogon::Post);
    ADD_METHOD_TO(AuthController::me,            "/api/auth/me",       drogon::Get);
    ADD_METHOD_TO(AuthController::updateProfile, "/api/auth/profile",  drogon::Post);
    ADD_METHOD_TO(AuthController::postAnnouncement, "/api/announcements", drogon::Post);
    ADD_METHOD_TO(AuthController::getAnnouncements, "/api/announcements", drogon::Get);
    ADD_METHOD_TO(AuthController::submitScore,   "/api/leaderboard",   drogon::Post);
    ADD_METHOD_TO(AuthController::getLeaderboard,"/api/leaderboard",   drogon::Get);
  METHOD_LIST_END

  void registerUser(const drogon::HttpRequestPtr&,
                    std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void login(const drogon::HttpRequestPtr&,
             std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void logout(const drogon::HttpRequestPtr&,
              std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void me(const drogon::HttpRequestPtr&,
          std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void updateProfile(const drogon::HttpRequestPtr&,
                     std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void postAnnouncement(const drogon::HttpRequestPtr&,
                        std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void getAnnouncements(const drogon::HttpRequestPtr&,
                        std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void submitScore(const drogon::HttpRequestPtr&,
                   std::function<void (const drogon::HttpResponsePtr &)> &&cb);
  void getLeaderboard(const drogon::HttpRequestPtr&,
                      std::function<void (const drogon::HttpResponsePtr &)> &&cb);
};
