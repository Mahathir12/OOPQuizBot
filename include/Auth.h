#ifndef AUTH_H
#define AUTH_H
#include <json/json.h>
#include <drogon/drogon.h>
#include <openssl/sha.h>
#include <filesystem>
#include <fstream>

inline std::string sha256(const std::string &s)
{
  unsigned char hash[SHA256_DIGEST_LENGTH];
  SHA256((const unsigned char *)s.c_str(), s.size(), hash);
  std::ostringstream os;
  os << std::hex << std::setfill('0');
  for (auto c : hash)
    os << std::setw(2) << (int)c;
  return os.str();
}

struct User
{
  std::string username, passHash, role;
  Json::Value prefs;
};

class AuthStore
{
  std::string path = "data/users/users.json";
  Json::Value db;

  void load()
  {
    namespace fs = std::filesystem;
    fs::path p(path);
    std::error_code ec;
    fs::create_directories(p.parent_path(), ec);
    std::ifstream ifs(path);
    if (ifs)
      ifs >> db;
    if (!db.isObject())
      db = Json::Value(Json::objectValue);
  }
  void save()
  {
    std::ofstream ofs(path);
    ofs << db;
  }

public:
  AuthStore() { load(); }
  bool exists(const std::string &u) { return db.isMember(u); }
  bool registerUser(const std::string &u, const std::string &pass, const std::string &role)
  {
    if (exists(u))
      return false;
    Json::Value j;
    j["passHash"] = sha256(pass);
    j["role"] = role;
    j["prefs"] = Json::objectValue;
    db[u] = j;
    save();
    return true;
  }
  bool check(const std::string &u, const std::string &pass)
  {
    return exists(u) && db[u]["passHash"].asString() == sha256(pass);
  }
  std::string roleOf(const std::string &u) { return exists(u) ? db[u]["role"].asString() : ""; }
  Json::Value getPrefs(const std::string &u) { return exists(u) ? db[u]["prefs"] : Json::objectValue; }
  void setPrefs(const std::string &u, const Json::Value &p)
  {
    if (exists(u))
    {
      db[u]["prefs"] = p;
      save();
    }
  }
};

// extremely simple token: "username" (demo only)
inline std::string makeToken(const std::string &u) { return drogon::utils::base64Encode(u); }
inline std::string userFromToken(const std::string &t)
{
  try
  {
    return drogon::utils::base64Decode(t);
  }
  catch (...)
  {
    return "";
  }
}
#endif
