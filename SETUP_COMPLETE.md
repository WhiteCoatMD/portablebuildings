# ✅ Per-User Inventory Sync - Setup Complete!

Your portable buildings inventory system now supports **per-user GPB Sales syncing** with encrypted credential storage!

## What's New

### 1. Per-User GPB Credentials
- Each user can save their own GPB Sales login credentials
- Passwords are encrypted with AES-256-CBC before storage
- Credentials are stored securely in the PostgreSQL database
- No more shared inventory or CSV uploads!

### 2. New Admin Panel Features
Located in **Site Customization → Inventory Sync Settings**:
- GPB Sales Username/Email field
- GPB Sales Password field (encrypted)
- Auto-sync toggle (for future scheduled syncs)
- "Save Credentials" button
- "Sync Now" button for instant syncing

### 3. Database Updates
Added three new columns to the `users` table:
- `gpb_username` - Stores GPB Sales login email
- `gpb_password_encrypted` - Encrypted password
- `auto_sync_enabled` - Toggle for automatic syncing

## 🚀 Quick Start (5 Minutes)

### Step 1: Deploy the Sync Server

The sync server needs to run 24/7 to handle browser automation. **Deploy it to Railway.app (FREE):**

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `portable_buildings` repository
4. Add environment variables:
   - `DATABASE_URL` = (copy from Vercel .env.local)
   - `WEBHOOK_SECRET` = `my-secure-secret-123` (any random string)
5. Railway will automatically run `npm start` (which runs sync-server.js)
6. Copy your Railway URL (looks like `https://your-app.up.railway.app`)

### Step 2: Update Vercel Environment Variables

1. Go to your Vercel project → Settings → Environment Variables
2. Add these variables:
   - `SYNC_SERVER_URL` = `https://your-app.up.railway.app` (from Railway)
   - `WEBHOOK_SECRET` = `my-secure-secret-123` (same as Railway)
3. Click "Redeploy" to apply changes

### Step 3: Test It!

1. Go to your deployed site: https://portablebuildings-9uztjvul9-mitch-brattons-projects.vercel.app
2. Log in to admin panel
3. Go to "Site Customization" tab
4. Scroll to "Inventory Sync Settings"
5. Enter your GPB Sales credentials
6. Click "Save Credentials"
7. Click "Sync Now"
8. Wait 1-2 minutes while it scrapes GPB Sales
9. Page will reload with your inventory!

## 🔒 Security Features

✅ **Passwords encrypted** - Uses AES-256-CBC encryption
✅ **Webhook authentication** - Requires secret key to trigger sync
✅ **Per-user isolation** - Each user's data is completely separate
✅ **Secure transmission** - All API calls use HTTPS
✅ **Database security** - Credentials never stored in plain text

## 📊 How It Works

```
User clicks "Sync Now"
    ↓
Vercel retrieves encrypted credentials from database
    ↓
Vercel sends request to Railway sync server (with webhook secret)
    ↓
Railway decrypts password and logs into GPB Sales
    ↓
Playwright scrapes inventory pages
    ↓
Railway sends inventory data back to Vercel
    ↓
Vercel saves to user_inventory table
    ↓
Page reloads showing updated inventory
```

## 📁 Files Modified

### API Endpoints Created:
- `api/user/save-gpb-credentials.js` - Save encrypted credentials
- `api/user/get-gpb-credentials.js` - Retrieve and decrypt credentials
- `api/user/trigger-sync.js` - Trigger sync for authenticated user

### Database:
- `setup-database.js` - Updated with new columns
- `add-gpb-columns.js` - Migration script
- `verify-gpb-columns.js` - Verification script

### UI:
- `admin.html` - Added "Inventory Sync Settings" card
- `admin.js` - Added save/load/sync functions
- `sync-server.js` - Updated for hosted deployment

## 💰 Monthly Costs

- **Vercel**: Free
- **Railway.app**: $5/month (includes $5 free credit = **FREE**)
- **Database**: Free tier
- **Total**: **$0/month**

## 🐛 Troubleshooting

**"Could not connect to sync server"**
- Check that Railway service is running
- Verify `SYNC_SERVER_URL` in Vercel is correct
- Make sure webhook secrets match

**"Sync failed"**
- Verify GPB Sales credentials are correct
- Check Railway logs for error details
- Make sure you saved credentials before syncing

**"No buildings found"**
- GPB Sales login might have failed
- Check Railway logs to see screenshots
- Try logging into GPB Sales manually to verify credentials

## 📝 Next Steps

1. **Set up scheduled syncing** - Add a cron job to trigger syncs daily
2. **Add email notifications** - Alert users when sync completes
3. **Multi-lot support** - Allow users to add multiple GPB accounts
4. **Sync history** - Track when each sync occurred

## 🎉 Done!

Your users can now:
- Save their GPB credentials securely
- Sync their inventory with one click
- Have completely isolated data
- No need to run anything locally!

---

**Questions?** Check `SYNC_DEPLOYMENT_GUIDE.md` for detailed Railway deployment instructions.
