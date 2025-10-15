# Facebook OAuth Setup for ShedSync

This guide explains how to set up Facebook OAuth so dealers can easily connect their Facebook pages with a simple "Connect with Facebook" button.

## Prerequisites

You need to create a Facebook App in the Meta Developer Portal. This is a one-time setup for the entire ShedSync platform.

## Step 1: Create a Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in:
   - **App Name:** ShedSync
   - **App Contact Email:** Your email
   - **Business Account:** (Optional, but recommended)
5. Click **"Create App"**

## Step 2: Configure Facebook Login

1. In your app dashboard, find **"Facebook Login"** in the products list
2. Click **"Set Up"** on Facebook Login
3. Select **"Web"** as the platform
4. Enter your Site URL: `https://shed-sync.com`
5. Click **"Save"** and **"Continue"**

## Step 3: Configure OAuth Redirect URIs

1. Go to **Facebook Login** → **Settings** in the left sidebar
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   https://shed-sync.com/api/auth/facebook-callback
   ```
3. Click **"Save Changes"**

## Step 4: Add Required Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `pages_show_list` - To see list of pages user manages
   - `pages_read_engagement` - To read page information
   - `pages_manage_posts` - To publish posts on behalf of the page

3. For each permission, click **"Request"** and fill out the form explaining:
   - **How you will use this permission:** "To allow portable building dealers to automatically post their inventory to their Facebook business pages"
   - **Why you need this permission:** "Dealers need to share their inventory with customers on Facebook"

## Step 5: Get Your App Credentials

1. Go to **Settings** → **Basic**
2. Find:
   - **App ID** - Copy this
   - **App Secret** - Click **"Show"** and copy this

## Step 6: Configure Vercel Environment Variables

Add these environment variables to your Vercel project:

```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_REDIRECT_URI=https://shed-sync.com/api/auth/facebook-callback
```

### How to add environment variables in Vercel:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `FACEBOOK_APP_ID`
   - Value: Your App ID from Facebook
   - Environments: Production, Preview, Development
4. Click **"Save"**
5. Repeat for `FACEBOOK_APP_SECRET` and `FACEBOOK_REDIRECT_URI`

## Step 7: Redeploy

After adding the environment variables, redeploy your Vercel project for the changes to take effect.

## Step 8: Switch to Live Mode (Production)

1. In your Facebook App dashboard, go to **Settings** → **Basic**
2. Toggle **"App Mode"** from **Development** to **Live**
3. This allows any Facebook user to connect their pages

## How It Works for Dealers

Once set up, dealers can:

1. Go to their Admin Panel → **Site Customization** tab
2. Scroll to **Facebook Auto-Posting** section
3. Click **"Connect with Facebook"** button
4. Authorize ShedSync to access their Facebook pages
5. Done! Their page token is automatically saved

No manual token copying or developer console required!

## Security Notes

- Facebook tokens are stored encrypted in the database
- Long-lived tokens (60 days) are automatically obtained
- Tokens need to be refreshed periodically (implement a refresh mechanism or dealers re-connect)

## Troubleshooting

### "App Not Set Up" Error
- Make sure you've completed Step 2 (Configure Facebook Login)
- Verify the redirect URI exactly matches what's in Facebook settings

### "Invalid OAuth Redirect URI"
- Check that `FACEBOOK_REDIRECT_URI` environment variable matches the one configured in Facebook
- Make sure you're using HTTPS

### "Permission Denied"
- Verify the app has the required permissions approved
- If in Development mode, only test users can connect

### No Pages Found
- User must be an admin of at least one Facebook Page
- User must grant ShedSync permission to access their pages

## Testing

To test in Development mode:
1. Add test users in **Roles** → **Test Users**
2. Create a test Facebook Page managed by that test user
3. Connect using the test user account
