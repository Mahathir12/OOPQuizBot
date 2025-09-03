# 0) Set your vcpkg path if needed
$env:VCPKG_ROOT = "C:\dev\vcpkg"     # change if your vcpkg is elsewhere

# 1) Clean and (re)configure
if (Test-Path build) { Remove-Item -Recurse -Force build }
cmake -S . -B build -G "Visual Studio 17 2022" -A x64 `
  -DCMAKE_TOOLCHAIN_FILE="$env:VCPKG_ROOT\scripts\buildsystems\vcpkg.cmake" `
  -DCMAKE_BUILD_TYPE=Release

# 2) Build (use /m for parallel on VS generators)
cmake --build build --config Release -- /m

# 3) Run
.\build\Release\oop_quiz_bot.exe
