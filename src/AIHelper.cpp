// src/AIHelper.cpp
#include <string>
#include <cstdlib>

std::string getEnvStr(const char *name, const std::string &fallback = {})
{
#ifdef _WIN32
  char *value = nullptr;
  size_t len = 0;
  if (_dupenv_s(&value, &len, name) == 0 && value)
  {
    std::string s(value);
    free(value);
    return s;
  }
  return fallback;
#else
  if (const char *p = std::getenv(name))
    return std::string(p);
  return fallback;
#endif
}
