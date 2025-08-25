#pragma once
#include <string>

namespace ai
{
  // Returns model text or "ERROR: ..." message
  std::string chat(const std::string &prompt);
}
