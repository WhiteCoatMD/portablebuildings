# Google Business Profile API Quota Issue - FIX

## Problem
Quota is set to 0 for "My Business Account Management API"

## Solution

### Option 1: Request Quota Increase (Recommended)

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/

2. **Navigate to Quotas**
   - Left menu → **IAM & Admin** → **Quotas & System Limits**

3. **Filter for the API**
   - In the filter box, type: `My Business Account Management`
   - OR filter by service: `mybusinessaccountmanagement.googleapis.com`

4. **Find and Edit the Quota**
   - Look for: **"Requests per minute"** or **"Requests per day"**
   - Check the box next to it
   - Click **"EDIT QUOTAS"** at the top right

5. **Fill Out Request Form**
   - Name: Your name
   - Email: Your email
   - New quota value: **60** (requests per minute)
   - Justification:
   ```
   I am developing ShedSync, a SaaS application that helps portable building
   dealers automatically post their inventory to Google Business Profile.

   The application uses OAuth 2.0 to connect dealer Google Business accounts
   and needs to fetch account and location information to allow users to
   select which location to post to.

   I am currently in the testing phase with approved test users and need
   basic API access to complete development and submit for Google verification.

   Expected usage: ~10-20 requests per user during initial setup, then
   minimal ongoing requests for posting updates.
   ```

6. **Submit and Wait**
   - Click **"SUBMIT REQUEST"**
   - Google typically responds within 24-48 hours
   - Sometimes approved instantly for basic quotas

### Option 2: Check API is Fully Enabled

1. **Go to APIs & Services**
   - Left menu → **APIs & Services** → **Enabled APIs & services**

2. **Verify These 3 APIs are Enabled:**
   - ✅ Google My Business Account Management API
   - ✅ Google My Business Business Information API
   - ✅ Google My Business Verification API

3. **If Any Are Missing:**
   - Click **"+ ENABLE APIS AND SERVICES"**
   - Search for the missing API
   - Click **"ENABLE"**

### Option 3: Create New Project (If Stuck)

Sometimes quotas are locked on older projects. You can:

1. Create a new Google Cloud project
2. Enable the 3 required APIs
3. Create new OAuth credentials
4. Update your environment variables
5. The new project should have default quotas

## After Quota is Approved

1. Wait for email confirmation from Google
2. Go back to shed-sync.com admin panel
3. Click **"🔄 Refresh"** button
4. Your business name and location should load
5. Click **"Change Location"** to select your location

## Alternative During Testing

While waiting for quota approval, you can:
- Manually enter your location name in the database
- Test other features (Facebook posting, inventory management)
- Continue development on non-Google features

## Notes

- This is a one-time setup issue
- Once quota is approved, you'll have 60+ requests per minute
- After Google verification, quotas increase even more
- This is normal for Google Business Profile API integration
