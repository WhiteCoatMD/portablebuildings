# Google Business Profile OAuth Verification Guide

## Complete Step-by-Step Checklist

### STEP 1: Verify Pages are Live ✓

After deployment, verify these URLs work:
- Privacy Policy: https://portablebuildings.vercel.app/privacy.html
- Terms of Service: https://portablebuildings.vercel.app/terms.html

---

### STEP 2: Configure OAuth Consent Screen in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project with Client ID: `72228454003-5blt9l21sagkrleqt4at05cu245fsvmq`

2. **Navigate to OAuth Consent Screen**
   - In left menu: **APIs & Services** → **OAuth consent screen**

3. **Edit App Registration**
   - Click **EDIT APP** button

4. **Fill Out OAuth Consent Screen (Page 1)**

   **App Information:**
   - App name: `Portable Buildings Dealer Portal`
   - User support email: `info@dunritemetalbuildings.com`
   - App logo: (Optional, but recommended - upload a 120x120px logo)

   **App Domain:**
   - Application home page: `https://portablebuildings.vercel.app`
   - Privacy policy link: `https://portablebuildings.vercel.app/privacy.html`
   - Terms of service link: `https://portablebuildings.vercel.app/terms.html`

   **Authorized domains:**
   - Add: `vercel.app`
   - Add: `portablebuildings.vercel.app` (if separate domain)

   **Developer contact information:**
   - Email addresses: `info@dunritemetalbuildings.com`

   Click **SAVE AND CONTINUE**

5. **Scopes (Page 2)**

   Click **ADD OR REMOVE SCOPES**

   Find and select:
   - ✅ `https://www.googleapis.com/auth/business.manage`
     - Description: "Manage your Google My Business listings"
     - This is a **RESTRICTED** scope

   Click **UPDATE** then **SAVE AND CONTINUE**

6. **Test Users (Page 3)**

   Click **+ ADD USERS**

   Add test user emails (one per line):
   ```
   info@dunritemetalbuildings.com
   ```

   Click **ADD** then **SAVE AND CONTINUE**

7. **Summary (Page 4)**

   Review all information, then click **BACK TO DASHBOARD**

---

### STEP 3: Prepare for Verification

Before clicking "PUBLISH APP", prepare the following:

#### A. Verification Video (Required)

**What to show in video:**
1. Homepage of your app
2. Login to the admin panel
3. Navigate to "Automated Marketing" tab
4. Click "Configure Google →"
5. Click "Connect with Google" button
6. Show OAuth consent screen appearing
7. Grant permissions
8. Show successful connection
9. Sync inventory and show a building being posted to Google Business Profile

**Video Requirements:**
- Length: 2-4 minutes
- Format: MP4, MOV, or AVI
- Upload to YouTube (can be unlisted)
- Clear screen recording with narration or captions explaining what's happening

**Video Script:**

```
[SCENE 1: Introduction - 10 seconds]
"This is the Portable Buildings Dealer Portal. It helps portable building dealers
automatically post their inventory to Google Business Profile."

[SCENE 2: Login - 15 seconds]
"I'm logging into the admin panel with my dealer credentials."
[Show login screen and successful login]

[SCENE 3: Navigate to Google Business - 20 seconds]
"Navigate to the Automated Marketing tab and click 'Configure Google'"
[Show navigation]

[SCENE 4: OAuth Flow - 45 seconds]
"Click 'Connect with Google' to start the OAuth authorization process."
[Show OAuth consent screen appearing]
"Google asks for permission to manage my Business Profile. This allows the app
to post new buildings on my behalf."
[Click 'Allow']
"The app is now connected to my Google Business Profile."

[SCENE 5: Demonstrate Posting - 60 seconds]
"Now I'll sync my inventory from my supplier portal."
[Show sync process]
"New buildings are automatically detected and posted to my Google Business Profile
based on my schedule settings."
[Show a post appearing on Google Business Profile]

[SCENE 6: Showing the scope in action - 30 seconds]
"Here's the post on my Google Business Profile. It includes the building details,
price, and images - all automated through the API using the business.manage scope."
[Show the actual Google Business Profile with the post visible]

[SCENE 7: Revocation - 15 seconds]
"Users can disconnect at any time by clicking 'Disconnect Google Business' in
the admin panel."
[Show disconnect button]
```

#### B. Screenshots to Prepare

Take screenshots of:
1. Your app's homepage
2. Admin login screen
3. Automated Marketing tab
4. Google OAuth consent screen
5. Successfully connected Google Business Profile
6. A building posted to Google Business Profile
7. The disconnect/revoke access button

---

### STEP 4: Submit for Verification

1. **Return to OAuth Consent Screen**
   - Go back to: https://console.cloud.google.com/ → **APIs & Services** → **OAuth consent screen**

2. **Click "PUBLISH APP"**
   - You'll see a warning that your app uses restricted scopes
   - Click **PREPARE FOR VERIFICATION**

3. **Fill Out Verification Form**

   Google will ask for:

   **Basic Information:**
   - App name: `Portable Buildings Dealer Portal`
   - Support email: `info@dunritemetalbuildings.com`
   - Developer/Company name: `DunRite Metal Buildings`
   - Website: `https://portablebuildings.vercel.app`

   **Scope Justification:**

   **For `business.manage` scope, explain:**
   ```
   Our application provides automated marketing for portable building dealers.

   WHY WE NEED THIS SCOPE:
   When dealers sync their inventory from their supplier portal (GPB Sales), new
   portable buildings need to be automatically posted to their Google Business
   Profile to increase visibility and customer engagement.

   The business.manage scope is required to:
   1. Create posts on the dealer's Google Business Profile
   2. Include building photos, descriptions, and pricing in posts
   3. Automate posting based on the dealer's schedule preferences

   HOW IT'S USED:
   - Dealer connects their Google Business Profile via OAuth
   - When new inventory is detected during sync, it's queued for posting
   - Posts are created automatically using the Google Business Profile API
   - Dealers can disconnect at any time from the admin panel

   This eliminates manual posting and ensures dealers' newest inventory is
   promptly visible to customers searching for portable buildings on Google.
   ```

   **Video URL:**
   - Paste your YouTube video URL (can be unlisted)

   **Screenshots:**
   - Upload all screenshots you prepared

   **Privacy Policy URL:**
   - `https://portablebuildings.vercel.app/privacy.html`

   **Terms of Service URL:**
   - `https://portablebuildings.vercel.app/terms.html`

4. **Submit Application**
   - Review all information
   - Click **SUBMIT FOR VERIFICATION**

---

### STEP 5: Wait for Google's Response

**Timeline:**
- Initial review: 3-7 business days
- May ask clarifying questions
- May request additional screenshots or information
- Approval typically takes 1-2 weeks total

**During Review:**
- Check email daily for Google Cloud correspondence
- Respond promptly to any questions
- App remains in testing mode during review

---

### STEP 6: Once Approved

When Google approves your app:

1. **Publishing Status Changes**
   - OAuth consent screen will show "Published" status
   - Green checkmark appears
   - Any Google account can now connect

2. **Remove Test User Restrictions**
   - Your app will work for ALL Google Business Profile owners
   - No need to add individual users anymore

3. **Users Can Connect**
   - Dealers can click "Connect with Google"
   - Standard OAuth flow works for everyone
   - No more "access_denied" errors

---

### STEP 7: If Rejected

If Google rejects your verification:

1. **Read Rejection Reason Carefully**
   - Google will explain what's missing or incorrect

2. **Common Rejection Reasons:**
   - Video doesn't clearly show scope usage
   - Privacy policy doesn't mention Google data
   - Insufficient explanation of why scope is needed
   - Screenshots don't match described functionality

3. **Fix Issues and Resubmit**
   - Address all concerns mentioned
   - Update video/screenshots if needed
   - Resubmit through same process

4. **Appeal if Needed**
   - Can appeal rejection if you believe it was in error
   - Provide additional clarification

---

## Quick Reference Checklist

Before submitting, verify:

- ✅ Privacy policy is live at https://portablebuildings.vercel.app/privacy.html
- ✅ Terms of service is live at https://portablebuildings.vercel.app/terms.html
- ✅ OAuth consent screen fully filled out
- ✅ Scope `business.manage` added
- ✅ Test user added: info@dunritemetalbuildings.com
- ✅ Video recorded showing complete OAuth flow
- ✅ Video uploaded to YouTube (can be unlisted)
- ✅ Screenshots taken of all key screens
- ✅ Scope justification written explaining WHY you need the scope
- ✅ All URLs in verification form point to live pages

---

## Support

If you have questions during verification:
- Google Cloud Support: https://cloud.google.com/support
- OAuth Verification Help: https://support.google.com/cloud/answer/9110914

---

## Current Status

- [✓] Privacy Policy created
- [✓] Terms of Service created
- [✓] Pages deployed to production
- [ ] OAuth Consent Screen configured
- [ ] Verification video recorded
- [ ] Verification submitted
- [ ] Verification approved

**Next Step:** Configure OAuth Consent Screen in Google Cloud Console (Step 2 above)
