#include "AuthController.h"
#include "UtilJson.h" // Include the utilities header for LoadJson, SaveJson, etc.
#include <filesystem> // For EnsureDir if not already in UtilJson.h
#include <drogon/HttpResponse.h>
#include <algorithm> // maybe for Trim (if needed)
#include <cctype>    // for isalnum, tolower

// Define the base directory for files (e.g., user data or uploads)
static const std::string FILES_DIR = "data/files"; // adjust path as needed

using namespace drogon;

// Implementation of AuthController endpoints:

void AuthController::login(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback)
{
    // Parse JSON body from request
    auto json = req->getJsonObject();
    if (!json || !(*json).isMember("username") || !(*json).isMember("password"))
    {
        // Missing fields
        callback(Err("Invalid input - username or password missing", k400BadRequest));
        return;
    }
    std::string username = Trim((*json)["username"].asString());
    std::string password = Trim((*json)["password"].asString());

    // Load user data (assuming user data stored in a JSON file per user)
    Json::Value userData = LoadJson(FILES_DIR + "/" + Slug(username) + ".json");
    if (userData.isNull() || !userData.isMember("password"))
    {
        // User not found
        callback(Err("User not found or invalid credentials", k401Unauthorized));
        return;
    }
    // Check password (in a real app, use hashing!). Here assume plaintext for simplicity
    if (userData["password"].asString() != password)
    {
        callback(Err("Invalid credentials", k401Unauthorized));
        return;
    }

    // On success, perhaps generate a token or session (simplified here)
    Json::Value respJson;
    respJson["status"] = "ok";
    respJson["username"] = username;
    // You might add a token or session info. For now:
    respJson["message"] = "Login successful";
    callback(Ok(respJson)); // return 200 OK with user info
}

void AuthController::logout(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback)
{
    // Invalidate session or token (not implemented here, just a placeholder)
    Json::Value respJson;
    respJson["status"] = "ok";
    respJson["message"] = "Logged out successfully";
    callback(Ok(respJson));
}

void AuthController::me(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback)
{
    // This endpoint might return the current user's profile.
    // For simplicity, assume some authentication has identified the user (not shown here).
    // If no auth implemented, just respond with an error:
    callback(Err("Not implemented", k501NotImplemented));
}

void AuthController::updateProfile(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback)
{
    // Parse JSON body for profile updates
    auto json = req->getJsonObject();
    if (!json)
    {
        callback(Err("Invalid input", k400BadRequest));
        return;
    }
    // For example, allow updating email or name
    std::string newEmail = Trim((*json)["email"].asString());
    std::string username = ""; // determine the username from session (not implemented here)

    // Load existing user profile
    Json::Value userData = LoadJson(FILES_DIR + "/" + Slug(username) + ".json");
    if (userData.isNull())
    {
        callback(Err("User not found", k404NotFound));
        return;
    }
    if (!newEmail.empty())
    {
        userData["email"] = newEmail;
    }
    // ... handle other profile fields ...

    // Save back to file
    EnsureDir(FILES_DIR); // ensure the directory exists
    if (!SaveJson(FILES_DIR + "/" + Slug(username) + ".json", userData))
    {
        callback(Err("Failed to save profile", k500InternalServerError));
        return;
    }
    callback(Ok()); // return simple OK response
}

void AuthController::postAnnouncement(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback)
{
    // This might be an admin-only action to post a new announcement
    auto json = req->getJsonObject();
    if (!json || !(*json).isMember("announcement"))
    {
        callback(Err("No announcement content", k400BadRequest));
        return;
    }
    std::string text = (*json)["announcement"].asString();
    // Load existing announcements list (e.g., in a JSON file)
    Json::Value announcements = LoadJson(FILES_DIR + "/announcements.json");
    if (announcements.isNull() || !announcements.isArray())
    {
        announcements = Json::Value(Json::arrayValue);
    }
    // Add new announcement (could add timestamp, etc.)
    announcements.append(text);
    EnsureDir(FILES_DIR);
    if (!SaveJson(FILES_DIR + "/announcements.json", announcements))
    {
        callback(Err("Failed to save announcement", k500InternalServerError));
        return;
    }
    callback(Ok()); // return success with no extra content
}

void AuthController::getAnnouncements(const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback)
{
    Json::Value announcements = LoadJson(FILES_DIR + "/announcements.json");
    if (announcements.isNull() || !announcements.isArray())
    {
        // If no announcements, respond with an empty array
        announcements = Json::Value(Json::arrayValue);
    }
    callback(Ok(announcements)); // return announcements array as JSON
}
