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

echo "🚀 Copying files to Raspberry Pi..."
# Build the list of files to copy
FILES_TO_COPY="dist package.json ../../.nvmrc"

# Add .env file if it exists
if [ -f ".env" ]; then
  echo "📄 Including .env file..."
  FILES_TO_COPY="$FILES_TO_COPY .env"
else
  echo "⚠️  Warning: .env file not found, skipping..."
fi

sshpass -p "$PI_PASSWORD" scp -r -o StrictHostKeyChecking=no $FILES_TO_COPY $PI_USER@$PI_HOST:$REMOTE_DIR

echo "🔧 Setup node version on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST "source ~/.nvm/nvm.sh && cd $REMOTE_DIR && nvm use"

echo "📦 Installing dependencies on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST << EOF
  source ~/.nvm/nvm.sh
  cd $REMOTE_DIR
  nvm use
  
  # Install all dependencies first
  echo "📥 Installing dependencies..."
  npm install --production
  
  # Check if Sharp is installed for the correct platform (Linux ARM64)
  SHARP_INSTALLED=false
  if [ -d "node_modules/sharp" ]; then
    # Check if Sharp binary exists and is for Linux ARM64
    if [ -f "node_modules/sharp/build/Release/sharp-linux-arm64.node" ] || [ -f "node_modules/sharp/lib/sharp-linux-arm64.node" ] || find node_modules/sharp -name "*linux-arm64*" -type f 2>/dev/null | grep -q .; then
      SHARP_INSTALLED=true
      echo "✅ Sharp is already installed for Linux ARM64"
    else
      echo "⚠️  Sharp is installed but not for Linux ARM64, will reinstall"
      rm -rf node_modules/sharp
    fi
  fi
  
  # Install Sharp for Linux ARM64 if not already installed
  if [ "$SHARP_INSTALLED" = false ]; then
    echo "📥 Installing Sharp for Linux ARM64..."
    npm install --os=linux --cpu=arm64 sharp
  fi
  
  # Install PM2 globally if not already installed
  if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    npm install -g pm2
  fi
  
  # Stop and delete existing PM2 process if it exists
  pm2 delete $APP_NAME 2>/dev/null || true
  
  # Start the server with PM2
  echo "🚀 Starting server with PM2..."
  pm2 start dist/server.js --name $APP_NAME
  
  # Save PM2 process list
  pm2 save
  
  # Setup PM2 to start on system boot (optional, uncomment if needed)
  # pm2 startup
EOF

echo "✅ Deployment complete!"

