# Google Business Profile API Setup Guide
### A Step-by-Step Walkthrough for Shed-Sync

This guide walks you through setting up Google Business Profile API integration for Shed-Sync auto-posting. I'll explain what everything means as we go.

---

## What We're Doing Here

Think of this like registering Shed-Sync as an "app" with Google. Just like how apps on your phone ask for permission to access your photos or contacts, we're registering Shed-Sync to be able to ask dealers for permission to post to their Google Business Profile.

**Important**: You only do this ONCE for Shed-Sync. After this setup, all your dealers can connect their individual Google Business Profiles through your admin panel.

---

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
   - **Use YOUR account** (doesn't have to be the dealer's account)
   - This is YOUR developer account for Shed-Sync
   - Could be your personal Gmail or business email

---

## Step 2: Create a Project

**What's a project?** Think of it as a folder that holds all the settings for Shed-Sync's Google integrations.

### Here's what you'll see:

When you first open Google Cloud Console, you'll see a blue bar at the top. Look for a dropdown that probably says "Select a project" or shows a project name.

1. **Click that project dropdown** at the top of the page (next to "Google Cloud")
2. A popup appears - click **"NEW PROJECT"** in the top right
3. You'll see a form:
   - **Project name**: Enter `Shed-Sync` (or `Shed-Sync-GBP` or whatever you want)
   - **Organization**: Leave as "No organization" (unless you have Google Workspace)
   - **Location**: Leave as default
4. Click the blue **"CREATE"** button
5. Wait 30-60 seconds while it creates (you'll see a loading spinner)
6. You might get a notification when it's done - click "SELECT PROJECT" if you see it

**Tip**: If you already have a project for Shed-Sync, just select it instead. You can use the same project for multiple Google APIs.

---

## Step 3: Enable Google Business Profile API

**What does "enable" mean?** Google has hundreds of APIs (ways for apps to connect to Google services). We need to turn on the specific one for Google Business Profile. It's free.

### Here's how:

1. **Find the API Library**:
   - Look on the left side of the screen - you'll see a hamburger menu (three lines)
   - Click it, then find **"APIs & Services"**
   - Click **"Library"** (or just click this direct link: https://console.cloud.google.com/apis/library)

2. **Search for the API**:
   - You'll see a page that says "API Library" at the top
   - There's a search bar - type: **`Google Business Profile`**
   - You'll see cards appear below with different APIs

3. **Select the right one**:
   - Click on the card that says **"Google Business Profile API"**
   - (It might also say "formerly Google My Business API" underneath)
   - **NOT** "Google Places API" or "Google Maps" - make sure it says "Business Profile"

4. **Enable it**:
   - You'll see a page about the API with a big blue **"ENABLE"** button
   - Click that button
   - Wait 10-20 seconds while it enables (progress bar at the top)
   - The page will change to show you a dashboard for the API

**You'll know it worked when**: The page changes and you see "API enabled" or a dashboard with graphs (even if they're empty).

---

## Step 4: Create OAuth 2.0 Credentials

**What are credentials?** These are like keys that let Shed-Sync talk to Google on behalf of your dealers. Think of it like the "Login with Google" button you see on websites - this is what makes that work.

### Here's the process:

1. **Go to Credentials**:
   - In the left sidebar (hamburger menu again), click **"APIs & Services"** → **"Credentials"**
   - Or click this shortcut: https://console.cloud.google.com/apis/credentials
   - You'll see a page that might be empty or have some items listed

2. **Start creating credentials**:
   - At the top, click the **"+ CREATE CREDENTIALS"** button
   - A dropdown appears with options
   - Select **"OAuth client ID"**

### ⚠️ You'll probably see a warning/button: "Configure Consent Screen"

**What's a consent screen?** Remember when you log into a website with Google and it shows a popup asking "Allow this app to access your Google account?" - that's the consent screen. We need to configure what that popup says.

**If you see "Configure Consent Screen" or "To create an OAuth client ID, you must first configure your consent screen":**

Don't worry! This is normal. Click the **"CONFIGURE CONSENT SCREEN"** button and follow the next steps below.

---

## Step 4a: Configure the Consent Screen (First Time Only)

This is what your dealers will see when they click "Connect Google Business Profile" in Shed-Sync.

### Choose User Type:

1. You'll see two options: **Internal** or **External**
   - **Choose "External"** (unless you have Google Workspace organization)
   - "External" means anyone with a Google account can use it (your dealers)
   - Click **"CREATE"**

### Fill in App Information:

2. You'll see a form with several fields:
   - **App name**: Type `Shed-Sync` (this is what dealers will see)
   - **User support email**: Select your email from the dropdown
   - **App logo**: Skip this for now (optional)
   - **Application home page**: You can skip or enter `https://portablebuildings.vercel.app`
   - **Authorized domains**: Skip for now
   - **Developer contact information**: Enter your email address

3. Scroll down and click **"SAVE AND CONTINUE"**

### Add Scopes (Permissions):

**What are scopes?** These tell Google what Shed-Sync needs permission to do. We only need access to post to Google Business Profile - nothing else.

4. On the "Scopes" page, click **"ADD OR REMOVE SCOPES"**

5. A big popup appears with a search box at the top
   - Type: `business.manage`
   - You'll see a filtered list appear

6. **Find and check the box** for:
   - `https://www.googleapis.com/auth/business.manage`
   - The description says: "See, edit, create, and delete your Google My Business accounts"

7. Scroll down in the popup and click **"UPDATE"**

8. Back on the Scopes page, click **"SAVE AND CONTINUE"**

### Test Users (Optional):

9. On the "Test users" page:
   - **You can skip this** - click **"SAVE AND CONTINUE"**
   - (Test users are only needed if you want to test before "publishing" the app)

### Summary:

10. Review everything on the summary page
    - Don't worry if it says "Testing" or "Not verified" - that's normal
    - Click **"BACK TO DASHBOARD"**

**You're done with the consent screen!** Now we can create the actual credentials.

---

## Step 4b: Create the OAuth Client ID

Now that the consent screen is configured, we can create the actual credentials.

### Create the credentials:

1. **Go back to Credentials**:
   - In the left sidebar, click **"Credentials"** (under APIs & Services)
   - You should see the credentials page again

2. **Create new credentials**:
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"OAuth client ID"** from the dropdown
   - This time it should work (no warning about consent screen)

3. **Choose application type**:
   - For **"Application type"**, select **"Web application"** from the dropdown
   - (NOT "Desktop" or "Mobile" - we need "Web application")

4. **Name it**:
   - **Name**: Enter `Shed-Sync Web Client` (or just "Shed-Sync")
   - This is just for you to identify it later

### Add Authorized Origins:

**What are these?** These tell Google which websites are allowed to start the login process.

5. Scroll down to **"Authorized JavaScript origins"**
   - Click **"+ ADD URI"**
   - Type: `https://portablebuildings.vercel.app`
   - Press Enter or click elsewhere
   - (You can add `http://localhost:3000` too if you want to test locally later)

### Add Redirect URIs:

**What are these?** After a dealer logs in with Google, Google needs to know where to send them back. This is that address.

6. Scroll down to **"Authorized redirect URIs"**
   - Click **"+ ADD URI"**
   - Type **EXACTLY**: `https://portablebuildings.vercel.app/api/auth/google-business/callback`
   - ⚠️ **IMPORTANT**: No trailing slash, must be exact
   - (You can also add `http://localhost:3000/api/auth/google-business/callback` for local testing)

7. **Create it**:
   - Scroll down and click the blue **"CREATE"** button
   - Wait a moment...

---

## Step 5: Save Your Credentials (THIS IS IMPORTANT!)

🎉 **Success!** A popup appears showing your credentials. This is the moment of truth.

### What you'll see:

A white popup with your credentials:
- **Your Client ID**: A long string like `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Your Client secret**: A shorter string like `GOCSPX-AbCdEfG123456789_xyz`

### What to do:

1. **Copy the Client ID**:
   - Click the copy icon next to "Client ID" (or select and copy the text)
   - **Paste it somewhere safe** - Notepad, password manager, email to yourself, etc.

2. **Copy the Client Secret**:
   - Click the copy icon next to "Client secret"
   - **Paste this somewhere safe too** - same place as the Client ID

3. **DON'T LOSE THESE!**
   - You'll need them to configure Shed-Sync
   - Treat the Client Secret like a password - keep it private

4. Click **"OK"** on the popup

### If you lost them or need to view them again:

- Go back to the Credentials page (APIs & Services → Credentials)
- You'll see your "Shed-Sync Web Client" listed under "OAuth 2.0 Client IDs"
- Click on the name to view them again

---

## Step 6: Add Credentials to Shed-Sync

Now we need to give these credentials to Shed-Sync. The best way is through Vercel (where Shed-Sync is hosted).

### Add them to Vercel (Recommended):

1. **Go to Vercel**:
   - Open [vercel.com](https://vercel.com) and log in
   - Find your `portablebuildings` project
   - Click on it

2. **Go to Settings**:
   - Click **"Settings"** in the top navigation
   - In the left sidebar, click **"Environment Variables"**

3. **Add the Client ID**:
   - Click **"Add New"** or the **"+"** button
   - **Name**: Type exactly `GOOGLE_BUSINESS_CLIENT_ID`
   - **Value**: Paste your Client ID (the long one ending in `.apps.googleusercontent.com`)
   - **Environments**: Check all three (Production, Preview, Development)
   - Click **"Save"**

4. **Add the Client Secret**:
   - Click **"Add New"** again
   - **Name**: Type exactly `GOOGLE_BUSINESS_CLIENT_SECRET`
   - **Value**: Paste your Client Secret (the one starting with `GOCSPX-`)
   - **Environments**: Check all three
   - Click **"Save"**

5. **Redeploy** (after I build the GBP integration):
   - You'll need to redeploy Shed-Sync for these variables to take effect
   - We'll do this after I finish coding the integration

### Alternative: Tell me the credentials

If you want, you can just send me the Client ID and Client Secret directly, and I can add them to Vercel for you. The Client ID is not sensitive (it's visible to users), but the Client Secret should be kept private (though I'm part of your development team).

---

## That's It for Google Cloud Setup! 🎉

You're done with the Google Cloud Console part! Here's what you accomplished:

✅ Created a Google Cloud project
✅ Enabled the Google Business Profile API
✅ Set up the OAuth consent screen (what dealers see when connecting)
✅ Created OAuth credentials (Client ID and Secret)
✅ Saved the credentials somewhere safe

---

## What Happens Next?

### I'll build the integration:
- Database tables to store GBP connections
- OAuth flow (login with Google button)
- Post creation API
- Auto-posting when new buildings arrive
- UI in the admin panel

### Then your dealers can connect:
1. They log into their Shed-Sync admin panel
2. Click "Connect Google Business Profile"
3. Sign in with their Google account (that owns their business)
4. Click "Allow" on the permission popup
5. Done! New buildings auto-post to their Google Business Profile

---

## Important Notes

### About Verification:
- **Each dealer's Google Business Profile must be verified** with Google
- This is separate from the OAuth setup - dealers verify their own businesses
- If a dealer's GBP isn't verified, posts won't work
- Verification is done at [business.google.com](https://business.google.com)
- Usually takes 1-5 days

### About "Unverified App" Warning:
- When dealers first connect, they might see a warning: "This app isn't verified"
- **This is normal!** It's because we haven't gone through Google's verification process
- Dealers can click "Advanced" → "Go to Shed-Sync (unsafe)" - it's actually safe
- If you want to remove this warning, you can apply for Google's verification (optional, takes weeks)

### Security:
- Each dealer only grants access to THEIR business
- Shed-Sync can't access other businesses
- Dealers can revoke access anytime at [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
- The OAuth tokens are stored encrypted in your database

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
