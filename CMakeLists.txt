cmake_minimum_required(VERSION 3.20)
project(OOPQuizBot CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# If you use vcpkg:
#   cmake -S . -B build -G "Visual Studio 17 2022" -A x64 ^
#         -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake ^
#         -DVCPKG_TARGET_TRIPLET=x64-windows -DCMAKE_BUILD_TYPE=Release

find_package(Drogon CONFIG REQUIRED)
find_package(jsoncpp CONFIG REQUIRED)

add_executable(OOPQuizBot
  src/main.cpp
  # If you really need this, keep it; otherwise remove the file from disk.
  # src/AIHelper.cpp
)

target_include_directories(OOPQuizBot PRIVATE ${CMAKE_SOURCE_DIR}/include)
target_link_libraries(OOPQuizBot PRIVATE Drogon::Drogon JsonCpp::JsonCpp)

# Silence MSVC getenv warnings (optional)
if (MSVC)
  target_compile_definitions(OOPQuizBot PRIVATE _CRT_SECURE_NO_WARNINGS)
endif()
