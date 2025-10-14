# DigitalOcean Sync Server Setup (One-Time Setup for All Customers)

You deploy this ONCE and it handles syncing for ALL your customers automatically. They don't need to do anything!

## Quick Deploy Using Your Existing Droplet (45.55.237.121)

Since you already have a DigitalOcean droplet at `45.55.237.121`, let's use that!

### Step 1: Connect to Your Droplet

```bash
ssh root@45.55.237.121
```

### Step 2: Install Requirements

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (keeps the server running forever)
npm install -g pm2

# Install Playwright dependencies
npx playwright install-deps chromium
```

### Step 3: Upload Your Code

**Option A: Using Git (Recommended)**
```bash
cd /var/www
git clone YOUR_GITHUB_REPO_URL sync-server
cd sync-server
npm install
npx playwright install chromium
```

**Option B: Manual Upload**
1. Use FileZilla or WinSCP to upload your entire `portable_buildings` folder to `/var/www/sync-server`
2. Then on the server:
```bash
cd /var/www/sync-server
npm install
npx playwright install chromium
```

### Step 4: Configure Environment Variables

```bash
cd /var/www/sync-server
nano .env.local
```

Paste this (replace with your actual values):
```env
DATABASE_URL=your-prisma-database-url
POSTGRES_URL=your-prisma-database-url
WEBHOOK_SECRET=my-super-secure-secret-key-12345
HEADLESS_MODE=true
PORT=3001
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 5: Start the Sync Server

```bash
# Start with PM2 (keeps it running forever)
pm2 start sync-server.js --name gpb-sync

# Save the PM2 configuration
pm2 save

# Make it start on reboot
pm2 startup
# (copy and run the command it gives you)

# Check it's running
pm2 status
```

### Step 6: Open Firewall

```bash
# Allow port 3001
ufw allow 3001/tcp

# Make sure firewall is enabled
ufw --force enable

# Check status
ufw status
```

### Step 7: Test It

```bash
# Test health endpoint
curl http://localhost:3001/health
```

You should see:
```json
{"status":"ok","message":"Sync server is running","uptime":...}
```

### Step 8: Update Vercel

1. Go to your Vercel project: https://vercel.com
2. Go to Settings → Environment Variables
3. Add/Update these:
   - `SYNC_SERVER_URL` = `http://45.55.237.121:3001`
   - `WEBHOOK_SECRET` = `my-super-secure-secret-key-12345` (same as droplet)
4. Click "Redeploy" to apply changes

### Step 9: Test End-to-End

1. Go to your live site admin panel
2. Enter GPB credentials in "Inventory Sync Settings"
3. Click "Save Credentials"
4. Click "Sync Now"
5. Should work! 🎉

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs gpb-sync

# Restart
pm2 restart gpb-sync

# Stop
pm2 stop gpb-sync

# Status
pm2 status

# Monitor CPU/Memory
pm2 monit
```

---

## Updating the Code

When you make changes to your code:

```bash
# SSH to droplet
ssh root@45.55.237.121

# Pull latest code (if using git)
cd /var/www/sync-server
git pull

# Or upload new files via FileZilla/WinSCP

# Restart the service
pm2 restart gpb-sync

# Check logs
pm2 logs gpb-sync
```

---

## Done! 🎉

Now when ANY customer:
1. Logs into their admin panel
2. Saves their GPB credentials
3. Clicks "Sync Now"

Your DigitalOcean server will automatically:
- Log into GPB Sales with their credentials
- Scrape their inventory
- Save it to their database
- They see their buildings!

**No setup needed for customers - it just works!** ✨
