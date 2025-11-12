#!/bin/bash

# Auto-detect ESP32 port
# Returns the first USB port found by arduino-cli board list

PORT=$(arduino-cli board list | grep 'usb' | awk '{print $1}' | head -n 1)

if [ -z "$PORT" ]; then
  echo "Error: No ESP32 board found. Please connect your ESP32 and try again." >&2
  exit 1
fi

echo "$PORT"

