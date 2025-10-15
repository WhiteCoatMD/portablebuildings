# Facebook App Review Guide for ShedSync
## Requesting Pages Permissions for Multi-Tenant Auto-Posting

### Overview
ShedSync needs `pages_manage_posts` and `pages_read_engagement` permissions so that portable building dealers can connect their Facebook Business Pages and automatically post new inventory listings.

---

## Step 1: Add Permissions to Your App

1. Go to https://developers.facebook.com/apps
2. Select your ShedSync app
3. Navigate to **App Review** → **Permissions and Features**
4. In the search box, type: **`pages_manage_posts`**
5. Click on it and click **"Request Advanced Access"**
6. Repeat for **`pages_read_engagement`**

---

## Step 2: Prepare Your App Review Submission

Facebook will ask you to explain your use case. Here's what to provide:

### **Use Case Description:**

**App Name:** ShedSync (or your Facebook App name)

**What does your app do?**
> ShedSync is a multi-dealer inventory management platform for portable building dealers. Dealers use our platform to manage their shed, barn, and cabin inventory. When dealers get new buildings in stock, our platform automatically posts these listings to their Facebook Business Page to help them reach more customers.

**How will you use pages_manage_posts?**
> When a dealer connects their Facebook Business Page through OAuth, our platform will automatically create Facebook posts when new inventory arrives. Each post includes:
> - Photo of the building
> - Building specifications (size, type, price)
> - Dealer contact information
> - Call-to-action to visit or call
>
> This saves dealers time by eliminating manual posting and ensures their inventory is immediately visible to potential customers on Facebook.

**How will you use pages_read_engagement?**
> This permission is required as a dependency of pages_manage_posts. We use it to verify that posts were successfully created and to read basic page information when dealers connect their pages.

---

## Step 3: Provide Required Documentation

Facebook will require:

### **1. App Screenshots**
Provide screenshots showing:
- Your admin panel with the Facebook connection button
- The OAuth flow where dealers authorize your app
- A sample auto-posted Facebook listing

### **2. Step-by-Step Instructions**
Provide test credentials and clear steps:

```
Test User Instructions:

1. Go to https://shed-sync.com/login.html
2. Log in with test credentials:
   Email: [provide test dealer account]
   Password: [provide test password]

3. Click "Site Customization" tab
4. Scroll to "Facebook Auto-Posting" section
5. Click "Connect with Facebook" button
6. Authorize the app to access your test Facebook page
7. Toggle "Enable Auto-Posting to Facebook" ON
8. Go to "Manage Buildings" tab
9. Upload a photo to any building
10. Observe that a post is automatically created on the connected Facebook page

Your test Facebook Page: [provide link to your test page]
```

### **3. Screencast Video (Optional but Recommended)**
Record a 2-3 minute video showing:
- Dealer logging into ShedSync
- Connecting their Facebook page
- Enabling auto-posting
- The automatic post appearing on Facebook

---

## Step 4: Facebook App Settings to Complete

### **Privacy Policy URL**
Required for App Review. Add to your app settings:
- Go to **Settings** → **Basic**
- Add Privacy Policy URL: `https://shed-sync.com/privacy-policy.html`

### **Terms of Service URL** (optional but recommended)
- Add Terms of Service URL: `https://shed-sync.com/terms.html`

### **App Icon**
- Upload a clear 1024x1024 icon of your ShedSync logo

### **Business Verification**
For certain permissions, Facebook may require:
- **Business Verification** - Verify your business with Facebook
- Requires: Business documents, website, business email

---

## Step 5: OAuth Redirect URIs

Make sure these are configured in **Settings** → **Basic** → **Valid OAuth Redirect URIs**:
```
https://shed-sync.com/api/auth/facebook-callback
https://www.shed-sync.com/api/auth/facebook-callback
```

---

## Step 6: Submit for Review

1. After adding all required info, click **"Submit for Review"**
2. Facebook typically responds within 3-5 business days
3. They may ask follow-up questions - respond promptly

---

## Current Code Status

**Your OAuth flow is configured correctly for after approval.** Once Facebook approves your permissions:

✅ **File:** `api/auth/facebook-oauth-start.js`
- Currently using: `public_profile` (works only for page admins)
- Ready to switch to: `pages_manage_posts,pages_read_engagement`

✅ **File:** `api/auth/facebook-callback.js`
- Properly exchanges tokens
- Gets long-lived page access tokens
- Stores tokens securely in database

---

## After Approval

Once approved, update the OAuth scope:

**File:** `api/auth/facebook-oauth-start.js` line 53

Change from:
```javascript
`&scope=public_profile` +
```

To:
```javascript
`&scope=pages_manage_posts,pages_read_engagement` +
```

---

## Testing Before Approval

**Current limitation:** With only `public_profile`, the OAuth flow works but:
- ✅ You (the app developer) can connect pages you admin
- ✅ Dealers who are page admins can connect their pages
- ❌ Posts may only be visible to page admins (not public) until app is approved
- ❌ App must be in "Live" mode for public posts

**After approval:**
- ✅ Any dealer can connect any page they manage
- ✅ Posts are fully public
- ✅ Works for all users

---

## Important Notes

1. **App Mode:** Make sure your app is in **"Live" mode** (not Development mode) after approval
   - Go to **Settings** → **Basic** → Toggle **"App Mode"** to Live

2. **Data Use Checkup:** Complete Facebook's Data Use Checkup
   - Go to **Settings** → **Advanced** → **Data Use Checkup**

3. **Rate Limits:** Facebook has rate limits for API calls
   - 200 calls per hour per user for pages_manage_posts
   - Should be more than enough for your use case

---

## Support

If Facebook denies your request:
- Read their feedback carefully
- Common reasons: unclear use case, missing screenshots, unclear benefits
- Revise and resubmit with more detailed explanation
- Emphasize the **business value** to dealers (time savings, reaching customers)

---

## Questions Facebook May Ask

**Q: Why do you need access to users' pages?**
> A: Portable building dealers who subscribe to our platform want to automatically share their new inventory on their Facebook Business Page. This helps them reach customers and saves them time from manual posting.

**Q: Will you be posting on behalf of users without their knowledge?**
> A: No. Dealers explicitly connect their Facebook page through OAuth and enable auto-posting through a toggle in their dashboard. They control what gets posted through their inventory management and can disconnect at any time.

**Q: How do you protect user data?**
> A: We only request the minimum permissions needed. Page access tokens are encrypted in our database. Dealers can revoke access at any time through Facebook or through our platform. We never access personal user data - only their business page posting capability.

---

## Timeline

- **Permission Request:** Immediate
- **Facebook Review:** 3-5 business days (sometimes up to 2 weeks)
- **Approval/Denial:** Via email and dashboard notification
- **Go Live:** Immediate after approval

Good luck with your App Review! 🚀
