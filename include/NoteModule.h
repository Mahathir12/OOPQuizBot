#pragma once
#include "BotBase.h"
#include <fstream>
#include <vector>

// Forward declare a friend function for exporting notes
class NoteModule;
void exportNotesToTxt(const NoteModule& nm, const std::string& username, const std::string& outPath);

class NoteModule : public virtual BotBase {
public:
    using BotBase::BotBase;

    std::string name() const override { return "NoteModule"; }

    // Save a note under data/pages/<username>/<title>.txt
    void saveNoteToFile(const std::string& username,
                        const std::string& title,
                        const std::string& content) const {
        auto dir = std::filesystem::path(dataRoot_) / "pages" / username;
        std::filesystem::create_directories(dir);
        auto file = dir / (title + ".txt");
        std::ofstream ofs(file, std::ios::out | std::ios::binary);
        if(!ofs) {
            throw std::runtime_error("Cannot open file for writing: " + file.string());
        }
        ofs << content;
    }

    std::string loadNoteFromFile(const std::string& username,
                                 const std::string& title) const {
        auto file = std::filesystem::path(dataRoot_) / "pages" / username / (title + ".txt");
        std::ifstream ifs(file, std::ios::in | std::ios::binary);
        if(!ifs) {
            throw std::runtime_error("Cannot open file for reading: " + file.string());
        }
        std::ostringstream oss;
        oss << ifs.rdbuf();
        return oss.str();
    }

    std::vector<std::string> listNotes(const std::string& username) const {
        std::vector<std::string> titles;
        auto dir = std::filesystem::path(dataRoot_) / "pages" / username;
        if(std::filesystem::exists(dir)) {
            for(auto& p : std::filesystem::directory_iterator(dir)) {
                if(p.is_regular_file()) {
                    auto stem = p.path().stem().string();
                    titles.push_back(stem);
                }
            }
        }
        return titles;
    }

    friend void ::exportNotesToTxt(const NoteModule& nm, const std::string& username, const std::string& outPath);
};

inline void exportNotesToTxt(const NoteModule& nm, const std::string& username, const std::string& outPath) {
    // Simple "friend" helper that exports all notes for a user into a single text bundle.
    auto titles = nm.listNotes(username);
    std::ofstream ofs(outPath, std::ios::out | std::ios::binary);
    if(!ofs) throw std::runtime_error("Cannot open export file: " + outPath);
    ofs << "OOPQuizBot Notes Export for user: " << username << "\n\n";
    for(const auto& t : titles) {
        ofs << "==== " << t << " ====\n";
        try {
            ofs << nm.loadNoteFromFile(username, t) << "\n\n";
        } catch(...) {
            ofs << "[Error reading " << t << "]\n\n";
        }
    }
}
