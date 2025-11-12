#!/bin/bash

# Upload ESP32 Arduino project
# This script uploads the compiled code to ESP32 with automatic port detection

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Uploading to ESP32..."
echo "Project root: $PROJECT_ROOT"

cd "$PROJECT_ROOT"

# Auto-detect ESP32 port
PORT=$(arduino-cli board list | grep 'usb' | awk '{print $1}' | head -n 1)

if [ -z "$PORT" ]; then
  echo "Error: No ESP32 board found. Please connect your ESP32 and try again."
  exit 1
fi

echo "Detected port: $PORT"

arduino-cli upload \
  --config-file arduino-cli.yaml \
  -p "$PORT" \
  --fqbn esp32:esp32:esp32 \
  "$PROJECT_ROOT/src/nami"

echo "Upload completed successfully!"

