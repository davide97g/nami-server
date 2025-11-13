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
sshpass -p "$PI_PASSWORD" scp -r -o StrictHostKeyChecking=no dist package.json ../../.nvmrc nginx.conf cloudflared-config.yml $PI_USER@$PI_HOST:$REMOTE_DIR

echo "🔧 Setup node version on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST "source ~/.nvm/nvm.sh && cd $REMOTE_DIR && nvm use"

echo "📦 Setting up PM2 on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST << EOF
  source ~/.nvm/nvm.sh
  cd $REMOTE_DIR
  nvm use
  
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

echo "🌐 Setting up nginx on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST << EOF
  set -e
  APP_NAME="$APP_NAME"
  REMOTE_DIR="\${HOME}/desktop/\$APP_NAME"
  
  # Install nginx if not already installed
  if ! command -v nginx &> /dev/null; then
    echo "📥 Installing nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
  fi
  
  # Backup existing nginx config if it exists
  if [ -f /etc/nginx/sites-available/\$APP_NAME ]; then
    echo "💾 Backing up existing nginx config..."
    sudo cp /etc/nginx/sites-available/\$APP_NAME /etc/nginx/sites-available/\$APP_NAME.backup
  fi
  
  # Copy nginx config to sites-available
  echo "📋 Copying nginx configuration..."
  if [ ! -f "\$REMOTE_DIR/nginx.conf" ]; then
    echo "❌ Error: nginx.conf not found at \$REMOTE_DIR/nginx.conf"
    exit 1
  fi
  sudo cp "\$REMOTE_DIR/nginx.conf" /etc/nginx/sites-available/\$APP_NAME
  
  # Remove any broken symlinks in sites-enabled
  echo "🔍 Checking for broken symlinks..."
  for link in /etc/nginx/sites-enabled/*; do
    if [ -L "\$link" ] && [ ! -e "\$link" ]; then
      echo "🔧 Removing broken symlink: \$link"
      sudo rm "\$link"
    fi
  done
  
  # Remove broken symlink for our app if it exists
  if [ -L /etc/nginx/sites-enabled/\$APP_NAME ] && [ ! -e /etc/nginx/sites-enabled/\$APP_NAME ]; then
    echo "🔧 Removing broken symlink for \$APP_NAME..."
    sudo rm /etc/nginx/sites-enabled/\$APP_NAME
  fi
  
  # Verify the config file exists before creating symlink
  if [ ! -f /etc/nginx/sites-available/\$APP_NAME ]; then
    echo "❌ Error: nginx config file not found at /etc/nginx/sites-available/\$APP_NAME"
    exit 1
  fi
  
  # Create symlink to sites-enabled if it doesn't exist
  if [ ! -L /etc/nginx/sites-enabled/\$APP_NAME ]; then
    echo "🔗 Enabling nginx site..."
    sudo ln -s /etc/nginx/sites-available/\$APP_NAME /etc/nginx/sites-enabled/\$APP_NAME
  else
    echo "✅ Nginx site already enabled"
  fi
  
  # Remove default nginx site if it exists
  if [ -L /etc/nginx/sites-enabled/default ]; then
    echo "🗑️  Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
  fi
  
  # Test nginx configuration
  echo "🧪 Testing nginx configuration..."
  sudo nginx -t
  
  # Reload nginx
  echo "🔄 Reloading nginx..."
  sudo systemctl reload nginx
  
  # Enable nginx to start on boot
  sudo systemctl enable nginx
  
  # Setup SSL certificates directory
  echo "🔐 Setting up SSL certificates..."
  sudo mkdir -p /etc/ssl/cloudflare
  if [ -f "\$REMOTE_DIR/origin.crt" ] && [ -f "\$REMOTE_DIR/origin.key" ]; then
    sudo cp "\$REMOTE_DIR/origin.crt" /etc/ssl/cloudflare/origin.crt
    sudo cp "\$REMOTE_DIR/origin.key" /etc/ssl/cloudflare/origin.key
    sudo chmod 644 /etc/ssl/cloudflare/origin.crt
    sudo chmod 600 /etc/ssl/cloudflare/origin.key
    echo "✅ SSL certificates installed"
  else
    echo "⚠️  Warning: origin.crt and origin.key not found. SSL certificates not installed."
  fi
EOF

echo "☁️  Setting up Cloudflare Tunnel on Raspberry Pi..."
sshpass -p "$PI_PASSWORD" ssh -o StrictHostKeyChecking=no $PI_USER@$PI_HOST << EOF
  set -e
  REMOTE_DIR="\${HOME}/desktop/$APP_NAME"
  
  # Install cloudflared if not already installed
  if ! command -v cloudflared &> /dev/null; then
    echo "📥 Installing cloudflared..."
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
  fi
  
  # Create cloudflared config directory
  echo "📋 Setting up cloudflared configuration..."
  sudo mkdir -p /etc/cloudflared
  
  # Copy cloudflared config
  if [ -f "\$REMOTE_DIR/cloudflared-config.yml" ]; then
    sudo cp "\$REMOTE_DIR/cloudflared-config.yml" /etc/cloudflared/config.yml
    echo "✅ Cloudflared config installed"
    
    # Verify origin certificate exists
    if [ ! -f /etc/ssl/cloudflare/origin.crt ]; then
      echo "⚠️  Warning: Origin certificate not found at /etc/ssl/cloudflare/origin.crt"
      echo "   Cloudflared may not work correctly. Make sure certificates are deployed."
    fi
  else
    echo "❌ Error: cloudflared-config.yml not found at \$REMOTE_DIR/cloudflared-config.yml"
    exit 1
  fi
  
  # Setup cloudflared as systemd service if not already set up
  if [ ! -f /etc/systemd/system/cloudflared.service ]; then
    echo "🔧 Creating cloudflared systemd service..."
    sudo tee /etc/systemd/system/cloudflared.service > /dev/null << SERVICE_EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --config /etc/cloudflared/config.yml run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SERVICE_EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable cloudflared
    echo "✅ Cloudflared service created and enabled"
  fi
  
  # Restart cloudflared service
  echo "🔄 Restarting cloudflared service..."
  sudo systemctl restart cloudflared || sudo systemctl start cloudflared
  echo "✅ Cloudflared service started"
  
  # Check cloudflared status
  sleep 2
  if sudo systemctl is-active --quiet cloudflared; then
    echo "✅ Cloudflared is running"
  else
    echo "⚠️  Warning: Cloudflared service may not be running. Check logs with: sudo journalctl -u cloudflared -f"
  fi
EOF

echo "✅ Deployment complete!"

