#ifndef USER_H
#define USER_H

#include <string>
#include <memory>
#include "Roles.h"

class User
{
private:
  std::string username;
  std::string passwordHash;
  std::string role;
  // User preferences
  std::string theme;
  std::string pageStyle;
  std::string penColor;
  int penSize;
  // Profile object corresponding to the user's role
  std::unique_ptr<Person> profile;
  // Static member to count users
  static int userCount;

public:
  User(const std::string &username, const std::string &passwordHash, const std::string &role,
       const std::string &theme = "Light", const std::string &pageStyle = "Plain",
       const std::string &penColor = "#000000", int penSize = 2);
  User() = default;
  ~User() = default;
  // Disable copy to avoid slicing unique_ptr
  User(const User &other) = delete;
  User &operator=(const User &other) = delete;
  // Allow move
  User(User &&other) noexcept = default;
  User &operator=(User &&other) noexcept = default;
  // Getters
  const std::string &getUsername() const { return username; }
  const std::string &getRole() const { return role; }
  const std::string &getTheme() const { return theme; }
  const std::string &getPageStyle() const { return pageStyle; }
  const std::string &getPenColor() const { return penColor; }
  int getPenSize() const { return penSize; }
  const std::string &getPasswordHash() const { return passwordHash; }
  // Chainable setters for preferences
  User &setTheme(const std::string &t)
  {
    theme = t;
    return *this;
  }
  User &setPageStyle(const std::string &ps)
  {
    pageStyle = ps;
    return *this;
  }
  User &setPenColor(const std::string &c)
  {
    penColor = c;
    return *this;
  }
  User &setPenSize(int s)
  {
    penSize = s;
    return *this;
  }
  // Static function to get total user count
  static int getUserCount() { return userCount; }
  // Friend output operator to display user info
  friend std::ostream &operator<<(std::ostream &os, const User &u);
};

#endif
