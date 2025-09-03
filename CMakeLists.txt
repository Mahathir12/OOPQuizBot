# CMakeLists.txt — root of OOPQuizBot
cmake_minimum_required(VERSION 3.20)

project(oop_quiz_bot VERSION 1.0 LANGUAGES CXX)

# C++ settings
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# If you pass vcpkg toolchain on the command line, CMake will find packages from vcpkg.
# Dependencies
find_package(Drogon CONFIG REQUIRED)
find_package(JsonCpp CONFIG REQUIRED)

# Sources
file(GLOB SRC "src/*.cpp")

add_executable(oop_quiz_bot ${SRC})
target_include_directories(oop_quiz_bot PRIVATE include)

# Link libs from vcpkg
target_link_libraries(oop_quiz_bot
    PRIVATE
    Drogon::Drogon
    JsonCpp::JsonCpp
)

# Put binaries under build/<config> on MSVC (so .\build\Release\oop_quiz_bot.exe exists)
if (MSVC)
  add_definitions(-DNOMINMAX)
  set_target_properties(oop_quiz_bot PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY_RELEASE "${CMAKE_BINARY_DIR}/Release"
    RUNTIME_OUTPUT_DIRECTORY_DEBUG   "${CMAKE_BINARY_DIR}/Debug"
  )
endif()
