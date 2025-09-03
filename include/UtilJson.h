// include/UtilJson.h
#pragma once
#include <json/json.h>
#include <fstream>
#include <memory>
#include <string>

namespace util
{
    inline bool loadJson(const std::string &path, Json::Value &out, std::string *err = nullptr)
    {
        std::ifstream ifs(path, std::ios::binary);
        if (!ifs)
        {
            if (err)
                *err = "open failed: " + path;
            return false;
        }
        Json::CharReaderBuilder b;
        return Json::parseFromStream(b, ifs, &out, err);
    }

    inline bool saveJson(const std::string &path, const Json::Value &v, std::string *err = nullptr)
    {
        std::ofstream ofs(path, std::ios::binary | std::ios::trunc);
        if (!ofs)
        {
            if (err)
                *err = "open failed: " + path;
            return false;
        }
        Json::StreamWriterBuilder wb;
        wb["indentation"] = "  ";
        std::unique_ptr<Json::StreamWriter> w(wb.newStreamWriter());
        w->write(v, &ofs);
        return ofs.good();
    }
} // namespace util
