#!/bin/bash

# ============================================
# DigitalOcean Multi-User Sync Setup Script
# For Community Portable Buildings Inventory Sync
# ============================================

set -e  # Exit on any error

echo "================================================"
echo "Multi-User Inventory Sync Setup"
echo "DigitalOcean Droplet Configuration"
echo "================================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Update system
echo "[1/9] Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install Node.js 18.x
echo "[2/9] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install Git if not present
echo "[3/9] Ensuring Git is installed..."
apt-get install -y git

# Clone repository to /opt/portablebuildings
echo "[4/9] Cloning repository to /opt/portablebuildings..."
cd /opt
if [ -d "portablebuildings" ]; then
    echo "Repository already exists, pulling latest..."
    cd portablebuildings
    git pull origin master
else
    git clone https://github.com/WhiteCoatMD/portablebuildings.git
    cd portablebuildings
fi

# Install npm dependencies
echo "[5/9] Installing npm dependencies..."
npm install

# Install Playwright with system dependencies
echo "[6/9] Installing Playwright and Chromium with system deps..."
npx playwright install chromium --with-deps

# Create .env file
echo "[7/9] Setting up environment variables..."
if [ ! -f .env ]; then
    echo ""
    read -p "Enter your Vercel Postgres DATABASE_URL: " db_url
    read -p "Enter your encryption key (32 characters): " encryption_key
    read -p "Enter webhook secret (or press Enter for default): " webhook_secret

    if [ -z "$webhook_secret" ]; then
        webhook_secret="change-this-secret-key"
    fi

    cat > .env << EOL
# Database connection
DATABASE_URL=${db_url}
POSTGRES_URL=${db_url}

# Encryption key for GPB passwords
ENCRYPTION_KEY=${encryption_key}

# Webhook configuration
NODE_ENV=production
WEBHOOK_PORT=3001
WEBHOOK_SECRET=${webhook_secret}
EOL
    echo "✅ Created .env file"
else
    echo ".env file already exists, skipping..."
fi

# Copy systemd service files
echo "[8/9] Installing systemd services..."

# Webhook server service
cat > /etc/systemd/system/webhook-server.service << 'EOL'
[Unit]
Description=Portable Buildings Webhook Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/portablebuildings
ExecStart=/usr/bin/node /opt/portablebuildings/webhook-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Load environment from .env file
EnvironmentFile=/opt/portablebuildings/.env

[Install]
WantedBy=multi-user.target
EOL

# Inventory sync service (one-shot)
cat > /etc/systemd/system/inventory-sync.service << 'EOL'
[Unit]
Description=Portable Buildings Inventory Sync
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/opt/portablebuildings
ExecStart=/usr/bin/node /opt/portablebuildings/sync-all-users.js
StandardOutput=journal
StandardError=journal

# Load environment from .env file
EnvironmentFile=/opt/portablebuildings/.env

[Install]
WantedBy=multi-user.target
EOL

# Inventory sync timer (daily at 2 AM)
cat > /etc/systemd/system/inventory-sync.timer << 'EOL'
[Unit]
Description=Run Inventory Sync Daily at 2 AM
Requires=inventory-sync.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOL

echo "✅ Created systemd service files"

# Reload systemd and enable services
echo "[9/9] Enabling and starting services..."
systemctl daemon-reload
systemctl enable webhook-server.service
systemctl enable inventory-sync.timer
systemctl start webhook-server.service
systemctl start inventory-sync.timer

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Services Status:"
systemctl status webhook-server.service --no-pager -l || true
echo ""
systemctl list-timers inventory-sync.timer --no-pager || true
echo ""
echo "================================================"
echo "Next Steps:"
echo "================================================"
echo ""
echo "1. Test webhook server:"
echo "   curl http://localhost:3001/health"
echo ""
echo "2. Test manual sync:"
echo "   cd /opt/portablebuildings"
echo "   node sync-all-users.js"
echo ""
echo "3. View webhook server logs:"
echo "   journalctl -u webhook-server.service -f"
echo ""
echo "4. View sync logs:"
echo "   journalctl -u inventory-sync.service -f"
echo ""
echo "5. Check timer schedule:"
echo "   systemctl list-timers inventory-sync"
echo ""
echo "6. Configure Vercel environment variables:"
echo "   SYNC_SERVER_URL=http://YOUR_DROPLET_IP:3001"
echo "   WEBHOOK_SECRET=${webhook_secret}"
echo ""
echo "7. Open firewall for webhook (if needed):"
echo "   ufw allow 3001/tcp"
echo ""
echo "================================================"
