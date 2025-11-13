#ifndef WEBSOCKET_CLIENT_H
#define WEBSOCKET_CLIENT_H

#include <WebSocketsClient.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include "wifi_connection.h"

#define WEBSOCKET_HOST "raspberrypi.local"
#define WEBSOCKET_PORT 3000
#define WEBSOCKET_PATH "/"
#define INFO_ENDPOINT "http://raspberrypi.local:3000/info"

// Global WebSocket client instance
WebSocketsClient webSocket;

// Global display reference for use in event handler
Adafruit_SSD1306* globalDisplay = nullptr;

/**
 * Display ASCII art on OLED screen
 * Handles line breaks and scrolling for long ASCII art
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param asciiArt The ASCII art string to display
 */
void displayAsciiArt(Adafruit_SSD1306& display, const String& asciiArt) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Display parameters
  const int lineHeight = 8; // Text size 1 uses ~8 pixels per line
  const int maxWidth = 128;
  const int maxLines = 8; // 64 pixels / 8 pixels per line = 8 lines
  const int charWidth = 6; // Approximate character width for text size 1
  const int charsPerLine = maxWidth / charWidth; // ~21 characters per line
  
  // Split ASCII art by newlines
  int lineCount = 0;
  int startPos = 0;
  int yPos = 0;
  
  // Process the message line by line
  while (startPos < asciiArt.length() && lineCount < maxLines) {
    // Find the next newline or end of string
    int newlinePos = asciiArt.indexOf('\n', startPos);
    int endPos = (newlinePos == -1) ? asciiArt.length() : newlinePos;
    
    // Extract the line
    String line = asciiArt.substring(startPos, endPos);
    
    // If line is longer than display width, split it
    while (line.length() > charsPerLine && lineCount < maxLines) {
      String subLine = line.substring(0, charsPerLine);
      display.setCursor(0, yPos);
      display.println(subLine);
      yPos += lineHeight;
      lineCount++;
      
      // Remove processed part from line
      line = line.substring(charsPerLine);
    }
    
    // Display remaining part of line (if any)
    if (line.length() > 0 && lineCount < maxLines) {
      display.setCursor(0, yPos);
      display.println(line);
      yPos += lineHeight;
      lineCount++;
    }
    
    // Move to next line (skip the newline character)
    startPos = (newlinePos == -1) ? asciiArt.length() : newlinePos + 1;
  }
  
  // If there's more content, show indicator
  if (startPos < asciiArt.length()) {
    // Clear last line and show "..."
    yPos -= lineHeight;
    display.fillRect(0, yPos, maxWidth, lineHeight, SSD1306_BLACK);
    display.setCursor(0, yPos);
    display.println("...");
  }
  
  display.display();
}

/**
 * WebSocket event handler - called when events occur
 */
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WebSocket] Disconnected");
      if (globalDisplay) {
        globalDisplay->clearDisplay();
        globalDisplay->setTextSize(1);
        globalDisplay->setTextColor(SSD1306_WHITE);
        
        int x1 = centerText(*globalDisplay, "WebSocket", 0);
        globalDisplay->setCursor(x1, 20);
        globalDisplay->println("WebSocket");
        
        int x2 = centerText(*globalDisplay, "Disconnected", 0);
        globalDisplay->setCursor(x2, 35);
        globalDisplay->println("Disconnected");
        globalDisplay->display();
      }
      break;
    case WStype_CONNECTED:
      Serial.println("[WebSocket] Connected to server!");
      // Send identification message to server
      webSocket.sendTXT("{\"type\":\"identify\",\"client\":\"ESP32\"}");
      break;
    case WStype_TEXT:
      {
        String message = String((char*)payload);
        Serial.print("[WebSocket] Received text: ");
        Serial.println(message);
        
        // Display message on OLED
        if (globalDisplay) {
          // Check if message contains ASCII art patterns (multiple lines, special chars)
          // For ASCII art, we preserve line breaks and display as-is
          bool isAsciiArt = message.indexOf('\n') != -1 || 
                           message.length() > 50; // Likely ASCII art if long or has newlines
          
          if (isAsciiArt) {
            // Display as ASCII art (preserve line breaks, handle scrolling)
            displayAsciiArt(*globalDisplay, message);
          } else {
            // Display as regular message (centered)
            globalDisplay->clearDisplay();
            globalDisplay->setTextSize(1);
            globalDisplay->setTextColor(SSD1306_WHITE);
            
            // Display "Message:" header (centered)
            int xHeader = centerText(*globalDisplay, "Message:", 0);
            globalDisplay->setCursor(xHeader, 5);
            globalDisplay->println("Message:");
            
            // Display the message, wrapping if necessary (centered)
            int lineHeight = 8;
            int maxWidth = 128;
            int maxLines = 6; // Leave some space
            int yPos = 18;
            int charWidth = 6; // Approximate character width for text size 1
            
            // Split message into lines that fit the display width
            int startPos = 0;
            int lineCount = 0;
            
            while (startPos < message.length() && lineCount < maxLines) {
              int charsPerLine = maxWidth / charWidth;
              int endPos = startPos + charsPerLine;
              
              // If message is longer than one line, try to break at a space
              if (endPos < message.length()) {
                int lastSpace = message.lastIndexOf(' ', endPos);
                if (lastSpace > startPos) {
                  endPos = lastSpace;
                }
              }
              
              String line = message.substring(startPos, endPos);
              int xLine = centerText(*globalDisplay, line, 0);
              globalDisplay->setCursor(xLine, yPos);
              globalDisplay->println(line);
              
              yPos += lineHeight;
              lineCount++;
              startPos = endPos;
              
              // Skip space if we broke at a space
              if (startPos < message.length() && message.charAt(startPos) == ' ') {
                startPos++;
              }
            }
            
            // If message was truncated, show "..." (centered)
            if (startPos < message.length()) {
              int xDots = centerText(*globalDisplay, "...", 0);
              globalDisplay->setCursor(xDots, yPos);
              globalDisplay->println("...");
            }
            
            globalDisplay->display();
          }
        }
      }
      break;
    case WStype_BIN:
      Serial.print("[WebSocket] Received binary data, length: ");
      Serial.println(length);
      break;
    case WStype_ERROR:
      Serial.println("[WebSocket] Error occurred");
      break;
    default:
      break;
  }
}

/**
 * Connects to WebSocket server and logs connection status
 * @param display Reference to the Adafruit_SSD1306 display object
 * @return true if connection successful, false otherwise
 */
bool connectWebSocket(Adafruit_SSD1306& display) {
  // Check WiFi connection first
  if (!checkWiFiConnection(display)) {
    Serial.println("[WebSocket] WiFi not connected");
    return false;
  }

  // Store display reference for use in event handler
  globalDisplay = &display;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  int x1 = centerText(display, "Connecting", 0);
  display.setCursor(x1, 20);
  display.println("Connecting");
  
  int x2 = centerText(display, "WebSocket...", 0);
  display.setCursor(x2, 35);
  display.println("WebSocket...");
  display.display();

  // Initialize WebSocket client
  webSocket.begin(WEBSOCKET_HOST, WEBSOCKET_PORT, WEBSOCKET_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);

  // Try to connect (with timeout)
  unsigned long startTime = millis();
  const unsigned long timeout = 10000; // 10 seconds timeout

  while (!webSocket.isConnected() && (millis() - startTime < timeout)) {
    webSocket.loop();
    delay(100);
  }

  if (webSocket.isConnected()) {
    Serial.println("[WebSocket] Connection succeeded!");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    int x1 = centerText(display, "WebSocket", 0);
    display.setCursor(x1, 20);
    display.println("WebSocket");
    
    int x2 = centerText(display, "Connected!", 0);
    display.setCursor(x2, 35);
    display.println("Connected!");
    display.display();
    delay(2000);
    return true;
  } else {
    Serial.println("[WebSocket] Connection failed!");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    int x1 = centerText(display, "WebSocket", 0);
    display.setCursor(x1, 20);
    display.println("WebSocket");
    
    int x2 = centerText(display, "Failed!", 0);
    display.setCursor(x2, 35);
    display.println("Failed!");
    display.display();
    delay(2000);
    return false;
  }
}

/**
 * Fetches system info from /info endpoint and displays key information
 * @param display Reference to the Adafruit_SSD1306 display object
 * @return true if successful, false otherwise
 */
bool fetchAndDisplaySystemInfo(Adafruit_SSD1306& display) {
  // Check WiFi connection first
  if (!checkWiFiConnection(display)) {
    Serial.println("[Info] WiFi not connected");
    return false;
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  int x1 = centerText(display, "Fetching", 0);
  display.setCursor(x1, 20);
  display.println("Fetching");
  
  int x2 = centerText(display, "system info...", 0);
  display.setCursor(x2, 35);
  display.println("system info...");
  display.display();

  HTTPClient http;
  String response = "";

  // Begin HTTP request
  http.begin(INFO_ENDPOINT);
  http.setTimeout(10000); // 10 second timeout

  // Make GET request
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    // Success - read the response
    response = http.getString();
    Serial.println("[Info] Response received:");
    Serial.println(response);
  } else {
    Serial.print("[Info] HTTP error code: ");
    Serial.println(httpCode);
    http.end();
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    int x1 = centerText(display, "HTTP Error", 0);
    display.setCursor(x1, 15);
    display.println("HTTP Error");
    
    String codeStr = "Code: " + String(httpCode);
    int x2 = centerText(display, codeStr, 0);
    display.setCursor(x2, 30);
    display.print("Code: ");
    display.println(httpCode);
    display.display();
    delay(3000);
    return false;
  }

  http.end();

  // Parse JSON response
  StaticJsonDocument<4096> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.print("[Info] JSON parse error: ");
    Serial.println(error.c_str());
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    int x1 = centerText(display, "Parse Error", 0);
    display.setCursor(x1, 20);
    display.println("Parse Error");
    
    String errorStr = String(error.c_str());
    int x2 = centerText(display, errorStr, 0);
    display.setCursor(x2, 35);
    display.println(error.c_str());
    display.display();
    delay(3000);
    return false;
  }

  // Extract and display key information
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  int lineHeight = 8; // Text size 1 uses ~8 pixels per line
  int yPos = 0;

  // System info - Hostname with bitmap
  if (doc.containsKey("system")) {
    JsonObject system = doc["system"];
    display.setCursor(0, yPos);
    String hostname = system["hostname"] | "Unknown";
    if (hostname.length() > 16) {
      hostname = hostname.substring(0, 16);
    }
    // Display hostname text
    display.print(hostname);
    yPos += lineHeight;
    
    // Platform
    display.setCursor(0, yPos);
    String platform = system["platform"] | "Unknown";
    if (platform.length() > 16) {
      platform = platform.substring(0, 16);
    }
    display.println(platform);
    yPos += lineHeight;
  }

  // CPU info
  if (doc.containsKey("cpu")) {
    JsonObject cpu = doc["cpu"];
    display.setCursor(0, yPos);
    int cores = cpu["cores"] | 0;
    float speed = cpu["speed"] | 0.0;
    display.print("CPU: ");
    display.print(cores);
    display.print("C @ ");
    display.print((int)speed);
    display.print("MHz");
    yPos += lineHeight;
  }

  // Memory info
  if (doc.containsKey("memory")) {
    JsonObject memory = doc["memory"];
    display.setCursor(0, yPos);
    float totalMB = (memory["total"] | 0) / (1024.0 * 1024.0);
    float usedMB = (memory["used"] | 0) / (1024.0 * 1024.0);
    display.print("RAM: ");
    display.print((int)usedMB);
    display.print("/");
    display.print((int)totalMB);
    display.print("MB");
    yPos += lineHeight;
  }

  // Uptime info
  if (doc.containsKey("system") && yPos < 56) {
    JsonObject system = doc["system"];
    display.setCursor(0, yPos);
    unsigned long uptime = system["uptime"] | 0;
    unsigned long hours = uptime / 3600;
    unsigned long minutes = (uptime % 3600) / 60;
    display.print("Up: ");
    display.print(hours);
    display.print("h ");
    display.print(minutes);
    display.print("m");
    yPos += lineHeight;
  }

  // Network info (first interface) - only if space available
  if (doc.containsKey("network") && yPos < 56) {
    JsonObject network = doc["network"];
    // Try to find en0 (Ethernet) or first available interface
    if (network.containsKey("en0")) {
      JsonArray en0 = network["en0"];
      if (en0.size() > 0) {
        JsonObject en0Obj = en0[0];
        if (en0Obj.containsKey("address")) {
          display.setCursor(0, yPos);
          String ip = en0Obj["address"].as<String>();
          if (ip.length() > 16) {
            ip = ip.substring(0, 16);
          }
          display.println(ip);
        }
      }
    }
  }

  display.display();

  // Log additional info to Serial
  Serial.println("[Info] System Information:");
  if (doc.containsKey("system")) {
    JsonObject system = doc["system"];
    Serial.print("  Hostname: ");
    Serial.println(system["hostname"].as<String>());
    Serial.print("  Platform: ");
    Serial.println(system["platform"].as<String>());
    Serial.print("  Arch: ");
    Serial.println(system["arch"].as<String>());
    Serial.print("  Uptime: ");
    Serial.print(system["uptime"].as<unsigned long>());
    Serial.println(" seconds");
  }
  if (doc.containsKey("cpu")) {
    JsonObject cpu = doc["cpu"];
    Serial.print("  CPU Model: ");
    Serial.println(cpu["model"].as<String>());
    Serial.print("  Cores: ");
    Serial.println(cpu["cores"].as<int>());
    Serial.print("  Speed: ");
    Serial.print(cpu["speed"].as<float>());
    Serial.println(" MHz");
  }
  if (doc.containsKey("memory")) {
    JsonObject memory = doc["memory"];
    Serial.print("  Memory Total: ");
    Serial.print((memory["total"].as<unsigned long>() / (1024 * 1024)));
    Serial.println(" MB");
    Serial.print("  Memory Used: ");
    Serial.print((memory["used"].as<unsigned long>() / (1024 * 1024)));
    Serial.println(" MB");
    Serial.print("  Memory Free: ");
    Serial.print((memory["free"].as<unsigned long>() / (1024 * 1024)));
    Serial.println(" MB");
  }

  return true;
}

/**
 * Maintains WebSocket connection (call this in loop)
 */
void maintainWebSocket() {
  if (webSocket.isConnected()) {
    webSocket.loop();
  }
}

#endif // WEBSOCKET_CLIENT_H

