# Portable Buildings Inventory System

Automated inventory management system that syncs your dealer portal with your website.

## Features

- **Serial Number Decoder**: Automatically decodes building details from serial numbers
- **Auto-Sync**: Logs into dealer portal daily and updates inventory
- **Backup System**: Automatic backups before each sync
- **Error Recovery**: Restores from backup if sync fails
- **Logging**: Tracks all sync operations

## Setup Instructions

### 1. Install Node.js

Download and install Node.js from https://nodejs.org (v18 or newer)

### 2. Install Dependencies

Open Command Prompt in this folder and run:

```bash
npm install
```

This installs:
- Playwright (browser automation)
- dotenv (secure credential management)
- node-cron (task scheduling)

### 3. Configure Credentials

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` with your dealer portal credentials:

```env
PORTAL_URL=https://your-dealer-portal.com/login
PORTAL_USERNAME=your_username
PORTAL_PASSWORD=your_password
INVENTORY_URL=https://your-dealer-portal.com/inventory

# Sync at 2 AM daily (minute hour day month weekday)
CRON_SCHEDULE=0 2 * * *

# Run in headless mode (no visible browser)
HEADLESS_MODE=true

# Run immediately on startup
RUN_ON_STARTUP=false
```

**IMPORTANT**: Never share or commit your `.env` file!

### 4. Customize Portal Scraper

The `portal-scraper.js` file needs to be customized for your specific dealer portal.

**First, run a test to see your portal's structure:**

```bash
# This will take screenshots and show you what selectors to use
node portal-scraper.js
```

Check the `screenshots/` folder to see:
- `01-login-page.png` - Your login form
- `02-credentials-filled.png` - Form with credentials
- `03-after-login.png` - Dashboard after login
- `04-inventory-page.png` - Your inventory page
- `raw-inventory-data.json` - Raw scraped data

**Then, customize the selectors in `portal-scraper.js`:**

1. Find the login form selectors (username, password, submit button)
2. Update the `scrapeInventory()` method to extract your data
3. Update the `parseInventoryData()` method to extract prices, locations, etc.

### 5. Test the Sync

Run a manual sync to make sure everything works:

```bash
npm run sync
```

This will:
1. Log into your portal
2. Scrape inventory data
3. Update `inventory.js`
4. Create a backup
5. Show you the results

### 6. Start the Scheduler

Once testing works, start the automated daily sync:

```bash
npm run schedule
```

The scheduler will:
- Run every day at 2 AM (or your configured time)
- Keep running in the background
- Log all sync operations to `logs/sync-log.json`

## Running Automatically on Windows Startup

### Option 1: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Portable Buildings Sync"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\Users\13183\portable_buildings\scheduler.js`
8. Start in: `C:\Users\13183\portable_buildings`

### Option 2: Startup Folder (Simpler)

1. Create a file `start-scheduler.bat`:
```bat
@echo off
cd C:\Users\13183\portable_buildings
node scheduler.js
```

2. Press `Win+R`, type `shell:startup`
3. Copy `start-scheduler.bat` into the Startup folder

## File Structure

```
portable_buildings/
├── index.html           # Public website
├── styles.css           # Website styling
├── decoder.js           # Serial number decoder
├── inventory.js         # Inventory data (auto-updated)
├── app.js              # Website logic
├── portal-scraper.js   # Portal automation (CUSTOMIZE THIS)
├── sync.js             # Sync orchestration
├── scheduler.js        # Daily scheduler
├── package.json        # Node dependencies
├── .env                # Your credentials (DO NOT COMMIT)
├── .gitignore          # Protects sensitive files
├── screenshots/        # Debug screenshots
├── backups/           # Inventory backups
└── logs/              # Sync logs
```

## Troubleshooting

### Login Fails

1. Check screenshots in `screenshots/ERROR-login-failed.png`
2. Update selectors in `portal-scraper.js`
3. Check if portal requires 2FA (will need manual intervention)
4. Try with `HEADLESS_MODE=false` to see what's happening

### No Inventory Data

1. Check `screenshots/04-inventory-page.png`
2. Check `screenshots/raw-inventory-data.json`
3. Customize the `scrapeInventory()` method in `portal-scraper.js`

### Portal Blocks Automation

Some portals detect automation. Try:
- Adding `slowMo: 500` in browser launch options
- Adding random delays between actions
- Using a stable IP address
- Contacting your dealer portal support for API access

### Sync Fails

- Check `logs/sync-log.json` for error details
- Inventory automatically restores from latest backup
- Fix the issue and run `npm run sync` manually to test

## Security Notes

- All credentials are stored locally in `.env`
- Never commit `.env` to version control
- Screenshots may contain sensitive data - don't share them
- Consider using environment variables or a secrets manager for production

## Support

For issues with:
- **The website**: Edit HTML/CSS/JS files directly
- **The decoder**: Edit `decoder.js`
- **Portal automation**: Edit `portal-scraper.js` and check screenshots
- **Scheduling**: Edit `scheduler.js` or CRON_SCHEDULE in `.env`
