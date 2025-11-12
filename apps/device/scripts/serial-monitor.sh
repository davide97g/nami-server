#!/bin/bash

# Serial Monitor for ESP32
# This script opens a serial monitor for the ESP32 board

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BAUD_RATE="${1:-115200}"  # Default to 115200 if not provided

echo "Opening serial monitor..."
echo "Project root: $PROJECT_ROOT"

cd "$PROJECT_ROOT"

# Auto-detect ESP32 port
PORT=$(arduino-cli board list | grep 'usb' | awk '{print $1}' | head -n 1)

if [ -z "$PORT" ]; then
  echo "Error: No ESP32 board found. Please connect your ESP32 and try again."
  exit 1
fi

echo "Detected port: $PORT"
echo "Baud rate: $BAUD_RATE"
echo "Press Ctrl+A then K to exit screen"

screen "$PORT" "$BAUD_RATE"

