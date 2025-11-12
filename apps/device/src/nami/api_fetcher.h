#ifndef API_FETCHER_H
#define API_FETCHER_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include "wifi_connection.h"

// PokéAPI base URL
#define POKEAPI_BASE_URL "https://pokeapi.co/api/v2/pokemon/"
// Maximum Pokémon ID (as of Gen 8, there are 1010+ Pokémon)
#define MAX_POKEMON_ID 1010

/**
 * Fetches a random Pokémon from PokéAPI and returns the response as a string
 * @param display Reference to the Adafruit_SSD1306 display object for status updates
 * @return String containing the API response, or empty string on error
 */
String fetchRandomPokemon(Adafruit_SSD1306& display) {
  // Check WiFi connection first
  if (!checkWiFiConnection(display)) {
    return "";
  }

  HTTPClient http;
  String response = "";

  // Generate random Pokémon ID
  int randomId = random(1, MAX_POKEMON_ID + 1);
  
  // Show fetching status
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Fetching");
  display.setCursor(0, 12);
  display.print("Pokemon #");
  display.println(randomId);
  display.display();

  // Build API URL
  String apiUrl = String(POKEAPI_BASE_URL) + String(randomId) + "/";

  // Begin HTTP request
  http.begin(apiUrl);
  http.setTimeout(15000); // 15 second timeout for PokéAPI

  // Make GET request
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    // Success - read the response
    response = http.getString();
  } else {
    // Error occurred
    response = "";
  }

  http.end();
  return response;
}

/**
 * Displays a placeholder for the Pokémon sprite on the OLED
 * 
 * NOTE: Full sprite display would require:
 * - PNG decoder library (e.g., PNGdec)
 * - Downloading the sprite image from spriteUrl
 * - Decoding PNG to bitmap format
 * - Converting to 1-bit monochrome for OLED
 * - Memory management for image data
 * 
 * For now, this displays a simple placeholder pattern to indicate
 * where the sprite would appear.
 * 
 * @param spriteUrl The URL of the sprite image (currently unused, kept for future implementation)
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param x X position on display
 * @param y Y position on display
 */
void displayPokemonSprite(const String& spriteUrl, Adafruit_SSD1306& display, int x, int y) {
  // Draw a border around sprite area (32x32 pixels)
  display.drawRect(x, y, 32, 32, SSD1306_WHITE);
  
  // Draw a simple checkerboard pattern to indicate sprite area
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      if ((i + j) % 2 == 0) {
        display.fillRect(x + i * 8, y + j * 8, 8, 8, SSD1306_WHITE);
      }
    }
  }
  
  // Future enhancement: Download spriteUrl, decode PNG, and display actual sprite
  // This would require: HTTPClient to download, PNGdec library to decode, 
  // and conversion to 1-bit bitmap format for OLED display
}

/**
 * Parses Pokémon JSON response and displays name, ID, and sprite info
 * @param jsonString The JSON string to parse
 * @param display Reference to the Adafruit_SSD1306 display object
 */
void displayPokemonData(const String& jsonString, Adafruit_SSD1306& display) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  if (jsonString.length() == 0) {
    display.println("API Error");
    display.setCursor(0, 12);
    display.println("No data");
    display.display();
    return;
  }

  // Try to parse JSON - PokéAPI responses can be large, so we need a bigger buffer
  StaticJsonDocument<4096> doc;
  DeserializationError error = deserializeJson(doc, jsonString);

  if (error) {
    // If JSON parsing fails, show error
    display.println("Parse Error");
    display.setCursor(0, 12);
    display.print("Code: ");
    display.println(error.c_str());
    display.display();
    return;
  }

  // Extract Pokémon data
  String pokemonName = "";
  int pokemonId = 0;
  String spriteUrl = "";

  if (doc.containsKey("name")) {
    pokemonName = doc["name"].as<String>();
    // Capitalize first letter
    if (pokemonName.length() > 0) {
      pokemonName.setCharAt(0, toupper(pokemonName.charAt(0)));
    }
  }

  if (doc.containsKey("id")) {
    pokemonId = doc["id"].as<int>();
  }

  if (doc.containsKey("sprites")) {
    JsonObject sprites = doc["sprites"];
    if (sprites.containsKey("front_default")) {
      spriteUrl = sprites["front_default"].as<String>();
    }
  }

  // Display Pokémon information
  // Layout: Name and ID on left, sprite placeholder on right (32x32)
  display.setTextSize(1);
  
  // Display name (left side, top)
  display.setCursor(0, 0);
  String displayName = pokemonName;
  if (displayName.length() > 10) {
    displayName = displayName.substring(0, 10);
  }
  display.println(displayName);
  
  // Display ID (left side, below name)
  display.setCursor(0, 10);
  display.print("#");
  display.print(pokemonId);
  
  // Display sprite placeholder on the right side (32x32 pixels)
  // Position: x=96 (128-32), y=0
  if (spriteUrl.length() > 0) {
    displayPokemonSprite(spriteUrl, display, 96, 0);
  }
  
  // Display type information (left side, below ID)
  if (doc.containsKey("types")) {
    JsonArray types = doc["types"];
    if (types.size() > 0) {
      JsonObject firstType = types[0];
      if (firstType.containsKey("type")) {
        JsonObject typeObj = firstType["type"];
        if (typeObj.containsKey("name")) {
          String typeName = typeObj["name"].as<String>();
          if (typeName.length() > 0) {
            typeName.setCharAt(0, toupper(typeName.charAt(0)));
          }
          display.setCursor(0, 20);
          display.print("Type: ");
          display.println(typeName);
        }
      }
    }
  }
  
  // Display height/weight if available (left side, bottom)
  if (doc.containsKey("height") && doc.containsKey("weight")) {
    int height = doc["height"].as<int>(); // in decimeters
    int weight = doc["weight"].as<int>(); // in hectograms
    display.setCursor(0, 30);
    display.print("H:");
    display.print(height / 10.0, 1);
    display.print("m W:");
    display.print(weight / 10.0, 1);
    display.print("kg");
  }

  display.display();
}

/**
 * Fetches a random Pokémon and displays it on the OLED display
 * @param display Reference to the Adafruit_SSD1306 display object
 * @return true if successful, false otherwise
 */
bool fetchAndDisplayApi(Adafruit_SSD1306& display) {
  String response = fetchRandomPokemon(display);
  displayPokemonData(response, display);
  return response.length() > 0;
}

#endif // API_FETCHER_H

