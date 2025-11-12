# Nami - ESP32 OLED Rain Animation

An ESP32 Arduino project that displays a stylish intro animation followed by a rain effect on an OLED display (SSD1306).

## Features

- **Intro Animation**: Displays "Davide Ghiotto" with a scaling text effect
- **Rain Animation**: Smooth rain effect with 30 animated raindrops falling at varying speeds
- **OLED Display**: 128x64 pixel SSD1306 OLED display support
- **Automated Scripts**: Convenient shell scripts for compiling, uploading, and monitoring

## Hardware Requirements

- ESP32 development board (ESP32 DevKit)
- SSD1306 OLED display (128x64)
- Wiring connections:
  - SDA → GPIO 21
  - SCL → GPIO 22
  - VCC → 3.3V
  - GND → GND

## Software Requirements

- [Arduino CLI](https://arduino.github.io/arduino-cli/) installed and configured
- ESP32 board support package for Arduino CLI
- `screen` utility (for serial monitoring on macOS/Linux)

## Installation

1. **Install Arduino CLI** (if not already installed):

   ```bash
   brew install arduino-cli  # macOS
   # or follow instructions at https://arduino.github.io/arduino-cli/
   ```

2. **Install ESP32 board support**:

   ```bash
   arduino-cli core update-index
   arduino-cli core install esp32:esp32
   ```

3. **Install required libraries** (automated):

   ```bash
   ./scripts/install-libraries.sh
   ```

   Or install manually:

   ```bash
   arduino-cli lib install "Adafruit GFX Library"
   arduino-cli lib install "Adafruit SSD1306"
   ```

4. **Make scripts executable**:
   ```bash
   chmod +x scripts/*.sh
   ```

## Usage

### Install Libraries

Install all required libraries automatically:

```bash
./scripts/install-libraries.sh
```

This script reads `libraries.txt` and installs all listed libraries. You can also view the library list in `libraries.txt` to see what's required.

### Compile the project

```bash
./scripts/compile.sh
```

### Upload to ESP32

```bash
./scripts/upload.sh
```

The upload script automatically detects the ESP32 port. Make sure your ESP32 is connected via USB.

### Compile and Upload (combined)

```bash
./scripts/compile-and-upload.sh
```

### Serial Monitor

Open the serial monitor to view debug output:

```bash
./scripts/serial-monitor.sh
```

You can specify a custom baud rate (default is 115200):

```bash
./scripts/serial-monitor.sh 9600
```

Press `Ctrl+A` then `K` to exit the serial monitor.

## Project Structure

```
nami/
├── src/
│   └── nami/
│       ├── nami.ino              # Main Arduino sketch
│       ├── wifi_connection.h    # WiFi connection logic
│       ├── secrets.h            # WiFi credentials (gitignored)
│       └── secrets.h.example    # Template for secrets.h
├── arduino-cli.yaml      # Arduino CLI configuration
├── libraries.txt         # Library dependencies list
├── scripts/
│   ├── compile.sh        # Compile script
│   ├── upload.sh         # Upload script
│   ├── compile-and-upload.sh  # Combined compile and upload
│   ├── install-libraries.sh   # Install all required libraries
│   └── serial-monitor.sh # Serial monitor script
└── README.md             # This file
```

## Configuration

The project uses the following configuration:

- **Board**: ESP32 DevKit (`esp32:esp32:esp32dev`)
- **Display**: SSD1306 OLED (128x64) at I2C address 0x3C
- **I2C Pins**: SDA=GPIO 21, SCL=GPIO 22
- **Raindrops**: 30 drops with speeds between 2-6 pixels per frame
- **Frame Rate**: ~20 FPS (50ms delay per frame)

You can modify these settings in `src/nami/nami.ino`:

- `NUM_DROPS`: Number of raindrops (line 13)
- `SCREEN_ADDRESS`: I2C address of the OLED (line 9)
- Frame delay: Adjust the `delay(50)` value in the `loop()` function (line 105)

## Handling Sensitive Data (WiFi Credentials, etc.)

To keep sensitive information like WiFi credentials out of your source code:

1. **Copy the template file**:
   ```bash
   cp src/nami/secrets.h.example src/nami/secrets.h
   ```

2. **Edit `src/nami/secrets.h`** with your actual credentials:
   ```cpp
   #define WIFI_SSID "your_actual_wifi_name"
   #define WIFI_PASSWORD "your_actual_password"
   ```

3. **Include it in your code**:
   ```cpp
   #include "secrets.h"
   // Now you can use WIFI_SSID and WIFI_PASSWORD
   ```

**Important**: 
- `src/nami/secrets.h` is already in `.gitignore` and will **never be committed** to version control
- `src/nami/secrets.h.example` is a template that can be safely committed
- WiFi connection logic is in `src/nami/wifi_connection.h` and is automatically used in the main sketch

## Troubleshooting

### Board not detected

- Ensure the ESP32 is properly connected via USB
- Check that USB drivers are installed
- Try unplugging and reconnecting the board
- Run `arduino-cli board list` to see available boards

### Upload fails

- Make sure the ESP32 is in bootloader mode (some boards require holding BOOT button during upload)
- Check USB cable (data cable, not just charging cable)
- Verify the correct port is being used

### Display not working

- Verify I2C connections (SDA, SCL, VCC, GND)
- Check that the OLED display is powered (3.3V)
- Confirm the I2C address matches (default: 0x3C)
- Use an I2C scanner sketch to verify the display is detected

## License

This project is open source and available for personal use.

## Author

Davide Ghiotto
