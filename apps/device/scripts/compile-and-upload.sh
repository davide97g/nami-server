#!/bin/bash

# Compile and Upload ESP32 Arduino project
# This script compiles and uploads the code in one go

set -e  # Exit on error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root (parent of scripts directory)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Compiling and uploading ESP32 project..."
echo "Project root: $PROJECT_ROOT"

# Run compile script
"$SCRIPT_DIR/compile.sh"

# Run upload script
"$SCRIPT_DIR/upload.sh"

echo "Compilation and upload completed successfully!"

