#ifndef POKEMON_DISPLAY_H
#define POKEMON_DISPLAY_H

#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

/**
 * Display Pokemon bitmap on OLED screen
 * First line shows "#{id} {name}" (e.g., "#1 bulbasaur")
 * Bitmap is centered horizontally and vertically based on its size
 * 
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param pokemonId Pokemon ID number
 * @param pokemonName Pokemon name
 * @param width Bitmap width in pixels (must be multiple of 8)
 * @param height Bitmap height in pixels
 * @param bitmapData Array of bytes representing the bitmap (1-bit per pixel, MSB first)
 * @param bitmapSize Size of bitmapData array in bytes
 */
void displayPokemonBitmap(
  Adafruit_SSD1306& display,
  int pokemonId,
  const String& pokemonName,
  int width,
  int height,
  const uint8_t* bitmapData,
  size_t bitmapSize
) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Calculate expected bitmap size
  int bytesPerRow = width / 8;
  int expectedSize = bytesPerRow * height;
  
  // Validate bitmap size
  if (bitmapSize < expectedSize) {
    Serial.print("[Pokemon] Error: Bitmap size mismatch. Expected: ");
    Serial.print(expectedSize);
    Serial.print(", Got: ");
    Serial.println(bitmapSize);
    
    display.setCursor(0, 20);
    display.println("Bitmap Error");
    display.display();
    return;
  }
  
  // Display Pokemon name and ID on first line
  String header = "#" + String(pokemonId) + " " + pokemonName;
  header.toLowerCase(); // Convert to lowercase for display
  
  // Truncate header if too long (max ~21 chars for 128px width)
  if (header.length() > 21) {
    header = header.substring(0, 18) + "...";
  }
  
  // Center the header text
  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(header.c_str(), 0, 0, &x1, &y1, &w, &h);
  int xHeader = (128 - w) / 2;
  display.setCursor(xHeader, 0);
  display.println(header);
  
  // Calculate bitmap position (centered horizontally and vertically)
  // Leave space for header (8 pixels) and some padding
  int availableHeight = 64 - 8; // Screen height minus header line
  int availableWidth = 128;
  
  int xBitmap = (availableWidth - width) / 2;
  int yBitmap = 8 + (availableHeight - height) / 2; // Start after header
  
  // Ensure bitmap doesn't go out of bounds
  if (xBitmap < 0) xBitmap = 0;
  if (yBitmap < 8) yBitmap = 8;
  if (xBitmap + width > 128) xBitmap = 128 - width;
  if (yBitmap + height > 64) yBitmap = 64 - height;
  
  // Draw bitmap pixel by pixel manually to ensure correct display
  // Our bitmap data is in MSB-first format (1 byte = 8 pixels horizontally)
  // Each byte represents 8 horizontal pixels, with MSB being the leftmost pixel
  // bytesPerRow is already declared above
  
  for (int y = 0; y < height; y++) {
    for (int x = 0; x < bytesPerRow; x++) {
      uint8_t byte = bitmapData[y * bytesPerRow + x];
      
      // Extract each bit from the byte (MSB first)
      for (int bit = 0; bit < 8; bit++) {
        int pixelX = x * 8 + bit;
        if (pixelX >= width) break; // Don't draw beyond bitmap width
        
        // Check if bit is set (MSB first: bit 7 is leftmost)
        bool pixelOn = (byte & (1 << (7 - bit))) != 0;
        
        // Draw pixel at screen position
        int screenX = xBitmap + pixelX;
        int screenY = yBitmap + y;
        
        if (pixelOn) {
          display.drawPixel(screenX, screenY, SSD1306_WHITE);
        }
      }
    }
  }
  
  display.display();
  
  Serial.print("[Pokemon] Displayed: #");
  Serial.print(pokemonId);
  Serial.print(" ");
  Serial.print(pokemonName);
  Serial.print(" (");
  Serial.print(width);
  Serial.print("x");
  Serial.print(height);
  Serial.print(", ");
  Serial.print(bitmapSize);
  Serial.println(" bytes)");
}

/**
 * Parse Pokemon bitmap JSON and display it
 * Expected JSON format:
 * {
 *   "type": "pokemon_bitmap",
 *   "data": {
 *     "pokemonId": 1,
 *     "pokemonName": "bulbasaur",
 *     "width": 128,
 *     "height": 64,
 *     "bitmapData": [0x00, 0x01, ...]
 *   }
 * }
 * 
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param jsonString JSON string containing Pokemon bitmap data
 * @return true if successfully parsed and displayed, false otherwise
 */
bool parseAndDisplayPokemonBitmap(Adafruit_SSD1306& display, const String& jsonString) {
  StaticJsonDocument<8192> doc; // Large enough for bitmap data + metadata
  
  DeserializationError error = deserializeJson(doc, jsonString);
  
  if (error) {
    Serial.print("[Pokemon] JSON parse error: ");
    Serial.println(error.c_str());
    return false;
  }
  
  // Check if this is a Pokemon bitmap message
  if (!doc.containsKey("type") || doc["type"] != "pokemon_bitmap") {
    return false;
  }
  
  if (!doc.containsKey("data")) {
    Serial.println("[Pokemon] Missing 'data' field");
    return false;
  }
  
  JsonObject data = doc["data"];
  
  // Extract Pokemon information
  int pokemonId = data["pokemonId"] | 0;
  String pokemonName = data["pokemonName"] | "unknown";
  int width = data["width"] | 0;
  int height = data["height"] | 0;
  
  if (pokemonId == 0 || width == 0 || height == 0) {
    Serial.println("[Pokemon] Invalid Pokemon data");
    return false;
  }
  
  // Extract bitmap data array
  if (!data.containsKey("bitmapData") || !data["bitmapData"].is<JsonArray>()) {
    Serial.println("[Pokemon] Missing or invalid bitmapData array");
    return false;
  }
  
  JsonArray bitmapArray = data["bitmapData"];
  size_t bitmapSize = bitmapArray.size();
  
  if (bitmapSize == 0) {
    Serial.println("[Pokemon] Empty bitmap data");
    return false;
  }
  
  // Allocate buffer for bitmap data
  uint8_t* bitmapData = new uint8_t[bitmapSize];
  if (!bitmapData) {
    Serial.println("[Pokemon] Failed to allocate memory for bitmap");
    return false;
  }
  
  // Copy bitmap data from JSON array
  for (size_t i = 0; i < bitmapSize; i++) {
    bitmapData[i] = bitmapArray[i].as<uint8_t>();
  }
  
  // Display the bitmap
  displayPokemonBitmap(display, pokemonId, pokemonName, width, height, bitmapData, bitmapSize);
  
  // Free allocated memory
  delete[] bitmapData;
  
  return true;
}

#endif // POKEMON_DISPLAY_H

