#!/bin/bash

# Install Libraries Script
# Reads libraries.txt and installs all required libraries using Arduino CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LIBRARIES_FILE="$PROJECT_ROOT/libraries.txt"
CONFIG_FILE="$PROJECT_ROOT/arduino-cli.yaml"

# Check if arduino-cli is installed
if ! command -v arduino-cli &> /dev/null; then
    echo "Error: arduino-cli is not installed or not in PATH"
    echo "Please install it first: brew install arduino-cli"
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: arduino-cli.yaml not found at $CONFIG_FILE"
    exit 1
fi

# Check if libraries.txt exists
if [ ! -f "$LIBRARIES_FILE" ]; then
    echo "Error: libraries.txt not found at $LIBRARIES_FILE"
    exit 1
fi

echo "Installing libraries from libraries.txt..."
echo ""

# Update library index first
echo "Updating library index..."
arduino-cli lib update-index --config-file "$CONFIG_FILE"

echo ""
echo "Installing libraries:"
echo "---------------------"

# Read libraries.txt, skip comments and empty lines
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Trim whitespace
    library_name=$(echo "$line" | xargs)
    
    if [ -n "$library_name" ]; then
        echo "Installing: $library_name"
        arduino-cli lib install "$library_name" --config-file "$CONFIG_FILE" || {
            echo "Warning: Failed to install $library_name"
        }
        echo ""
    fi
done < "$LIBRARIES_FILE"

echo "---------------------"
echo "Library installation complete!"
echo ""
echo "Installed libraries:"
arduino-cli lib list --config-file "$CONFIG_FILE"

