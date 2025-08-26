#include "AIHelper.h"
#include <drogon/HttpClient.h>
#include <json/json.h>

std::string AIHelper::askChat(const std::string &prompt, const std::string &apiKey)
{
  using namespace drogon;
  const char *base = getenv("DEEPSEEK_API_BASE"); // e.g. https://api.deepseek.com/v1
  const char *model = getenv("DEEPSEEK_MODEL");   // deepseek-chat (or deepseek-reasoner)
  const std::string apiBase = base ? base : "https://api.deepseek.com/v1";
  const std::string apiModel = model ? model : "deepseek-chat";

  auto client = HttpClient::newHttpClient(apiBase);
  auto req = HttpRequest::newHttpRequest();
  req->setMethod(Post);
  req->setPath("/chat/completions");
  req->addHeader("Authorization", "Bearer " + apiKey);
  req->addHeader("Content-Type", "application/json");

  Json::Value body;
  body["model"] = apiModel;
  Json::Value msgs = Json::arrayValue;
  Json::Value u;
  u["role"] = "user";
  u["content"] = prompt;
  msgs.append(u);
  body["messages"] = msgs;
  body["temperature"] = 0.7;
  body["max_tokens"] = 200;

  req->setBody(Json::FastWriter().write(body));
  auto resp = client->sendRequest(req);
  if (!resp || resp->getStatusCode() != 200)
    throw std::runtime_error("AI HTTP error");

  auto j = resp->getJsonObject();
  if (!j || !(*j)["choices"] || (*j)["choices"].empty())
    throw std::runtime_error("AI empty");
  return (*j)["choices"][0]["message"]["content"].asString();
}
