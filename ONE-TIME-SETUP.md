# One-Time Setup for Automatic Updates

You need to do this **ONE TIME ONLY** to enable the automatic update system. After this, all future syncs will automatically pull the latest code from GitHub.

## Steps:

### 1. SSH into your DigitalOcean server:
```bash
ssh root@YOUR_SERVER_IP
```

### 2. Navigate to the project directory:
```bash
cd portable_buildings
```

### 3. Pull the latest code (includes auto-update system):
```bash
git pull origin master
```

### 4. Restart PM2 processes to apply changes:
```bash
pm2 restart all
```

### 5. Test the auto-update by running a manual sync:
```bash
node sync.js
```

You should see output like:
```
=== Starting Inventory Sync ===
Time: 2025-10-12T...

Step 0: Checking for code updates from GitHub...
  ✓ Code is already up to date

Step 1: Backup current inventory...
```

## What Happens Next?

From now on, **every time a sync runs** (either scheduled at 2 AM or manually triggered):

1. ✅ The system automatically checks GitHub for updates
2. ✅ If updates are found, pulls the latest code
3. ✅ Then proceeds with the normal sync process
4. ✅ Buildings are tagged with "West Monroe, LA" or "Columbia, LA"
5. ✅ Admin panel shows correct building counts
6. ✅ Everything updates automatically

## Completely Hands-Off

You never need to SSH into the server again unless there's a critical issue. Just:
- Make changes locally
- Commit and push to GitHub
- The next sync will automatically use the new code!

## Troubleshooting

If the sync fails, check:
```bash
pm2 logs inventory-sync
```

Or view sync logs:
```bash
cat logs/sync-log.json
```
