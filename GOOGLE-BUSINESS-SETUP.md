# Google Business Profile API Setup Guide

This guide walks you through setting up Google Business Profile API integration for Shed-Sync auto-posting.

---

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (use the same account that manages your Google Business Profile)

---

## Step 2: Create or Select a Project

### If you don't have a project:
1. Click the project dropdown at the top of the page
2. Click **"NEW PROJECT"**
3. Enter project name: `Shed-Sync-GMB` (or any name you prefer)
4. Click **"CREATE"**
5. Wait for the project to be created (30-60 seconds)

### If you already have a project:
1. Click the project dropdown at the top
2. Select your existing project

---

## Step 3: Enable Google Business Profile API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - Or use this direct link: https://console.cloud.google.com/apis/library

2. In the search bar, type: `Google Business Profile API`

3. Click on **"Google Business Profile API"** (formerly "Google My Business API")

4. Click the blue **"ENABLE"** button

5. Wait for it to enable (10-20 seconds)

---

## Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
   - Or use this direct link: https://console.cloud.google.com/apis/credentials

2. Click **"+ CREATE CREDENTIALS"** at the top

3. Select **"OAuth client ID"** from the dropdown

### If you see "Configure Consent Screen":
You need to set up the OAuth consent screen first:

1. Click **"CONFIGURE CONSENT SCREEN"**

2. Choose **"External"** (unless you have a Google Workspace account)

3. Click **"CREATE"**

4. Fill in the required fields:
   - **App name**: `Shed-Sync`
   - **User support email**: Your email address
   - **Developer contact email**: Your email address

5. Click **"SAVE AND CONTINUE"**

6. On "Scopes" page, click **"ADD OR REMOVE SCOPES"**

7. In the filter box, type: `business.manage`

8. Check the box for:
   - `https://www.googleapis.com/auth/business.manage`
   - Description: "Manage your Google My Business data"

9. Click **"UPDATE"** at the bottom

10. Click **"SAVE AND CONTINUE"**

11. On "Test users" page (optional for now), click **"SAVE AND CONTINUE"**

12. Review the summary and click **"BACK TO DASHBOARD"**

### Now create the OAuth Client ID:

1. Go back to **"Credentials"** in the left sidebar

2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

3. For **"Application type"**, select **"Web application"**

4. Enter a name: `Shed-Sync Web Client`

5. Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**
   - Add: `https://portablebuildings.vercel.app`
   - Add: `http://localhost:3000` (for testing)

6. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
   - Add: `https://portablebuildings.vercel.app/api/auth/google-business/callback`
   - Add: `http://localhost:3000/api/auth/google-business/callback` (for testing)

7. Click **"CREATE"**

---

## Step 5: Save Your Credentials

A popup will appear with your credentials:

1. **Copy and save these somewhere safe:**
   - **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-AbCdEfG123456789`)

2. Click **"OK"**

3. You can always view these again by clicking the credential name in the list

---

## Step 6: Add Credentials to Shed-Sync

### Option A: Environment Variables (Recommended for Production)

Add these to your Vercel environment variables:

```
GOOGLE_BUSINESS_CLIENT_ID=your_client_id_here
GOOGLE_BUSINESS_CLIENT_SECRET=your_client_secret_here
```

### Option B: Configuration File (For Testing)

Create a file `config/google-business.json`:

```json
{
  "clientId": "your_client_id_here",
  "clientSecret": "your_client_secret_here"
}
```

**IMPORTANT**: Never commit this file to Git!

---

## Step 7: Verify Your Google Business Profile

Before the API will work, your Google Business Profile must be **verified**:

1. Go to [Google Business Profile Manager](https://business.google.com/)
2. Select your business
3. If not verified, click **"Verify now"** and follow the verification process
4. Verification can take 1-5 days depending on the method

---

## Step 8: Test the Connection

Once you've added the credentials to Shed-Sync:

1. Log into your Shed-Sync admin panel
2. Go to the **"Google Business"** tab (or Facebook Autoposting tab)
3. Click **"Connect Google Business Profile"**
4. Sign in with your Google account
5. Grant the requested permissions
6. You should see "Connected" status

---

## Troubleshooting

### "Error 403: access_denied"
- Make sure you added the scope `https://www.googleapis.com/auth/business.manage`
- Check that your Google Business Profile is verified

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches your domain
- No trailing slashes
- Must be `https://` for production

### "API not enabled"
- Double-check that "Google Business Profile API" is enabled in your project
- Wait a few minutes after enabling

### "Invalid client"
- Verify your Client ID and Client Secret are correct
- Make sure there are no extra spaces when copying

---

## Security Notes

- **Never share your Client Secret publicly**
- **Never commit credentials to Git**
- Use environment variables for production
- The OAuth tokens are stored encrypted in the database
- Each dealer connects their own Google Business Profile

---

## Next Steps

Once setup is complete:

1. Configure auto-posting settings in Shed-Sync admin panel
2. Customize your post templates
3. Test posting a building manually
4. Enable auto-posting for new inventory

---

## Need Help?

- Google Cloud Console: https://console.cloud.google.com/
- Google Business Profile API Docs: https://developers.google.com/my-business
- Contact Shed-Sync support if you encounter issues

---

**Last Updated**: January 2025
