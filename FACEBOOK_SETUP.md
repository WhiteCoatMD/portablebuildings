# Facebook Auto-Posting Setup Guide

This guide will help you set up automatic Facebook posting for your portable building listings.

## Prerequisites

1. A Facebook Business Page (not a personal profile)
2. Admin access to the Facebook Page
3. A Facebook Developer account

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in your app details:
   - App Name: "Portable Buildings Auto-Post" (or your choice)
   - App Contact Email: Your email
5. Click "Create App"

## Step 2: Add Facebook Login Product

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" as the platform
4. Enter your website URL (e.g., `https://your-site.vercel.app`)

## Step 3: Configure Facebook Login

1. In the left sidebar, go to "Facebook Login" → "Settings"
2. Add your website URL to "Valid OAuth Redirect URIs":
   - `https://your-site.vercel.app`
3. Save changes

## Step 4: Get Your Page Access Token

### Method 1: Using Graph API Explorer (Recommended)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the "Facebook App" dropdown
3. Click "Generate Access Token"
4. In the permissions dialog, select:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_manage_engagement`
5. Click "Generate Access Token" and authorize
6. Copy the generated token (this is a short-lived token)

### Method 2: Get Long-Lived Page Token

**Important:** Short-lived tokens expire in 1-2 hours. You need a long-lived token.

1. Get a long-lived user access token:
```bash
https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={YOUR_APP_ID}&
  client_secret={YOUR_APP_SECRET}&
  fb_exchange_token={SHORT_LIVED_TOKEN}
```

2. Get your Page ID and Page Access Token:
```bash
https://graph.facebook.com/v18.0/me/accounts?access_token={LONG_LIVED_USER_TOKEN}
```

3. The response will include your Page ID and a never-expiring Page Access Token

## Step 5: Find Your Facebook Page ID

### Option 1: Using Graph API Explorer
1. In Graph API Explorer, use the token from Step 4
2. In the query field, enter: `me/accounts`
3. Click "Submit"
4. Find your page in the results and copy the `id` field

### Option 2: From Your Page Settings
1. Go to your Facebook Page
2. Click "Settings" → "Page Info"
3. Scroll to find "Page ID"

## Step 6: Configure in Admin Panel

1. Go to your admin panel: `https://your-site.vercel.app/admin.html`
2. Navigate to the "Site Customization" tab
3. Scroll to the "Facebook Auto-Posting" section
4. Fill in the following:

   **Enable Auto-Posting:** Toggle ON

   **Facebook Page ID:** Paste your Page ID from Step 5

   **Facebook Page Access Token:** Paste your long-lived Page Access Token from Step 4

   **Auto-Post Conditions:** Configure when buildings should be posted
   - ✅ Only post new inventory (not repos)
   - ✅ Only post buildings with uploaded images
   - ✅ Only post available buildings (not sold/pending)

   **Post Template:** Customize your post message
   ```
   🏠 New Arrival! {{name}}

   📐 Size: {{size}}
   💰 Cash Price: {{price}}
   📍 Location: {{location}}

   Call us at {{phone}} or visit our website to learn more!

   #PortableBuildings #{{type}} #ForSale
   ```

   Available placeholders:
   - `{{name}}` - Building name/title
   - `{{size}}` - Building size (e.g., 10x12)
   - `{{price}}` - Cash price
   - `{{type}}` - Building type (e.g., Lofted Barn)
   - `{{location}}` - Lot location
   - `{{phone}}` - Business phone number

5. Click "💾 Save All Customization"

## Step 7: Test the Integration

### Manual Test
1. Go to the "Manage Buildings" tab in admin
2. Find a building that meets your auto-post conditions
3. The building will be automatically posted when:
   - New images are uploaded
   - Building status changes to "Available"
   - Building appears in inventory sync

### Check Posted Buildings
- Posted buildings are tracked to prevent duplicates
- Check your Facebook Page to see the posts
- Posts include the building image (if available) and custom message

## How Auto-Posting Works

The system automatically posts buildings to Facebook when:

1. **New Building Added:**
   - When inventory syncs and a new building appears
   - Building meets all configured conditions

2. **Images Uploaded:**
   - When you upload photos to a building
   - If "Only post with images" is enabled

3. **Status Change:**
   - When a building's status changes to "Available"
   - If "Only post available buildings" is enabled

4. **Conditions Checked:**
   - New inventory only (skips repos if enabled)
   - Has uploaded images (if enabled)
   - Status is "available" (if enabled)
   - Not previously posted

## Troubleshooting

### "Invalid OAuth access token"
- Your token has expired
- Generate a new long-lived Page Access Token (Step 4)
- Update it in the admin panel

### "Permissions error"
- Make sure you granted all required permissions in Step 4
- Regenerate the token with correct permissions

### Posts not appearing
- Check that auto-posting is enabled
- Verify buildings meet all configured conditions
- Check browser console for errors
- Verify Page ID and Access Token are correct

### "This feature is not available right now"
- Your app may not be approved for posting
- Go to App Review in Facebook Developer Console
- Request permissions: `pages_manage_posts`

## Security Notes

- Never share your Access Token publicly
- The token is stored in localStorage (client-side only)
- Consider using environment variables for production
- Rotate your token periodically

## Rate Limits

Facebook has rate limits:
- ~200 posts per hour per user
- ~600 posts per day per app
- The system prevents duplicate posts automatically

## Need Help?

- [Facebook Developer Documentation](https://developers.facebook.com/docs/graph-api)
- [Facebook Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

**Last Updated:** 2025-01-12
