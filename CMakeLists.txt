cmake_minimum_required(VERSION 3.16)
project(OOPQuizBot)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon REQUIRED)
# Jsoncpp is bundled with Drogon on Linux and via vcpkg on Windows
find_package(Jsoncpp CONFIG REQUIRED)

add_executable(OOPQuizBot
    src/main.cpp
)

target_include_directories(OOPQuizBot PRIVATE include)
target_link_libraries(OOPQuizBot PRIVATE Drogon::Drogon Jsoncpp::Jsoncpp)
