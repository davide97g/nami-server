# Touch Sensor Module

## Overview
Touch sensor modules are capacitive touch detection devices that provide a simple digital interface for detecting touch or proximity. These modules are commonly used for user interface applications, replacing mechanical buttons with touch-sensitive surfaces.

## Key Specifications

### General Characteristics
- **Type**: Capacitive touch sensor (typically TTP223 or similar)
- **Operating Voltage**: 2.0V - 5.5V (typically 3.3V or 5V)
- **Output Type**: Digital (HIGH/LOW)
- **Output Signal**: 
  - HIGH when touched
  - LOW when not touched
- **Response Time**: Typically < 100ms
- **Sensitivity**: Adjustable (via onboard potentiometer on some models)

### Pin Configuration
Most touch sensor modules have the following pins:
- **VCC**: Power supply (3.3V or 5V)
- **GND**: Ground
- **OUT/SIG**: Digital output signal
- **A0**: Sensitivity adjustment (optional, on some models)

### Electrical Characteristics
- **Current Consumption**: 
  - Standby: ~1.5 mA
  - Active: ~1.5 - 3 mA
- **Output Logic**:
  - HIGH level: VCC - 0.3V (minimum)
  - LOW level: 0.3V (maximum)
- **Touch Detection**: 
  - Works through non-conductive materials (glass, plastic, etc.)
  - Detection distance: typically 0-5mm

### Features
- **No Mechanical Parts**: Durable and long-lasting
- **Low Power Consumption**: Suitable for battery-powered applications
- **Fast Response**: Quick touch detection
- **Easy Integration**: Simple digital interface
- **Adjustable Sensitivity**: Some models include sensitivity adjustment
- **LED Indicator**: Many modules include an onboard LED for visual feedback

### Operating Modes
Some touch sensor modules support different operating modes:
- **Toggle Mode**: Output toggles on each touch
- **Momentary Mode**: Output is HIGH only while touched (default)

## Usage with ESP32

### Wiring
```
Touch Sensor    ESP32
VCC        ->   3.3V or 5V
GND        ->   GND
OUT/SIG    ->   GPIO (e.g., GPIO 4)
```

### Code Example (Arduino)
```cpp
const int touchPin = 4;  // GPIO 4
int touchState = 0;

void setup() {
  Serial.begin(115200);
  pinMode(touchPin, INPUT);
}

void loop() {
  touchState = digitalRead(touchPin);
  
  if (touchState == HIGH) {
    Serial.println("Touch detected!");
  }
  
  delay(100);
}
```

### ESP32 Native Touch Pins
Note: The ESP32 has 10 built-in capacitive touch sensor GPIOs:
- GPIO 0, 2, 4, 12, 13, 14, 15, 27, 32, 33

These can be used directly without an external touch sensor module using the `touchRead()` function.

## Applications
- User interface buttons
- Proximity detection
- Touch switches
- Interactive displays
- Home automation controls
- Security systems

## Important Notes
- Touch sensors can be affected by electromagnetic interference
- May require calibration for optimal sensitivity
- Works best with clean, dry surfaces
- Some modules may have a small delay before responding after power-on

## Further Documentation

### General Resources
- [Touch Sensor Technology Overview](https://en.wikipedia.org/wiki/Touch_sensor)
- [Capacitive Touch Sensing](https://www.ti.com/lit/an/slaa576a/slaa576a.pdf)

### TTP223 Datasheet
- [TTP223 Datasheet](https://www.digikey.com/en/datasheets/ttmicroelectronics/ttp223) (if using TTP223-based module)

### ESP32 Touch Sensor
- [ESP32 Touch Sensor Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/touch_pad.html)
- [Arduino ESP32 Touch Sensor Examples](https://github.com/espressif/arduino-esp32/tree/master/libraries/ESP32/examples/Touch)

## Product Links
- [Amazon Product Page](https://www.amazon.it/dp/B09VPK9N7F?ref=ppx_yo2ov_dt_b_fed_asin_title)

