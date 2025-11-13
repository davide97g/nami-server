#ifndef WIFI_CONNECTION_H
#define WIFI_CONNECTION_H

#include <WiFi.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include "secrets.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

/**
 * Helper function to center text on the display
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param text The text string to center
 * @param y The y-coordinate for the text
 * @return The x-coordinate where the text should start
 */
int centerText(Adafruit_SSD1306& display, const char* text, int y) {
  display.setTextSize(1);
  int16_t x1, y1;
  uint16_t w, h;
  display.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  return (SCREEN_WIDTH - w) / 2;
}

/**
 * Helper function to center text on the display (String version)
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param text The text string to center
 * @param y The y-coordinate for the text
 * @return The x-coordinate where the text should start
 */
int centerText(Adafruit_SSD1306& display, const String& text, int y) {
  return centerText(display, text.c_str(), y);
}

/**
 * Attempts to connect to WiFi and displays connection status on the OLED display
 * @param display Reference to the Adafruit_SSD1306 display object
 * @param maxAttempts Maximum number of connection attempts (default: 20)
 * @param attemptDelay Delay between attempts in milliseconds (default: 500)
 * @return true if connection successful, false otherwise
 */
bool connectToWiFi(Adafruit_SSD1306& display, int maxAttempts = 20, int attemptDelay = 500) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Center "Connecting to WiFi..."
  int x1 = centerText(display, "Connecting to", 0);
  display.setCursor(x1, 10);
  display.println("Connecting to");
  
  int x2 = centerText(display, "WiFi...", 0);
  display.setCursor(x2, 20);
  display.println("WiFi...");
  
  // Center SSID
  String ssidStr = String(WIFI_SSID);
  int x3 = centerText(display, ssidStr, 0);
  display.setCursor(x3, 35);
  display.println(WIFI_SSID);
  display.display();

  // Properly initialize WiFi with delays to avoid first-boot failures
  WiFi.disconnect(true);  // Disconnect any previous connection
  delay(100);
  WiFi.mode(WIFI_STA);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  delay(500);  // Give WiFi hardware time to initialize before checking status

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(attemptDelay);
    attempts++;

    // Update display with connection progress (centered)
    display.fillRect(0, 50, 128, 10, SSD1306_BLACK);
    String attemptStr = "Attempt " + String(attempts) + "/" + String(maxAttempts);
    int x4 = centerText(display, attemptStr, 0);
    display.setCursor(x4, 50);
    display.print("Attempt ");
    display.print(attempts);
    display.print("/");
    display.print(maxAttempts);
    display.display();
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  if (WiFi.status() == WL_CONNECTED) {
    // Center success messages
    int x5 = centerText(display, "WiFi Connected!", 0);
    display.setCursor(x5, 10);
    display.println("WiFi Connected!");
    
    int x6 = centerText(display, "IP Address:", 0);
    display.setCursor(x6, 25);
    display.println("IP Address:");
    
    String ipStr = WiFi.localIP().toString();
    int x7 = centerText(display, ipStr, 0);
    display.setCursor(x7, 40);
    display.println(ipStr);
    display.display();
    delay(2000); // Show success message for 2 seconds
    return true;
  } else {
    // Center failure messages
    int x8 = centerText(display, "Connection", 0);
    display.setCursor(x8, 10);
    display.println("Connection");
    
    int x9 = centerText(display, "Failed!", 0);
    display.setCursor(x9, 25);
    display.println("Failed!");
    
    int x10 = centerText(display, "Retrying...", 0);
    display.setCursor(x10, 40);
    display.println("Retrying...");
    display.display();
    delay(2000); // Show failure message for 2 seconds
    return false;
  }
}

/**
 * Checks if WiFi is still connected and attempts to reconnect if needed
 * @param display Reference to the Adafruit_SSD1306 display object
 * @return true if connected, false if disconnected
 */
bool checkWiFiConnection(Adafruit_SSD1306& display) {
  if (WiFi.status() != WL_CONNECTED) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    // Center reconnection messages
    int x1 = centerText(display, "WiFi", 0);
    display.setCursor(x1, 10);
    display.println("WiFi");
    
    int x2 = centerText(display, "Disconnected", 0);
    display.setCursor(x2, 25);
    display.println("Disconnected");
    
    int x3 = centerText(display, "Reconnecting...", 0);
    display.setCursor(x3, 40);
    display.println("Reconnecting...");
    display.display();
    
    // Properly reinitialize WiFi
    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_STA);
    delay(100);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(500);
    return false;
  }
  return true;
}

#endif // WIFI_CONNECTION_H

