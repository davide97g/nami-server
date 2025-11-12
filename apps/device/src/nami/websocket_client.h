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
        globalDisplay->setCursor(0, 0);
        globalDisplay->println("WebSocket");
        globalDisplay->setCursor(0, 12);
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
          globalDisplay->clearDisplay();
          globalDisplay->setTextSize(1);
          globalDisplay->setTextColor(SSD1306_WHITE);
          
          // Display "Message:" header
          globalDisplay->setCursor(0, 0);
          globalDisplay->println("Message:");
          
          // Display the message, wrapping if necessary
          int lineHeight = 8;
          int maxWidth = 128;
          int maxLines = 7; // Leave some space
          int yPos = 12;
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
            globalDisplay->setCursor(0, yPos);
            globalDisplay->println(line);
            
            yPos += lineHeight;
            lineCount++;
            startPos = endPos;
            
            // Skip space if we broke at a space
            if (startPos < message.length() && message.charAt(startPos) == ' ') {
              startPos++;
            }
          }
          
          // If message was truncated, show "..."
          if (startPos < message.length()) {
            globalDisplay->setCursor(0, yPos);
            globalDisplay->println("...");
          }
          
          globalDisplay->display();
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
  display.setCursor(0, 0);
  display.println("Connecting");
  display.setCursor(0, 12);
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
    display.setCursor(0, 0);
    display.println("WebSocket");
    display.setCursor(0, 12);
    display.println("Connected!");
    display.display();
    delay(2000);
    return true;
  } else {
    Serial.println("[WebSocket] Connection failed!");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("WebSocket");
    display.setCursor(0, 12);
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
  display.setCursor(0, 0);
  display.println("Fetching");
  display.setCursor(0, 12);
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
    display.setCursor(0, 0);
    display.println("HTTP Error");
    display.setCursor(0, 12);
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
    display.setCursor(0, 0);
    display.println("Parse Error");
    display.setCursor(0, 12);
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

