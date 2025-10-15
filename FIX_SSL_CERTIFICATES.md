# Fix Windows SSL Certificate Issues

## The Problem
Your Windows machine is having SSL certificate validation errors when connecting to PayPal servers. This prevents the PayPal SDK from loading in your browser.

## Quick Fixes (Try These In Order)

### 1. Try a Different Browser
- Open admin page in Firefox, Edge, or Chrome (whichever you're NOT currently using)
- Sometimes browsers have different certificate stores

### 2. Clear Browser SSL State (Chrome)
1. Open Chrome
2. Go to: `chrome://settings/security`
3. Scroll down and click "Manage certificates"
4. Go to "Advanced" tab
5. Click "Clear SSL state"
6. Restart Chrome
7. Try loading admin page again

### 3. Update Windows Root Certificates
Run these commands in PowerShell as Administrator:

```powershell
# Update Windows certificates
certutil -generateSSTFromWU roots.sst
certutil -addstore -f root roots.sst
del roots.sst

# Restart certificate services
net stop cryptsvc
net start cryptsvc
```

### 4. Sync Windows Time (Certificate Validation Needs Correct Time)
```powershell
# Run as Administrator
w32tm /resync
```

### 5. Disable SSL Verification (TEMPORARY - Development Only)
If all else fails and you just need to test, you can temporarily disable SSL verification:

**In Chrome:**
1. Close all Chrome windows
2. Right-click Chrome shortcut
3. Add to target: `--ignore-certificate-errors --ignore-ssl-errors`
4. Open Chrome from that shortcut
5. **WARNING:** Only use for local testing, never for production!

### 6. Use Edge (Recommended for Windows)
Microsoft Edge usually has the best SSL certificate handling on Windows:
1. Open Microsoft Edge
2. Go to http://localhost:3000/admin.html (or your admin URL)
3. Try the PayPal button there

## For Production (When Ready to Go Live)

When you're ready to deploy to production:
1. The SSL issues won't affect production (Vercel handles SSL)
2. Users won't experience these errors
3. This is only a local development environment issue

## Alternative: Test on Mobile
1. Make sure your local server is running
2. Find your computer's IP: `ipconfig` in CMD (look for IPv4 Address)
3. Open `http://YOUR_IP:3000/admin.html` on your phone/tablet
4. The mobile browser might not have the same SSL issues

## Need Help?
If none of these work, you can:
1. Deploy to Vercel and test there (no SSL issues in production)
2. Use a different computer for testing
3. Use PayPal production mode instead of sandbox (sometimes has better SSL support)
