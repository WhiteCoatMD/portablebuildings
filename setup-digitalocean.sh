#!/bin/bash

# ============================================
# DigitalOcean Droplet Setup Script
# For Community Portable Buildings Inventory Sync
# ============================================

echo "================================================"
echo "Setting up Inventory Sync on DigitalOcean"
echo "================================================"
echo ""

# Update system
echo "[1/8] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 18.x
echo "[2/8] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
echo "[3/8] Installing Git..."
sudo apt-get install -y git

# Clone repository
echo "[4/8] Cloning repository..."
cd ~
if [ -d "portable_buildings" ]; then
    echo "Repository already exists, pulling latest..."
    cd portable_buildings
    git pull
else
    git clone https://github.com/WhiteCoatMD/portablebuildings.git portable_buildings
    cd portable_buildings
fi

# Install npm dependencies
echo "[5/8] Installing npm dependencies..."
npm install

# Install Playwright with system dependencies
echo "[6/8] Installing Playwright and browser dependencies..."
npx playwright install chromium --with-deps

# Create .env file
echo "[7/8] Setting up environment variables..."
if [ ! -f .env ]; then
    cat > .env << EOL
# GPB Sales Credentials for Main Lot
GPB_USERNAME=your_email@example.com
GPB_PASSWORD=your_password_here

# Site URL for API calls
SITE_URL=https://buytheshed.com

# Cron Schedule (2 AM daily)
CRON_SCHEDULE=0 2 * * *

# Run on startup (optional)
RUN_ON_STARTUP=false
EOL
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file with your credentials:"
    echo "    nano .env"
    echo ""
else
    echo ".env file already exists, skipping..."
fi

# Install PM2 globally
echo "[8/8] Installing PM2 process manager..."
sudo npm install -g pm2

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Edit the .env file with your GPB Sales credentials:"
echo "   nano .env"
echo ""
echo "2. Start the sync scheduler:"
echo "   pm2 start npm --name inventory-sync -- run schedule"
echo ""
echo "3. Save PM2 process list:"
echo "   pm2 save"
echo ""
echo "4. Set up auto-start on reboot:"
echo "   pm2 startup"
echo "   # Follow the command it gives you"
echo ""
echo "5. View logs:"
echo "   pm2 logs inventory-sync"
echo ""
echo "6. Check status:"
echo "   pm2 status"
echo ""
echo "================================================"
