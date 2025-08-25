#ifndef NOTEMODULE_H
#define NOTEMODULE_H

#include "BotBase.h"
#include <string>
#include <string_view>
#include <vector>
#include <fstream>
#include <filesystem>
#include <stdexcept>
#include <iostream>

class NoteModule : virtual public BotBase
{
private:
  std::vector<std::string> pages;

  static void ensureParentDir(const std::string &filename)
  {
    namespace fs = std::filesystem;
    fs::path p(filename);
    if (p.has_parent_path())
      fs::create_directories(p.parent_path());
  }

public:
  NoteModule(const std::string &name = "NotebookBot") : BotBase(name) {}
  ~NoteModule() {}

  std::string getModuleName() const override { return "NoteModule"; }

  // Save to file (handles dir creation)
  void saveNoteToFile(const std::string &filename, std::string_view content)
  {
    ensureParentDir(filename);
    std::ofstream ofs(filename, std::ios::binary);
    if (!ofs.is_open())
      throw std::runtime_error("Cannot open file for writing: " + filename);
    ofs.write(content.data(), static_cast<std::streamsize>(content.size()));
    ofs.close();
    pages.emplace_back(content);
    std::cout << "[NoteModule] Saved note to " << filename << std::endl;
  }

  // Load from file (empty string if missing)
  std::string loadNoteFromFile(const std::string &filename)
  {
    std::ifstream ifs(filename, std::ios::binary);
    if (!ifs.is_open())
      return std::string{};
    return std::string((std::istreambuf_iterator<char>(ifs)), std::istreambuf_iterator<char>());
  }
};

#endif // NOTEMODULE_H
