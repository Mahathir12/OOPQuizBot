#include <drogon/drogon.h>
#include <filesystem>
#include <iostream>

int main() {
  using namespace drogon;
  namespace fs = std::filesystem;

  // Resolve project root whether you run from repo root or from build/
  fs::path base = fs::current_path();
  fs::path candidate = base / "public";
  if (!fs::exists(candidate)) {
    // Fallback: use source directory (__FILE__) -> /src -> project root
    fs::path srcPath = fs::path(__FILE__).parent_path(); // .../src
    base = srcPath.parent_path(); // project root
    candidate = base / "public";
  }
  if (!fs::exists(candidate)) {
    std::cerr << "[OOPQuizBot] Could not find 'public' directory. Current path: " << fs::current_path() << std::endl;
  }

  auto &appRef = app();
  // Load config if present (port, sessions, etc.)
  fs::path cfg = base / "config" / "config.json";
  if (fs::exists(cfg)) {
    appRef.loadConfigFile(cfg.string());
  }

  appRef.setDocumentRoot(candidate.string())
        .enableSession(true)
        .addListener("0.0.0.0", 8080) // overridden by config if provided
        .run();
  return 0;
}
