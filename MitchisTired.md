# Where We Left Off - Portable Buildings Sync System

**Date:** October 14, 2025, 12:14 AM
**Status:** Ready to test end-to-end sync!

---

## What We Accomplished Today

### 1. ✅ Implemented Per-User GPB Credential Storage
- Added encrypted credential storage to database (AES-256-CBC)
- Created save/get GPB credentials API endpoints
- Updated admin panel with "Inventory Sync Settings" card
- Users can now save their own GPB Sales login credentials securely

### 2. ✅ Built Multi-User Sync Infrastructure
- Created trigger-sync.js endpoint that fetches user credentials and calls sync server
- Set up webhook authentication between Vercel and DigitalOcean (Bearer token)
- Each user can click "Sync Now" to trigger their own inventory sync

### 3. ✅ Integrated Serial Number Decoder
- sync-server.js now decodes all serial numbers before returning data
- Extracts building type, size, date built from serial format
- Buildings display as "10x12 Lofted Barn" instead of raw serial numbers
- trigger-sync.js saves all decoded fields to database

### 4. ✅ Fixed Critical Bugs
- **Duplicate variable error:** Changed `result` to `userQuery` in trigger-sync.js (line 22)
- **Null pointer error:** Added null check before screenshot in gpb-scraper.js error handler

### 5. ✅ Deployed New DigitalOcean Droplet
- **Old droplet (45.55.237.121):** SSH was broken, couldn't update code
- **New droplet (134.199.200.206):** Fresh deployment with all latest code
- Configured Cloud Firewall with SSH (port 22) and sync server (port 3001)
- PM2 auto-starts sync server on boot
- Health check working: http://134.199.200.206:3001/health

### 6. ✅ Updated Vercel Configuration
- Changed SYNC_SERVER_URL to: `http://134.199.200.206:3001`
- Redeployed with latest code including decoder integration
- All API endpoints deployed and ready

---

## Current System Architecture

```
User's Browser (Admin Panel)
    ↓
    | 1. User saves GPB credentials (encrypted)
    | 2. User clicks "Sync Now"
    ↓
Vercel (api/user/trigger-sync.js)
    ↓
    | 3. Fetches user's encrypted credentials from PostgreSQL
    | 4. Decrypts credentials
    | 5. Calls DigitalOcean sync server with webhook secret
    ↓
DigitalOcean Droplet (sync-server.js)
    ↓
    | 6. Validates webhook secret
    | 7. Creates GPBScraper with user's credentials
    | 8. Launches Playwright browser (headless Chromium)
    | 9. Logs into GPB Sales portal
    | 10. Scrapes "My Inventory" and "Preowned Inventory"
    | 11. Decodes all serial numbers (type, size, date built)
    | 12. Returns enriched data to Vercel
    ↓
Vercel (trigger-sync.js continues)
    ↓
    | 13. Deletes old inventory for user
    | 14. Inserts new inventory with decoded data
    | 15. Returns success to browser
    ↓
User sees: "Successfully synced X buildings"
```

---

## Key Files Reference

### Database Schema
- **File:** `setup-database.js`
- **New columns in users table:**
  - `gpb_username` - GPB Sales email
  - `gpb_password_encrypted` - AES-256 encrypted password
  - `auto_sync_enabled` - Future feature for daily auto-sync

### API Endpoints (Vercel)
1. **api/user/save-gpb-credentials.js** - Encrypts and saves user's GPB login
2. **api/user/get-gpb-credentials.js** - Retrieves and decrypts credentials
3. **api/user/trigger-sync.js** - Main sync endpoint (calls DigitalOcean)

### Sync Server (DigitalOcean)
- **File:** `sync-server.js`
- **Location:** `/var/www/sync-server/` on droplet
- **Port:** 3001
- **Process Manager:** PM2 (keeps it running 24/7)
- **Commands:**
  ```bash
  ssh root@134.199.200.206
  pm2 status              # Check if running
  pm2 logs gpb-sync       # View logs
  pm2 restart gpb-sync    # Restart server
  cd /var/www/sync-server && git pull  # Update code
  ```

### Scraper
- **File:** `gpb-scraper.js`
- **What it does:**
  - Logs into GPB Sales portal with Playwright
  - Scrapes inventory from "My Inventory" page
  - Scrapes repos from "Preowned Inventory" page
  - Extracts serial numbers and pricing (cash + RTO)
  - Takes screenshots for debugging

### Decoder
- **File:** `decoder.js`
- **Serial format:** `P5-MS-507320-0612-101725-NM3`
  - P5 = Prefix
  - MS = Building type (Mini Shed, Lofted Barn, etc.)
  - 507320 = Unique serial
  - 0612 = Size (6x12)
  - 101725 = Date built (10/17/2025)
  - NM3 = Plant code (optional)
  - R suffix = Repo

### Admin Panel
- **File:** `admin.html` (lines 93-128) - Credential input UI
- **File:** `admin.js` (lines 1387-1554) - Sync functions
  - `loadGpbCredentials()` - Loads saved credentials on page load
  - `saveGpbCredentials()` - Saves credentials to database
  - `triggerUserSync()` - Triggers sync and reloads page on success

---

## Environment Variables

### DigitalOcean (.env.local on droplet)
```env
DATABASE_URL="postgres://eb3d469c8a79bfa9dce120e134d75d498aa3183d3c211df4e40f8d1cf2fe496a:sk_4y5yiHqv-EHzX_Unz9w9m@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL="postgres://eb3d469c8a79bfa9dce120e134d75d498aa3183d3c211df4e40f8d1cf2fe496a:sk_4y5yiHqv-EHzX_Unz9w9m@db.prisma.io:5432/postgres?sslmode=require"
WEBHOOK_SECRET=my-super-secret-sync-key-12345
HEADLESS_MODE=true
PORT=3001
```

### Vercel (Environment Variables)
```env
SYNC_SERVER_URL=http://134.199.200.206:3001
WEBHOOK_SECRET=my-super-secret-sync-key-12345
DATABASE_URL=postgres://eb3d469c8a79bfa9dce120e134d75d498aa3183d3c211df4e40f8d1cf2fe496a:sk_4y5yiHqv-EHzX_Unz9w9m@db.prisma.io:5432/postgres?sslmode=require
POSTGRES_URL=postgres://eb3d469c8a79bfa9dce120e134d75d498aa3183d3c211df4e40f8d1cf2fe496a:sk_4y5yiHqv-EHzX_Unz9w9m@db.prisma.io:5432/postgres?sslmode=require
ENCRYPTION_KEY=your-32-character-key-here
```

---

## What To Do Tomorrow

### IMMEDIATE NEXT STEP: Test End-to-End Sync

1. **Go to your admin panel:** https://your-vercel-url.vercel.app/admin.html
2. **Open browser console:** Press F12 → Console tab
3. **Make sure GPB credentials are saved:**
   - Should see your GPB Sales email filled in
   - Password field should say "Password saved (leave blank to keep current)"
4. **Click "Sync Now"**
5. **Watch for:**
   - Success message: "Successfully synced X buildings"
   - OR error message in console with details

### If Sync Works ✅
- Check your inventory page - buildings should have proper names like "10x12 Lofted Barn"
- Check database - all fields should be populated (type_code, type_name, size_display, etc.)
- **YOU'RE DONE!** System is fully operational for all users

### If Sync Fails ❌
- Copy the exact error message from browser console
- Check PM2 logs on droplet: `ssh root@134.199.200.206` then `pm2 logs gpb-sync`
- Common issues:
  - **"Cannot read properties of null"** - Playwright initialization failed (check dependencies)
  - **"Invalid credentials"** - GPB Sales login failed (check username/password)
  - **"Timeout"** - Scraping took too long (normal for large inventory, increase timeout)
  - **"Unauthorized"** - Webhook secret mismatch (check Vercel env vars)

---

## Useful Commands

### Check if sync server is running
```bash
curl http://134.199.200.206:3001/health
```
Should return: `{"status":"ok","message":"Sync server is running",...}`

### SSH to droplet
```bash
ssh root@134.199.200.206
```

### Update code on droplet
```bash
ssh root@134.199.200.206
cd /var/www/sync-server
git pull origin master
pm2 restart gpb-sync
pm2 logs gpb-sync --lines 50
```

### Check PM2 status
```bash
pm2 status       # See all processes
pm2 logs         # View all logs
pm2 logs gpb-sync --lines 100  # Last 100 log lines
pm2 restart gpb-sync  # Restart sync server
pm2 monit        # Live CPU/memory monitoring
```

### Test sync manually (for debugging)
```bash
curl -X POST http://134.199.200.206:3001/sync-lot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-super-secret-sync-key-12345" \
  -d '{"username":"your-gpb-email","password":"your-gpb-password","lotName":"Test Lot","userId":1}'
```

---

## Known Issues & Limitations

### Fixed Issues ✅
- ~~Duplicate variable declaration in trigger-sync.js~~ - FIXED
- ~~Null pointer on screenshot in gpb-scraper.js~~ - FIXED
- ~~Old droplet SSH broken~~ - FIXED (created new droplet)
- ~~Decoder not integrated~~ - FIXED (integrated into sync-server.js)

### Current Limitations
1. **No automatic daily sync yet** - Users must manually click "Sync Now"
   - Auto-sync checkbox exists in UI but not implemented
   - Would need a cron job or scheduled task
2. **No sync status history** - Can't see when last sync happened
3. **Sync timeout is 2 minutes** - Large inventories might timeout
4. **Only works with GPB Sales portal** - Specific to gpbsales.com structure

---

## Security Notes

### Credentials Storage
- GPB passwords stored encrypted with AES-256-CBC
- Encryption key in Vercel environment variables
- Never logged or exposed in API responses

### Webhook Security
- Sync server requires Bearer token authentication
- Token must match between Vercel and DigitalOcean
- Current token: `my-super-secret-sync-key-12345`
- **RECOMMENDATION:** Generate stronger token for production

### Database Access
- PostgreSQL hosted on Prisma Cloud
- Connection strings in environment variables only
- Per-user data isolation (user_id in all queries)

---

## Troubleshooting Guide

### "Sync failed" with no details
1. Open browser console (F12) for detailed error
2. Check PM2 logs: `ssh root@134.199.200.206` → `pm2 logs gpb-sync`

### "Cannot read properties of null (reading 'screenshot')"
- Playwright failed to initialize browser
- SSH to droplet and run: `npx playwright install chromium --with-deps`
- Restart: `pm2 restart gpb-sync`

### "Unauthorized" error
- Webhook secret mismatch
- Check Vercel env var `WEBHOOK_SECRET` matches droplet's `.env.local`

### "Invalid credentials" or login failed
- GPB Sales username/password incorrect
- Try logging into gpbsales.com manually to verify
- Re-save credentials in admin panel

### Sync server not responding
1. Check if running: `curl http://134.199.200.206:3001/health`
2. SSH and check PM2: `pm2 status`
3. Restart if needed: `pm2 restart gpb-sync`
4. Check logs: `pm2 logs gpb-sync`

### Buildings have empty names after sync
- Decoder not working or droplet has old code
- SSH to droplet: `cd /var/www/sync-server && git pull && pm2 restart gpb-sync`

---

## Future Enhancements (Not Implemented Yet)

1. **Automatic Daily Sync**
   - Cron job to sync all users at 2 AM
   - Use `auto_sync_enabled` flag in database
   - Send email notification on completion

2. **Sync History & Status**
   - Table: `sync_history` (user_id, timestamp, status, count)
   - Show last sync time in admin panel
   - Display sync progress bar

3. **Multi-Lot Support**
   - Some users have multiple lots
   - Would need to save multiple GPB accounts per user
   - Or scrape multiple lots from single account

4. **Error Notifications**
   - Email user if sync fails
   - Slack/Discord webhook for admin alerts

5. **Retry Logic**
   - Auto-retry failed syncs (with exponential backoff)
   - Queue system for handling multiple concurrent syncs

---

## Quick Reference: What Each Service Does

### Vercel (https://vercel.com)
- Hosts the website and API endpoints
- Runs serverless functions (Node.js)
- Handles user authentication (JWT)
- Stores/retrieves data from PostgreSQL

### DigitalOcean Droplet (134.199.200.206)
- Runs sync-server.js 24/7 with PM2
- Executes Playwright browser automation
- Scrapes GPB Sales portal
- Decodes serial numbers
- Returns data to Vercel

### PostgreSQL Database (Prisma Cloud)
- Stores user accounts, inventory, credentials
- Connection string in environment variables
- Multi-tenant with user_id isolation

### GitHub (https://github.com/WhiteCoatMD/portablebuildings)
- Source code repository
- Auto-deploys to Vercel on push to master
- Manual pull required on DigitalOcean

---

## Contact Info & Resources

### DigitalOcean Droplet
- **IP:** 134.199.200.206
- **SSH:** `ssh root@134.199.200.206`
- **Health:** http://134.199.200.206:3001/health
- **Location:** /var/www/sync-server/

### Vercel Project
- **Dashboard:** https://vercel.com
- **Environment Variables:** Project Settings → Environment Variables
- **Deployments:** View logs and redeploy

### Database
- **Host:** db.prisma.io
- **Type:** PostgreSQL
- **Connection string:** In environment variables

### GitHub Repository
- **URL:** https://github.com/WhiteCoatMD/portablebuildings
- **Branch:** master (auto-deploys to Vercel)

---

## Summary: You Are Here 👇

✅ System fully deployed
✅ All code committed and pushed
✅ New droplet running with latest code
✅ Decoder integrated
✅ Vercel updated with new IP

**NEXT:** Test the sync by clicking "Sync Now" in admin panel!

If it works, you're done! If not, check the troubleshooting section above.

---

**Good night! Pick up here tomorrow and test that sync! 🚀**
