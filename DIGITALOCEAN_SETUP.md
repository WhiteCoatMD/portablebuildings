# DigitalOcean Multi-User Sync Setup

This guide will help you set up automated inventory syncing on your DigitalOcean server.

## Prerequisites

- DigitalOcean droplet (Ubuntu recommended)
- SSH access to your server
- Node.js 18+ installed on the server

## Step 1: Install Dependencies on DigitalOcean

SSH into your DigitalOcean server:

```bash
ssh root@your-server-ip
```

Install required packages:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Playwright dependencies
npx playwright install-deps chromium
```

## Step 2: Clone Repository

```bash
# Clone your repo
cd /opt
git clone https://github.com/WhiteCoatMD/portablebuildings.git
cd portablebuildings

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Step 3: Set Environment Variables

Create environment file:

```bash
nano /opt/portablebuildings/.env
```

Add your database connection:

```env
DATABASE_URL=your_vercel_postgres_connection_string
POSTGRES_URL=your_vercel_postgres_connection_string
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

Get your Vercel Postgres URL from: https://vercel.com/dashboard → Your Project → Storage → Postgres → .env.local

## Step 4: Test Manual Sync

```bash
cd /opt/portablebuildings
node sync-all-users.js
```

This should sync all users who have saved their GPB credentials.

## Step 5: Set Up Automatic Daily Sync

Create a systemd service:

```bash
nano /etc/systemd/system/inventory-sync.service
```

Add this content:

```ini
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

[Install]
WantedBy=multi-user.target
```

Create a timer:

```bash
nano /etc/systemd/system/inventory-sync.timer
```

Add this content:

```ini
[Unit]
Description=Run Inventory Sync Daily at 2 AM
Requires=inventory-sync.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start the timer:

```bash
systemctl daemon-reload
systemctl enable inventory-sync.timer
systemctl start inventory-sync.timer

# Check timer status
systemctl list-timers inventory-sync
```

## Step 6: Manual Sync Trigger (Optional)

You can also trigger syncs manually via API. The endpoint `/api/trigger-sync` should call your DigitalOcean server.

Create a webhook endpoint on your DO server:

```bash
nano /opt/portablebuildings/webhook-server.js
```

See `webhook-server.js` in the repo for the implementation.

## Monitoring

View sync logs:

```bash
# View service logs
journalctl -u inventory-sync.service -f

# View timer status
systemctl status inventory-sync.timer
```

## Updating Code

To pull latest changes:

```bash
cd /opt/portablebuildings
git pull origin master
npm install
systemctl restart inventory-sync.timer
```

## Security Notes

- Keep your `.env` file secure (never commit it)
- Use a strong encryption key for GPB passwords
- Restrict SSH access to your server
- Keep your server updated with `apt update && apt upgrade`

## Troubleshooting

**If sync fails:**

1. Check logs: `journalctl -u inventory-sync.service -n 50`
2. Test manually: `cd /opt/portablebuildings && node sync-all-users.js`
3. Verify Playwright is installed: `npx playwright --version`
4. Check database connection in `.env`

**If no users are syncing:**

- Make sure users have saved their GPB credentials
- Check auto_sync_enabled is TRUE for users in database
- Verify database migration 004 was run
