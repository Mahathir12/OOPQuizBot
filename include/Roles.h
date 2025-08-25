#ifndef ROLES_H
#define ROLES_H

#include <string>
#include <iostream>

// Base class Person (abstract)
class Person
{
private:
  std::string name;

public:
  Person(const std::string &name = "") : name(name) {}
  virtual ~Person() = default;
  // Pure virtual function (abstraction)
  virtual std::string getRoleName() const = 0;
  // Getter and setter for name
  const std::string &getName() const { return name; }
  void setName(const std::string &n) { name = n; }
  // Friend output operator for Person (accesses private name)
  friend std::ostream &operator<<(std::ostream &os, const Person &p);
};

// Derived classes with virtual inheritance (to handle diamond)
class Student : public virtual Person
{
public:
  Student(const std::string &name = "") : Person(name) {}
  std::string getRoleName() const override { return "Student"; }
};

class Teacher : public virtual Person
{
public:
  Teacher(const std::string &name = "") : Person(name) {}
  std::string getRoleName() const override { return "Teacher"; }
  void postAnnouncement(const std::string &msg)
  {
    std::cout << "Announcement posted: " << msg << std::endl;
  }
};

// Multiple inheritance: TeachingAssistant inherits from Student and Teacher (diamond)
class TeachingAssistant : public Student, public Teacher
{
public:
  TeachingAssistant(const std::string &name = "")
      : Person(name), Student(name), Teacher(name) {}
  std::string getRoleName() const override { return "TeachingAssistant"; }
};

#endif
