#ifndef BOTBASE_H
#define BOTBASE_H

#include <string>
#include <iostream>

class BotBase
{
protected:
  std::string name;
  static int totalBots; // defined in BotBase.cpp

public:
  explicit BotBase(const std::string &n = "Bot") : name(n) { ++totalBots; }
  virtual ~BotBase() = default;

  static int getTotalBots() { return totalBots; }

  // Every module provides its name
  virtual std::string getModuleName() const = 0;

  void log(const std::string &msg) const
  {
    std::cout << "[" << getModuleName() << "] " << msg << std::endl;
  }
};

#endif
