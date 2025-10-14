# GPB Sales Auto-Sync Deployment Guide

Your inventory system needs a small background service to run the browser automation that logs into GPB Sales and scrapes your inventory. This guide shows you the **easiest** ways to deploy it.

## Option 1: Deploy to Railway.app (RECOMMENDED - Takes 5 minutes)

Railway.app is a free hosting service that's perfect for this. It will run your sync service 24/7.

### Steps:

1. **Create a Railway account** at https://railway.app (sign in with GitHub)

2. **Click "New Project" → "Deploy from GitHub repo"**

3. **Select your portable_buildings repository**

4. **Add these environment variables in Railway:**
   - Click your project → Variables tab
   - Add: `DATABASE_URL` = (copy from your Vercel .env.local)
   - Add: `WEBHOOK_SECRET` = (any random string like "my-secret-key-123")

5. **Configure the start command:**
   - Go to Settings → Start Command
   - Set to: `node sync-server.js`

6. **Get your Railway URL:**
   - Railway will give you a URL like `https://your-app.up.railway.app`
   - Copy this URL

7. **Add to Vercel:**
   - Go to your Vercel project → Settings → Environment Variables
   - Add: `SYNC_SERVER_URL` = `https://your-app.up.railway.app`
   - Add: `WEBHOOK_SECRET` = (same secret from step 4)
   - Redeploy your Vercel project

✅ **Done!** Your sync will now work automatically and users can click "Sync Now" in the admin panel.

---

## Option 2: Deploy to Render.com (Also Free)

Similar to Railway but slightly different interface:

1. Create account at https://render.com
2. Create new "Web Service"
3. Connect your GitHub repo
4. Build Command: `npm install`
5. Start Command: `node sync-server.js`
6. Add environment variables (same as Railway)
7. Get your Render URL and add to Vercel

---

## Option 3: Run on Your Computer (Development Only)

**Only for testing - your computer must stay on:**

1. Open terminal in your project folder
2. Run: `node sync-server.js`
3. Keep the terminal window open
4. In Vercel, set `SYNC_SERVER_URL` to `http://localhost:3001`

---

## How It Works

1. **User logs into admin panel** and saves their GPB Sales credentials (encrypted in database)
2. **User clicks "Sync Now"** in the admin panel
3. **Vercel sends a request** to your sync server (Railway/Render)
4. **Sync server opens a browser**, logs into GPB Sales with user's credentials
5. **Scrapes the inventory** and sends it back to Vercel
6. **Vercel saves it** to the database for that specific user
7. **User sees their buildings** instantly!

---

## Troubleshooting

**"Could not connect to sync server"**
- Make sure your Railway/Render service is running (check the dashboard)
- Verify `SYNC_SERVER_URL` is set correctly in Vercel
- Make sure the URL starts with `https://`

**"Sync failed"**
- Check that GPB Sales credentials are correct
- Look at Railway/Render logs to see the error
- The scraper takes screenshots - check the logs for details

---

## Cost

- **Railway.app**: $5/month (includes $5 free credit each month = FREE)
- **Render.com**: 750 hours/month free (more than enough)
- **Vercel**: Free
- **Database**: Free tier is plenty

**Total monthly cost: $0** (using free tiers)

---

## Security

✅ Your GPB credentials are:
- Encrypted with AES-256 before storage
- Only decrypted when syncing
- Never exposed to the browser
- Unique per user

✅ The sync server:
- Only accepts requests from your Vercel app
- Requires a secret webhook key
- Runs in an isolated environment
