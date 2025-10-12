# Update DigitalOcean Server with Latest Code

To update the sync system on your DigitalOcean server with the latest changes:

## Option 1: SSH and Update Manually

1. SSH into your DigitalOcean droplet:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. Navigate to the project directory:
   ```bash
   cd portable_buildings
   ```

3. Pull the latest changes:
   ```bash
   git pull origin master
   ```

4. Restart the PM2 processes:
   ```bash
   pm2 restart all
   ```

5. Run a manual sync to test:
   ```bash
   node sync.js
   ```

## Option 2: Use the Manual Sync Button

The admin panel has a "Manual Sync" button that should trigger the sync on the server. However, you still need to update the code on the server first using Option 1.

## What the Update Does

After updating, the sync will:
- Tag main lot buildings as "West Monroe, LA" (instead of "GPB Sales")
- Tag Columbia lot buildings as "Columbia, LA"
- Update the admin panel with correct building counts
- Update the location filter on the main page

## Verify the Update

After running the sync, check:
1. Admin panel shows correct building count for Columbia lot
2. Building cards show "West Monroe, LA" or "Columbia, LA" instead of "GPB Sales"
3. Location filter dropdown has both locations
