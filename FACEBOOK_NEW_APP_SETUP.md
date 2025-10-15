# Facebook Business App Setup for ShedSync
## Creating a New Business-Type App for Pages API Access

---

## Step 1: Create New Business App

1. Go to https://developers.facebook.com/apps
2. Click **"Create App"**
3. Select **"Business"** as the app type (REQUIRED for Pages API)
4. Fill in:
   - **App Name:** ShedSync
   - **App Contact Email:** support@shed-sync.com (or your email)
   - **Business Portfolio:** Create a new one or select existing
5. Click **"Create App"**

---

## Step 2: Basic Settings

Go to **Settings** → **Basic**

### Required Fields:

**App Icon:**
- Upload your ShedSync logo (1024x1024px)

**Privacy Policy URL:**
```
https://shed-sync.com/privacy-policy.html
```

**Terms of Service URL:**
```
https://shed-sync.com/terms.html
```

**App Domains:**
```
shed-sync.com
www.shed-sync.com
```

**Category:**
- Select: "Business and Pages"

---

## Step 3: Add Facebook Login Product

1. In the left sidebar, click **"+ Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Click **"Settings"** under Facebook Login

### Configure OAuth Settings:

**Valid OAuth Redirect URIs:**
```
https://shed-sync.com/api/auth/facebook-callback
https://www.shed-sync.com/api/auth/facebook-callback
```

**Client OAuth Settings:**
- ✅ Client OAuth Login: **ON**
- ✅ Web OAuth Login: **ON**
- ✅ Use Strict Mode for Redirect URIs: **ON**

**Login from Devices:**
- ❌ Leave OFF (not needed)

---

## Step 4: Copy Your App Credentials

Go to **Settings** → **Basic**

Copy these values:

**App ID:**
```
[Your new App ID will be here]
```

**App Secret:**
```
Click "Show" to reveal, then copy
```

---

## Step 5: Add Pages API Permissions

1. Go to **App Review** → **Permissions and Features**
2. In the search box, type: **`pages_manage_posts`**
3. Click on it to add it
4. Type: **`pages_read_engagement`**
5. Click on it to add it

Both should now appear in your permissions list!

---

## Step 6: Update Vercel Environment Variables

You need to update your environment variables with the new App ID and Secret:

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Update these variables:

**FACEBOOK_APP_ID**
```
[Your new App ID from Step 4]
```

**FACEBOOK_APP_SECRET**
```
[Your new App Secret from Step 4]
```

**FACEBOOK_REDIRECT_URI** (should already be correct)
```
https://shed-sync.com/api/auth/facebook-callback
```

3. Click **"Save"**
4. **Redeploy** your app for changes to take effect

---

## Step 7: Request Advanced Access for Permissions

### For each permission (pages_manage_posts and pages_read_engagement):

1. Click on the permission
2. Click **"Request Advanced Access"** or **"Get Advanced Access"**
3. Fill out the form:

### **Use Case Description for pages_manage_posts:**

```
ShedSync is a multi-dealer inventory management platform for portable building dealers.

When dealers connect their Facebook Business Page through OAuth, our platform
automatically posts new building listings to help them reach more customers.

Each auto-post includes:
- Photo of the building
- Building specifications (size, type, price)
- Dealer contact information
- Call-to-action

Dealers control:
- Whether auto-posting is enabled (toggle on/off)
- Which buildings get posted (through inventory settings)
- Post templates (customizable)

This saves dealers time and ensures their inventory is immediately visible to
potential customers on Facebook.
```

### **Use Case Description for pages_read_engagement:**

```
This permission is required as a dependency of pages_manage_posts.

We use it to:
- Verify that posts were successfully created
- Read basic page information when dealers connect their pages
- Display connection status in the dealer dashboard
```

### **Provide:**

1. **Screenshots** showing:
   - Your admin panel with Facebook connection button
   - The OAuth authorization flow
   - A sample auto-posted building

2. **Step-by-step test instructions:**
   ```
   1. Visit https://shed-sync.com/login.html
   2. Log in with test account: [provide test credentials]
   3. Go to "Site Customization" tab
   4. Scroll to "Facebook Auto-Posting" section
   5. Click "Connect with Facebook" button
   6. Authorize the app for your test page
   7. Enable "Auto-Posting to Facebook" toggle
   8. Go to "Manage Buildings" tab
   9. Upload a photo to any building
   10. Check your test Facebook page for the auto-posted listing
   ```

3. **Screencast video** (optional but helpful):
   - Record 2-3 minute demo of the OAuth flow and auto-posting

---

## Step 8: Switch App to Live Mode

**IMPORTANT:** After permissions are approved:

1. Go to **Settings** → **Basic**
2. At the top, find the **App Mode** toggle
3. Switch from **"Development"** to **"Live"**
4. Confirm the switch

**Why this matters:**
- Development Mode: Posts only visible to app developers/page admins
- Live Mode: Posts visible to the public

---

## Step 9: Test Before Going Live

### While in Development Mode:

1. Connect your own Facebook page (you must be an admin)
2. Test the auto-posting feature
3. Verify posts are created correctly
4. Check that all OAuth flows work

**Note:** In Development Mode, only you and other app developers will see the posts.

---

## Step 10: Business Verification (If Required)

Facebook may require **Business Verification** for certain permissions:

1. Go to **Settings** → **Business Verification**
2. Provide:
   - Business documents (tax ID, articles of incorporation, etc.)
   - Phone number verification
   - Website verification

This process can take 1-2 weeks.

---

## Timeline Expectations

- **App Creation:** Immediate
- **Basic Setup:** 30 minutes
- **Add Permissions:** Immediate
- **Permission Review:** 3-5 business days (up to 2 weeks)
- **Business Verification (if needed):** 1-2 weeks
- **Total:** 1-3 weeks

---

## After Approval

Once Facebook approves your permissions:

1. ✅ **Update environment variables** in Vercel (if not done already)
2. ✅ **Switch app to Live Mode** (Settings → Basic → App Mode)
3. ✅ **Test with a real dealer account**
4. ✅ **Verify posts are publicly visible**

Your code is already set up correctly! The OAuth flow will automatically work once:
- New App ID/Secret are in environment variables
- Permissions are approved
- App is in Live Mode

---

## Common Issues

### "Can't find pages_manage_posts"
- ❌ You created a Consumer or Gaming app
- ✅ Create a new **Business** type app

### "Permission not available"
- ❌ App is not set up correctly
- ✅ Add Facebook Login product first
- ✅ Configure OAuth redirect URIs

### "Posts not public"
- ❌ App is in Development Mode
- ✅ Switch to Live Mode after approval

### "Business Verification Required"
- Some permissions require business verification
- Prepare business documents in advance
- Process takes 1-2 weeks

---

## Current vs New App

### Your Current App:
- ❌ Wrong type (Consumer/Gaming)
- ❌ No access to Pages API permissions
- ❌ Cannot add pages_manage_posts

### Your New Business App:
- ✅ Correct type (Business)
- ✅ Has access to Pages API permissions
- ✅ Can request pages_manage_posts and pages_read_engagement
- ✅ Designed for multi-tenant business use cases

---

## Support

If you get stuck:
- Facebook Developer Support: https://developers.facebook.com/support/
- Review the App Review docs: https://developers.facebook.com/docs/app-review/

---

## Checklist

Before submitting for App Review:

- [ ] App type is "Business"
- [ ] App icon uploaded (1024x1024)
- [ ] Privacy Policy URL added
- [ ] Terms of Service URL added
- [ ] Facebook Login product added
- [ ] OAuth redirect URIs configured
- [ ] pages_manage_posts added to app
- [ ] pages_read_engagement added to app
- [ ] App ID and Secret updated in Vercel
- [ ] Screenshots prepared
- [ ] Test instructions written
- [ ] Use case descriptions ready
- [ ] Test account created with sample data

---

Good luck! 🚀
