#pragma once
#include <drogon/HttpController.h>
#include <json/json.h>
// ... other includes as needed (e.g., <string>)

using namespace drogon;

class AuthController : public drogon::HttpController<AuthController>
{
public:
  // Register endpoints (make sure these are present and correct)
  METHOD_LIST_BEGIN
  METHOD_ADD(AuthController::login, "/login", Post);
  METHOD_ADD(AuthController::logout, "/logout", Get);
  METHOD_ADD(AuthController::me, "/me", Get);
  METHOD_ADD(AuthController::updateProfile, "/updateProfile", Post);
  METHOD_ADD(AuthController::postAnnouncement, "/postAnnouncement", Post);
  METHOD_ADD(AuthController::getAnnouncements, "/getAnnouncements", Get);
  METHOD_LIST_END

  // ** Declare all handler methods (as public member functions) **
  void login(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback);
  void logout(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback);
  void me(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback);
  void updateProfile(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback);
  void postAnnouncement(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback);
  void getAnnouncements(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback);

private:
  // (Any private members or helper functions for AuthController)
};
