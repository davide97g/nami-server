#!/bin/bash
set -e

PI_USER="davide"
PI_HOST="raspberrypi.local"
APP_NAME="nami-server"
REMOTE_DIR="~/desktop/$APP_NAME"
SECRETS_FILE=".deploy-secrets"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "❌ Error: sshpass is not installed. Please install it first:"
    echo "   macOS: brew install hudochenkov/sshpass/sshpass"
    echo "   Linux: sudo apt-get install sshpass"
    exit 1
fi

# Load password from secrets file
if [ ! -f "$SECRETS_FILE" ]; then
    echo "❌ Error: $SECRETS_FILE file not found!"
    echo "   Please create $SECRETS_FILE with: PI_PASSWORD=your_password"
    exit 1
fi

source "$SECRETS_FILE"

if [ -z "$PI_PASSWORD" ]; then
    echo "❌ Error: PI_PASSWORD is not set in $SECRETS_FILE"
    exit 1
fi

echo "🧱 Building project..."
bun run build

echo "🧹 Cleaning dist folder on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST "rm -rf $REMOTE_DIR/dist"

echo "🚀 Copying dist folder to Raspberry Pi..."
sshpass -p "$PI_PASSWORD" scp -r -o StrictHostKeyChecking=no dist .nvmrc $PI_USER@$PI_HOST:$REMOTE_DIR

# echo "🚀 Running script with Node on Pi..."
# sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST "cd $REMOTE_DIR && \
#   echo '📦 Checking files...' && \
#   ls -la dist/server.js && \
#   echo '🔧 Loading nvm...' && \
#   export NVM_DIR=\"\$HOME/.nvm\" && \
#   [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\" && \
#   echo '📌 Using Node version from .nvmrc...' && \
#   nvm use && \
#   echo '🚀 Running server...' && \
#   node dist/server.js"

echo "✅ Deployment complete!"

