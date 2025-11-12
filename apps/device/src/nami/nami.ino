#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "wifi_connection.h"
#include "websocket_client.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Bitmap data - 40x30px
const unsigned char epd_bitmap_25 [] PROGMEM = {
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
	0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x00, 0x01, 0x80, 0x3c, 0x00, 0x00, 0x01, 0x80, 0x7c, 
	0x00, 0x00, 0x01, 0x0c, 0xf8, 0x00, 0x00, 0x07, 0x9d, 0xf0, 0x00, 0x00, 0x0f, 0xfb, 0xe0, 0x00, 
	0x00, 0x0f, 0xf9, 0xc0, 0x00, 0x00, 0x1f, 0xb8, 0xe0, 0x00, 0x00, 0x1f, 0x3c, 0x60, 0x00, 0x00, 
	0x0f, 0xfe, 0xc0, 0x00, 0x00, 0x17, 0xfc, 0x00, 0x00, 0x00, 0x03, 0xdf, 0x00, 0x00, 0x00, 0x01, 
	0xb6, 0x00, 0x00, 0x00, 0x01, 0xcf, 0x00, 0x00, 0x00, 0x00, 0xfe, 0x00, 0x00, 0x00, 0x00, 0x1e, 
	0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

// System info fetch interval (in milliseconds)
#define INFO_FETCH_INTERVAL 30000  // Fetch every 30 seconds
unsigned long lastInfoFetch = 0;

void setup() {
  // Initialize Serial for logging
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== Nami ESP32 Starting ===");

  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS);
  display.clearDisplay();

  // --- Startup Display ---
  // Display "nami" text with bitmap
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("nami");
  // Calculate text width: approximately 6 pixels per character
  int textWidth = 4 * 6; // "nami" is 4 characters
  // Display bitmap right after text (40x30px bitmap), aligned with text
  display.drawXBitmap(textWidth + 2, 0, epd_bitmap_25, 40, 30, SSD1306_WHITE);
  display.display();
  
  // 2 second delay
  delay(2000);

  // --- WiFi Connection ---
  // Connect to WiFi and display status on screen
  bool wifiConnected = connectToWiFi(display);
  
  // Only proceed with other logic after WiFi connection succeeds
  if (!wifiConnected) {
    // If connection failed, retry once more
    delay(1000);
    wifiConnected = connectToWiFi(display);
  }

  // Wait for WiFi connection before proceeding
  // If still not connected, show error and wait
  if (!wifiConnected) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("WiFi Failed");
    display.setCursor(0, 12);
    display.println("Check config");
    display.setCursor(0, 24);
    display.println("Restarting...");
    display.display();
    delay(3000);
    ESP.restart(); // Restart ESP32 to retry connection
    return;
  }

  // Clear display after successful WiFi connection
  display.clearDisplay();
  display.display();
  delay(500);

  // --- WebSocket Connection ---
  Serial.println("[Setup] Connecting to WebSocket...");
  bool wsConnected = connectWebSocket(display);
  if (wsConnected) {
    Serial.println("[Setup] WebSocket connection succeeded!");
  } else {
    Serial.println("[Setup] WebSocket connection failed!");
  }

  delay(1000);

  // --- Fetch System Info ---
  Serial.println("[Setup] Fetching system info from /info endpoint...");
  fetchAndDisplaySystemInfo(display);
  lastInfoFetch = millis();
}

void loop() {
  // --- Maintain WebSocket Connection ---
  maintainWebSocket();

  // --- System Info Fetching ---
  unsigned long currentTime = millis();
  
  // Check if it's time to fetch new data
  if (currentTime - lastInfoFetch >= INFO_FETCH_INTERVAL) {
    fetchAndDisplaySystemInfo(display);
    lastInfoFetch = currentTime;
  }
  
  // Small delay to prevent excessive CPU usage
  delay(100);
}

