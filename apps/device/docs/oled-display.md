# OLED Display Module (SSD1306)

## Overview
The OLED (Organic Light-Emitting Diode) display module is a self-illuminating display that doesn't require a backlight. The SSD1306-based modules are popular for embedded projects due to their low power consumption, high contrast, and compact size.

## Key Specifications

### Display Characteristics
- **Size**: 0.96 inches (diagonal)
- **Resolution**: 128×64 pixels
- **Color**: Monochrome (white/yellow/blue on black background)
- **Pixel Density**: ~133 PPI
- **Viewing Angle**: 160° (wide viewing angle)
- **Contrast Ratio**: Very high (OLED technology)
- **Response Time**: < 1ms (very fast)

### Interface Options
Most modules support both interfaces (selected via jumpers or solder bridges):

1. **I²C Interface** (Most Common)
   - **Default I²C Address**: 0x3C or 0x3D (configurable)
   - **Clock Speed**: Up to 400 kHz (Fast Mode)
   - **Pins Required**: 4 (VCC, GND, SDA, SCL)
   - **Pull-up Resistors**: Usually included on module

2. **SPI Interface**
   - **Clock Speed**: Up to 10 MHz
   - **Pins Required**: 7 (VCC, GND, SDA, SCL, RES, DC, CS)
   - **Faster refresh rate** than I²C

### Electrical Specifications
- **Operating Voltage**: 3.3V or 5V (module dependent)
- **Current Consumption**:
  - Active: ~20-40 mA (depends on content)
  - Standby: < 1 mA
- **Power Supply**: 3.3V - 5V DC
- **Logic Level**: 3.3V or 5V compatible (module dependent)

### Physical Characteristics
- **Dimensions**: Approximately 27mm × 27mm × 4mm
- **Weight**: ~2-3 grams
- **Mounting**: 4 mounting holes (M2 screws)
- **Connector**: 4-pin or 7-pin header (2.54mm pitch)

### Pin Configuration (I²C Mode)
```
Pin Name    Description
VCC         Power supply (3.3V or 5V)
GND         Ground
SDA         I²C Data line
SCL         I²C Clock line
```

### Pin Configuration (SPI Mode)
```
Pin Name    Description
VCC         Power supply (3.3V or 5V)
GND         Ground
D0/SCK      SPI Clock
D1/MOSI     SPI Data
RES         Reset pin
DC          Data/Command select
CS          Chip select
```

## Usage with ESP32

### Wiring (I²C Mode)
```
OLED Display    ESP32
VCC         ->   3.3V or 5V
GND         ->   GND
SDA         ->   GPIO 21 (default I²C SDA)
SCL         ->   GPIO 22 (default I²C SCL)
```

### Code Example (Arduino with Adafruit SSD1306 Library)
```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Serial.begin(115200);
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("Hello, ESP32!"));
  display.display();
}

void loop() {
  // Your code here
}
```

### ESP32 I²C Pins
- **Default SDA**: GPIO 21
- **Default SCL**: GPIO 22
- **Alternative I²C pins**: Can be configured to use other GPIOs

## Features
- **Self-Illuminating**: No backlight required
- **High Contrast**: Deep blacks and bright whites
- **Low Power**: Energy efficient, especially for dark content
- **Fast Refresh**: Suitable for animations
- **Wide Viewing Angle**: 160° viewing angle
- **Compact Size**: Small footprint for embedded projects
- **Easy Integration**: Simple I²C or SPI interface

## Display Capabilities
- **Text**: Multiple font sizes supported
- **Graphics**: Pixel-level control
- **Bitmaps**: Can display custom images
- **Animations**: Fast enough for simple animations
- **Scrolling**: Built-in hardware scrolling support

## Important Notes
- **I²C Address**: Check module documentation for I²C address (usually 0x3C)
- **Voltage Compatibility**: Verify module voltage requirements (3.3V vs 5V)
- **Library Support**: Requires appropriate library (Adafruit SSD1306, U8g2, etc.)
- **Power Consumption**: Higher when displaying bright/white content
- **Lifespan**: OLED displays can experience burn-in with static content over time

## Common Libraries
- **Adafruit SSD1306**: Popular Arduino library
- **U8g2**: Universal graphics library (supports many displays)
- **ESP32 Native**: Can use ESP-IDF drivers directly

## Applications
- Status displays
- Sensor data visualization
- User interfaces
- Notifications
- Small information displays
- IoT device dashboards
- Wearable device displays

## Further Documentation

### Official Resources
- [SSD1306 Datasheet](https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf)
- [Adafruit SSD1306 Library](https://github.com/adafruit/Adafruit_SSD1306)
- [U8g2 Library Documentation](https://github.com/olikraus/u8g2)

### Tutorials and Guides
- [Adafruit SSD1306 Tutorial](https://learn.adafruit.com/monochrome-oled-breakouts)
- [ESP32 OLED Display Guide](https://randomnerdtutorials.com/esp32-ssd1306-oled-display-arduino-ide/)

### Community Resources
- [Arduino Forum - OLED Displays](https://forum.arduino.cc/c/hardware/oled-displays/78)

## Product Links
- [Amazon Product Page](https://www.amazon.it/dp/B0FKLXL3DY?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1)

