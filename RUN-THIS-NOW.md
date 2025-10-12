# Copy and Paste These Commands

Open your terminal (Command Prompt or PowerShell) and paste these commands one at a time:

## Step 1: Connect to your server
```bash
ssh root@45.55.237.121
```

## Step 2: Update the code (paste all at once)
```bash
cd portable_buildings && git pull origin master && pm2 restart all && node sync.js
```

That's it! The sync will run and you'll see output showing:
- Code being updated
- Main lot buildings tagged as "West Monroe, LA"
- Columbia lot buildings tagged as "Columbia, LA"
- Admin panel building counts updated
- Changes committed to GitHub

## What you'll see:
```
=== Starting Inventory Sync ===

Step 0: Checking for code updates from GitHub...
  → Updates found, pulling latest code...
  ✓ Code updated successfully

Step 1: Scraping main dealer portal...
Successfully scraped 27 items from main lot

Step 1a: Checking for other lot locations...
  → Scraping Columbia, La...
  ✓ Columbia, La: 17 buildings

=== Sync Complete ===
Updated 44 total items
  Main lot: 27 buildings
  Other lots: 17 buildings
```

After this runs, everything will be automatic going forward!
