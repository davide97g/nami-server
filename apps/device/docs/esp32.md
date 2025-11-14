# ESP32 Development Board

## Overview
The ELEGOO ESP32 Development Board is based on the ESP-WROOM-32 module, featuring a powerful dual-core microcontroller with integrated Wi-Fi and Bluetooth capabilities. This board is ideal for IoT projects, wireless communication, and embedded applications.

## Key Specifications

### Processor
- **Architecture**: Dual-core 32-bit Xtensa LX6 microprocessor
- **Clock Speed**: Up to 240 MHz (configurable: 160 MHz or 240 MHz)
- **Performance**: Up to 600 DMIPS
- **Memory**: 520 KB SRAM
- **Flash Memory**: 4 MB (on ELEGOO board)

### Wireless Connectivity
- **Wi-Fi**: 802.11 b/g/n (2.4 GHz)
  - Supports AP (Access Point), STA (Station), and AP+STA modes
- **Bluetooth**: v4.2 BR/EDR and BLE (Bluetooth Low Energy)
  - Dual-mode operation

### GPIO & Peripherals
- **GPIO Pins**: 34 programmable GPIOs
- **Touch Sensors**: 10 capacitive touch sensor inputs
- **ADC**: 2× 12-bit SAR ADCs (up to 18 channels)
- **DAC**: 2× 8-bit DACs
- **Communication Interfaces**:
  - 4× SPI interfaces
  - 2× I²C interfaces
  - 3× UART interfaces
  - 2× I²S interfaces
- **Other Peripherals**:
  - SD/SDIO/MMC host controller
  - Ethernet MAC with dedicated DMA
  - CAN 2.0 bus
  - Infrared remote controller (TX/RX, up to 8 channels)
  - Motor PWM and LED PWM (up to 16 channels)
  - Hall effect sensor
  - Temperature sensor

### Power Management
- **Operating Voltage**: 3.3V
- **Input Voltage**: 5V (via USB-C)
- **Current Consumption**:
  - Active mode: ~80-240 mA (depending on usage)
  - Deep sleep: ~5 µA
- **Power Features**:
  - Internal low-dropout regulator
  - Individual power domain for RTC
  - Wake-up via GPIO, timer, ADC measurements, or capacitive touch sensor interrupt

### Security Features
- Hardware acceleration for cryptographic functions:
  - AES (Advanced Encryption Standard)
  - SHA-2 (Secure Hash Algorithm)
  - RSA (Rivest-Shamir-Adleman)
  - ECC (Elliptic Curve Cryptography)
  - RNG (Random Number Generator)
- Secure boot
- Flash encryption
- IEEE 802.11 standard security (WPA/WPA2)

### Physical Characteristics
- **USB Interface**: USB-C connector
- **Serial Chip**: CP2102 (USB to UART bridge)
- **Dimensions**: Standard ESP32 development board form factor
- **Pin Spacing**: 2.54 mm (0.1 inch)

## Programming Support
- **Arduino IDE**: Full support via ESP32 board package
- **MicroPython**: Supported
- **NodeMCU**: Compatible
- **PlatformIO**: Supported
- **ESP-IDF**: Official Espressif development framework

## Important Notes
- Most GPIOs are 3.3V logic level (not 5V tolerant)
- Some GPIOs have restrictions (e.g., GPIO 6-11 are connected to flash memory)
- ADC2 cannot be used when Wi-Fi is active
- GPIO 34, 35, 36, 39 are input-only (no internal pull-up/pull-down)

## Further Documentation

### Official Resources
- [ESP32 Technical Reference Manual](https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf)
- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [ESP32 Hardware Design Guidelines](https://www.espressif.com/sites/default/files/documentation/esp32_hardware_design_guidelines_en.pdf)
- [ESP32 Pinout Reference](https://randomnerdtutorials.com/esp32-pinout-reference-gpios/)

### Arduino Resources
- [ESP32 Arduino Core Documentation](https://github.com/espressif/arduino-esp32)
- [ESP32 Arduino Examples](https://github.com/espressif/arduino-esp32/tree/master/libraries)

### Community Resources
- [ESP32 Forum](https://www.esp32.com/)
- [Random Nerd Tutorials - ESP32](https://randomnerdtutorials.com/category/esp32/)

## Product Links
- [Amazon Product Page](https://www.amazon.it/dp/B0D8T5XD3P?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1)

