#pragma once
#include <string>
#include <json/json.h>
#include <drogon/HttpResponse.h>

namespace util
{
  // strings / fs
  std::string Trim(const std::string &s);
  std::string Slug(const std::string &s);
  bool EnsureDir(const std::string &dir);

  // json file io
  Json::Value LoadJson(const std::string &path);
  bool SaveJson(const std::string &path, const Json::Value &v);

  // http helpers
  drogon::HttpResponsePtr Ok();
  drogon::HttpResponsePtr Ok(const Json::Value &v);
  drogon::HttpResponsePtr Err(const std::string &message,
                              drogon::HttpStatusCode code = drogon::k400BadRequest);
}

// Optional convenience so you can call Ok()/Err() without util::
using util::EnsureDir;
using util::Err;
using util::LoadJson;
using util::Ok;
using util::SaveJson;
using util::Slug;
using util::Trim;
