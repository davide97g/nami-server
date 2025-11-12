#!/bin/bash

# Compile ESP32 Arduino project
# This script compiles the Arduino code for ESP32

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Compiling ESP32 project..."
echo "Project root: $PROJECT_ROOT"

cd "$PROJECT_ROOT"

arduino-cli compile \
  --config-file arduino-cli.yaml \
  --fqbn esp32:esp32:esp32 \
  "$PROJECT_ROOT/src/nami"

echo "Compilation completed successfully!"

