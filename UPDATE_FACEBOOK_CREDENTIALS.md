# Update Facebook App Credentials in Vercel

## Your New Business App Credentials

**App ID:** `708455431628165`
**App Secret:** `18211bb34c3c5c90a9dfc170a6bf4f62`

---

## Steps to Update in Vercel:

### Method 1: Vercel Web Dashboard (Recommended)

1. **Go to:** https://vercel.com/dashboard
2. **Navigate to:** Your ShedSync project
3. **Click:** Settings (left sidebar)
4. **Click:** Environment Variables
5. **Find and update these variables:**

#### Update FACEBOOK_APP_ID:
- Find: `FACEBOOK_APP_ID`
- Click the **three dots (...)** → **Edit**
- Replace old value with: `708455431628165`
- Click **Save**

#### Update FACEBOOK_APP_SECRET:
- Find: `FACEBOOK_APP_SECRET`
- Click the **three dots (...)** → **Edit**
- Replace old value with: `18211bb34c3c5c90a9dfc170a6bf4f62`
- Click **Save**

#### Verify FACEBOOK_REDIRECT_URI (should already be correct):
- Find: `FACEBOOK_REDIRECT_URI`
- Should be: `https://shed-sync.com/api/auth/facebook-callback`
- If not set, add it

---

### Method 2: Vercel CLI (Alternative)

```bash
# Set new App ID
vercel env add FACEBOOK_APP_ID production
# When prompted, enter: 708455431628165

# Set new App Secret
vercel env add FACEBOOK_APP_SECRET production
# When prompted, enter: 18211bb34c3c5c90a9dfc170a6bf4f62
```

---

## After Updating:

### 1. Redeploy Your App
After saving the environment variables:
- Vercel will automatically redeploy (takes 1-2 minutes)
- OR click **"Deployments"** → Latest deployment → **"Redeploy"**

### 2. Verify Deployment
Wait for the deployment to complete:
- Green checkmark = ready to test
- Usually takes 1-2 minutes

### 3. Test the Facebook OAuth Flow
Once deployed:

1. Go to: https://shed-sync.com/login.html
2. Log in to your ShedSync account
3. Navigate to: **Admin Panel** → **Site Customization**
4. Scroll to: **Facebook Auto-Posting** section
5. Click: **"Connect with Facebook"** button
6. Authorize the permissions when Facebook asks
7. Select your Facebook Business Page
8. Complete the connection

### 4. What Should Happen:
✅ Facebook authorization dialog appears
✅ You can select your page
✅ Connection completes successfully
✅ Your page name appears in the admin panel
✅ Facebook records this as a successful API test

### 5. Check Facebook App Dashboard:
After successful test:
1. Go to: https://developers.facebook.com/apps
2. Select your new Business app
3. Go to: **App Review** → **Permissions and Features**
4. Click on: **pages_manage_posts**
5. The **"Request Advanced Access"** button should now be enabled!

---

## Important Notes:

⚠️ **Keep your App Secret secure!**
- Don't commit it to git
- Only store in Vercel environment variables
- Don't share publicly

✅ **Your code is already configured correctly**
- No code changes needed
- The OAuth flow will automatically use the new credentials

🔒 **Security Check:**
- Make sure your old app credentials are fully replaced
- Consider regenerating the old app secret if it was exposed

---

## Troubleshooting:

### "Facebook App ID not configured" error:
- Environment variables not saved properly
- Redeploy didn't complete
- Check Vercel deployment logs

### OAuth redirect error:
- Verify redirect URI in Facebook app matches Vercel env var
- Should be: `https://shed-sync.com/api/auth/facebook-callback`

### "Invalid Scopes" error:
- pages_manage_posts not added to Facebook app yet
- Go add them in App Dashboard → Permissions and Features
- Search for: pages_manage_posts and pages_read_engagement

---

## Next Steps After Testing:

1. ✅ Complete successful OAuth test
2. ✅ Wait for "Request Advanced Access" button to activate
3. ✅ Click "Request Advanced Access" for both permissions
4. ✅ Fill out App Review form (use FACEBOOK_APP_REVIEW_GUIDE.md)
5. ✅ Submit for review
6. ⏳ Wait 3-5 business days for Facebook review
7. ✅ Switch app to Live Mode after approval

---

## Summary:

**Old App ID:** ❌ (remove this)
**New App ID:** ✅ `708455431628165`
**New App Secret:** ✅ `18211bb34c3c5c90a9dfc170a6bf4f62`

Update these in Vercel → Your Project → Settings → Environment Variables

Then test the Facebook connection flow! 🚀
