#!/bin/bash
# Deploy sync server to DigitalOcean
# Run this script on your DigitalOcean droplet

echo "🚀 Deploying GPB Sync Server to DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18 (required for Playwright)
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Playwright dependencies
echo "📦 Installing Playwright system dependencies..."
sudo npx playwright install-deps chromium

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "📁 Creating app directory..."
sudo mkdir -p /var/www/sync-server
cd /var/www/sync-server

# Clone your repository (replace with your repo URL)
echo "📥 Cloning repository..."
# If using git:
# git clone https://github.com/yourusername/portable_buildings.git .
# For now, you'll need to upload files manually or use git

echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

# Create .env file
echo "⚙️  Creating .env file..."
cat > .env.local << EOF
DATABASE_URL=your-database-url-here
POSTGRES_URL=your-postgres-url-here
WEBHOOK_SECRET=your-webhook-secret-here
HEADLESS_MODE=true
EOF

echo "⚠️  IMPORTANT: Edit /var/www/sync-server/.env.local with your actual values!"

# Start with PM2
echo "🚀 Starting sync server with PM2..."
pm2 start sync-server.js --name "gpb-sync-server"
pm2 save
pm2 startup

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 3001/tcp
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /var/www/sync-server/.env.local with your database credentials"
echo "2. Restart the service: pm2 restart gpb-sync-server"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs gpb-sync-server"
echo ""
echo "🌐 Your sync server will be available at: http://YOUR_DROPLET_IP:3001"
echo ""
echo "💡 To update the code later:"
echo "   cd /var/www/sync-server"
echo "   git pull (or upload new files)"
echo "   pm2 restart gpb-sync-server"
