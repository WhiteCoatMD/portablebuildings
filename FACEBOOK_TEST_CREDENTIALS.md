# Facebook App Review - Test Credentials

This document contains test credentials for Facebook reviewers to test the ShedSync application.

## Test Account Access

**Login URL:** https://shed-sync.com/login.html

### Test Credentials
```
Email:    test@facebook.com
Password: TestApp
```

## Account Details

- **Business Name:** Test Portable Buildings
- **Account Status:** Active (90-day trial)
- **Subdomain:** facebook-test.shed-sync.com
- **Public Site:** https://facebook-test.shed-sync.com

## Test Data

The account includes 3 sample portable buildings in the inventory:
1. 10x12 Utility Barn - $3,500
2. 12x24 Lofted Barn - $6,800
3. 12x32 Cabin - $12,500

## How to Test Facebook Integration

### Step-by-Step Testing Instructions:

1. **Login to ShedSync**
   - Go to https://shed-sync.com/login.html
   - Enter credentials: `test@facebook.com` / `TestApp`
   - Click "Login"

2. **Navigate to Facebook Settings**
   - Once logged in, you'll be in the Admin Panel
   - Click the **"Site Customization"** tab at the top
   - Scroll down to the **"Facebook Auto-Posting"** section

3. **Connect Your Facebook Page**
   - Click the blue **"Connect with Facebook"** button
   - You'll be redirected to Facebook for authorization
   - Grant the requested permissions:
     - `pages_show_list` - To see your pages
     - `pages_read_engagement` - To read page info
     - `pages_manage_posts` - To post on your behalf
   - Select the Facebook Page you want to connect
   - Click "Continue" or "Authorize"

4. **Verify Connection**
   - You'll be redirected back to ShedSync
   - You should see a green success message showing your connected page
   - The "Connect with Facebook" button will now show your page name

5. **Test Auto-Posting**
   - Enable the toggle: **"Enable Auto-Posting to Facebook"**
   - Scroll down to **"Test Facebook Posting"** section
   - Click **"Send Test Post to Facebook"**
   - Check your Facebook Page to verify the test post appeared

## What ShedSync Does With Facebook Access

### Permissions Used:

1. **pages_show_list**
   - Used to: Display a list of Facebook Pages the user manages
   - When: During the "Connect with Facebook" flow to let users select their page

2. **pages_read_engagement**
   - Used to: Read basic page information (page name, page ID)
   - When: During connection setup to verify the page

3. **pages_manage_posts**
   - Used to: Post building listings to the user's Facebook Page
   - When: Automatically when new inventory is added (if enabled), or manually via test post

### Data Flow:

1. User clicks "Connect with Facebook"
2. User authorizes ShedSync to access their Facebook Page
3. ShedSync receives a long-lived Page Access Token (60 days)
4. Token is stored encrypted in our database
5. When auto-posting is enabled, ShedSync posts building details to the user's page
6. Users can disconnect at any time (token is immediately deleted)

## Features to Test

### 1. Facebook Connection
- [x] Connect Facebook page via OAuth
- [x] Display connected page name
- [x] Disconnect Facebook page

### 2. Auto-Posting Settings
- [x] Enable/disable auto-posting
- [x] Configure post conditions (new only, with images, available only)
- [x] Customize post template with placeholders

### 3. Manual Test Post
- [x] Send test post to Facebook
- [x] Verify post appears on Facebook Page
- [x] Check post formatting and images

## Data Deletion

Users can delete their data at any time:
- **In-App:** Settings tab → Delete Account
- **Email:** privacy@shed-sync.com
- **Facebook:** Remove app from Facebook Settings → Apps and Websites

More info: https://shed-sync.com/data-deletion.html

## Support & Documentation

- **Privacy Policy:** https://shed-sync.com/privacy-policy.html
- **Terms of Service:** https://shed-sync.com/terms-of-service.html
- **Data Deletion:** https://shed-sync.com/data-deletion.html

## Contact

If you have questions during the review process:
- **Email:** support@shed-sync.com
- **Privacy:** privacy@shed-sync.com

---

## Security Notes

- All passwords are hashed with bcrypt
- Facebook tokens are stored encrypted
- HTTPS/SSL enforced on all pages
- OAuth 2.0 standard implementation
- No sensitive data exposed in URLs

## Expected User Flow

1. Dealer signs up for ShedSync
2. Dealer manages their portable building inventory
3. Dealer clicks "Connect with Facebook" to link their business page
4. ShedSync posts building listings to Facebook automatically
5. Customers see posts on Facebook and visit dealer's website
6. Dealer makes sales and manages everything from ShedSync

---

**Note for Reviewers:** This is a B2B SaaS platform for portable building dealers. The Facebook integration helps dealers market their inventory to potential customers on social media.
