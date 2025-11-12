#ifndef WIFI_CONNECTION_H
#define WIFI_CONNECTION_H

#include <WiFi.h>
#include <Adafruit_SSD1306.h>
#include "secrets.h"

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
  display.setCursor(0, 0);
  display.println("Connecting to");
  display.println("WiFi...");
  display.setCursor(0, 20);
  display.println(WIFI_SSID);
  display.display();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(attemptDelay);
    attempts++;

    // Update display with connection progress
    display.fillRect(0, 35, 128, 10, SSD1306_BLACK);
    display.setCursor(0, 35);
    display.print("Attempt ");
    display.print(attempts);
    display.print("/");
    display.print(maxAttempts);
    display.display();
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  if (WiFi.status() == WL_CONNECTED) {
    display.println("WiFi Connected!");
    display.setCursor(0, 12);
    display.println("IP Address:");
    display.setCursor(0, 24);
    display.println(WiFi.localIP());
    display.display();
    delay(2000); // Show success message for 2 seconds
    return true;
  } else {
    display.println("Connection");
    display.setCursor(0, 12);
    display.println("Failed!");
    display.setCursor(0, 24);
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
    display.setCursor(0, 0);
    display.println("WiFi");
    display.setCursor(0, 12);
    display.println("Disconnected");
    display.setCursor(0, 24);
    display.println("Reconnecting...");
    display.display();
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    return false;
  }
  return true;
}

#endif // WIFI_CONNECTION_H

