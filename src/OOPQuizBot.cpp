#include <drogon/drogon.h>
using namespace drogon;
// keep this file minimal to avoid deprecated API usage
static void registerRoutes() {
  app().registerHandler("/api/ping", [](const HttpRequestPtr&, std::function<void (const HttpResponsePtr &)> &&cb){
    Json::Value j; j["pong"]=true; cb(HttpResponse::newHttpJsonResponse(j));
  }, {Get});
}
static int ensured = (registerRoutes(), 0);
