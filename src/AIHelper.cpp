// AIHelper.cpp
#include "AIHelper.h"
#include <drogon/HttpClient.h>
#include <drogon/HttpResponse.h>
#include <json/json.h>

std::string AIHelper::askChat(const std::string &prompt, const std::string &apiKey)
{
  using namespace drogon;

  // DeepSeek endpoint
  auto client = HttpClient::newHttpClient("https://api.deepseek.com");

  auto req = HttpRequest::newHttpRequest();
  req->setMethod(Post);
  req->setPath("/v1/chat/completions");
  req->addHeader("Content-Type", "application/json");
  req->addHeader("Authorization", std::string("Bearer ") + apiKey);

  Json::Value body;
  body["model"] = "deepseek-chat"; // <= DeepSeek model
  Json::Value msgs(Json::arrayValue);
  Json::Value u;
  u["role"] = "user";
  u["content"] = prompt;
  msgs.append(u);
  body["messages"] = msgs;
  body["max_tokens"] = 300;
  body["temperature"] = 0.7;

  req->setBody(Json::FastWriter().write(body));

  auto resp = client->sendRequest(req);
  if (!resp)
    throw std::runtime_error("Failed to contact DeepSeek");
  if (resp->getStatusCode() != 200)
  {
    throw std::runtime_error("DeepSeek HTTP " + std::to_string(resp->getStatusCode()));
  }
  auto j = resp->getJsonObject();
  if (!j || !(*j)["choices"] || (*j)["choices"].empty())
    throw std::runtime_error("No choices in DeepSeek response");
  return (*j)["choices"][0]["message"]["content"].asString();
}
