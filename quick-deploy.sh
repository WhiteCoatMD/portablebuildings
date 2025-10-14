#!/bin/bash
# Quick Deploy Script for New Droplet
# Run this in the DigitalOcean console

set -e

echo "🚀 Starting GPB Sync Server deployment..."

# Update system
echo "📦 Updating system..."
apt-get update
apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Playwright dependencies
echo "📦 Installing Playwright dependencies..."
npx playwright install-deps chromium

# Create directory and clone repo
echo "📥 Cloning repository..."
mkdir -p /var/www
cd /var/www
rm -rf sync-server
git clone https://github.com/WhiteCoatMD/portablebuildings.git sync-server
cd sync-server

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Install Playwright browser
echo "🎭 Installing Playwright Chromium..."
npx playwright install chromium

# Create .env.local file
echo "⚙️  Creating environment file..."
cat > .env.local << 'EOF'
DATABASE_URL="postgres://eb3d469c8a79bfa9dce120e134d75d498aa3183d3c211df4e40f8d1cf2fe496a:sk_4y5yiHqv-EHzX_Unz9w9m@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgres://eb3d469c8a79bfa9dce120e134d75d498aa3183d3c211df4e40f8d1cf2fe496a:sk_4y5yiHqv-EHzX_Unz9w9m@db.prisma.io:5432/postgres?sslmode=require"
WEBHOOK_SECRET=my-super-secret-sync-key-12345
HEADLESS_MODE=true
PORT=3001
EOF

# Start with PM2
echo "🚀 Starting sync server with PM2..."
pm2 start sync-server.js --name gpb-sync
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs gpb-sync"
echo "🔄 Restart: pm2 restart gpb-sync"
echo ""
echo "🌐 Server running on port 3001"
