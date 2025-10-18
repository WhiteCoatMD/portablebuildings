# ShedSync - Portable Buildings SaaS Platform

**Multi-tenant inventory management and website builder for portable building dealers**

Live at: https://shed-sync.com

---

## 🛠️ Technology Stack

### Frontend
- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **UI/UX:** Custom dark theme with gradient backgrounds, responsive design
- **Icons & Assets:** Custom SVG graphics, optimized image handling
- **Client-Side Features:** JWT-based authentication, real-time form validation

### Backend
- **Runtime:** Node.js 22.x
- **Architecture:** Serverless functions (Vercel Edge Functions)
- **API Framework:** RESTful API with route-based file structure
- **Authentication:** JWT tokens with bcrypt password hashing
- **Session Management:** HTTP-only cookies for security

### Database
- **Primary Database:** PostgreSQL 14 (DigitalOcean Managed Database)
- **Connection Pooling:** pg-pool for efficient connection management
- **Schema Management:** SQL migration scripts
- **Data Security:** Encrypted credentials, prepared statements (SQL injection protection)

### Third-Party Integrations
- **Payment Processing:**
  - PayPal Subscriptions API (Primary - $99/month recurring)
  - Stripe Payments API (Legacy, can be reactivated)
- **Social Media:**
  - Facebook Graph API v18.0 (OAuth 2.0, auto-posting to Business Pages)
  - Google Business Profile API (OAuth 2.0, auto-posting with business.manage scope)
- **Web Scraping:**
  - Playwright (headless browser automation for GPB portal sync)
- **File Storage:**
  - Vercel Blob Storage (building photos, dealer logos)

### DevOps & Hosting
- **Hosting Platform:** Vercel (serverless infrastructure)
- **Database Hosting:** DigitalOcean Managed PostgreSQL
- **DNS & CDN:** Vercel DNS with multi-tenant subdomain routing
- **SSL/TLS:** Automatic HTTPS via Vercel
- **Environment Management:** Vercel environment variables (encrypted secrets)
- **Version Control:** Git + GitHub
- **CI/CD:** Automatic deployments via Vercel GitHub integration

### Security & Compliance
- **Authentication:** JWT with RS256 signing, bcrypt password hashing (10 rounds)
- **API Security:** Rate limiting, CORS policies, input validation
- **Data Protection:** HTTPS everywhere, encrypted database connections
- **Compliance:** GDPR-compliant data deletion, CCPA privacy disclosures
- **OAuth Security:** State parameters, PKCE flow for Facebook/Google

### Monitoring & Performance
- **Error Tracking:** Vercel function logs
- **Performance:** Edge function optimization, database query indexing
- **Uptime:** Vercel's built-in monitoring
- **Analytics:** Custom event tracking (page views, conversions)

### APIs & Services Used
- **Facebook Graph API** - Pages management, OAuth, posting
- **Google Business Profile API** - Account management, location info, posting
- **PayPal REST API** - Subscription creation, webhook handling
- **Stripe API** - Legacy payment processing
- **Great Portable Buildings API** - Inventory sync (custom integration)
- **Vercel Blob API** - Image storage and CDN delivery

### Development Tools
- **Code Editor:** VS Code
- **API Testing:** Postman, cURL
- **Database Management:** pgAdmin, psql CLI
- **Version Control:** Git with GitHub
- **Local Development:** Vercel CLI (`vercel dev`)

---

## 🚀 What is ShedSync?

ShedSync is a B2B SaaS platform that helps portable building dealers:
- ✅ Manage their building inventory
- ✅ Create beautiful dealer websites automatically
- ✅ Sync inventory from Great Portable Buildings (GPB) dealer portal
- ✅ Auto-post new buildings to Facebook
- ✅ Use custom domains for their dealer sites
- ✅ Decode serial numbers to extract building details
- ✅ Upload and manage building photos

---

## 📋 Project Status (Ready for Launch!)

### ✅ Completed Features

#### Core Platform
- [x] User authentication (JWT-based, bcrypt password hashing)
- [x] PostgreSQL database (deployed on DigitalOcean)
- [x] Multi-user inventory management
- [x] Admin panel with tabs (Manage Buildings, Site Customization, Settings, Domain)
- [x] Responsive dark theme UI with yellow accents

#### Inventory Management
- [x] Add/edit/delete buildings manually
- [x] Serial number decoder (GPB format)
- [x] Auto-sync from GPB dealer portal (with credentials)
- [x] Bulk import/export (CSV)
- [x] Image upload and management
- [x] Multiple lot locations
- [x] Auto-status (available/sold/repo)
- [x] RTO pricing calculations

#### Dealer Websites
- [x] Auto-generated public dealer sites
- [x] Subdomain routing (e.g., patriot-buildings.shed-sync.com)
- [x] Custom domain support (e.g., www.buytheshed.com)
- [x] Customizable colors, logos, business info
- [x] Building gallery with filters
- [x] Contact forms
- [x] Mobile-responsive design

#### Facebook Integration
- [x] OAuth 2.0 "Connect with Facebook" button
- [x] Auto-posting to Facebook business pages
- [x] Long-lived access tokens (60-day)
- [x] Customizable post templates
- [x] Manual test posting

#### Payments & Subscriptions
- [x] PayPal integration ($99/month) - CURRENTLY ACTIVE
- [x] Stripe integration (legacy, can be reactivated)
- [x] Free trial support (90 days)
- [x] Subscription management
- [x] Sandbox mode for testing (PayPal sandbox)

#### Legal & Compliance
- [x] Privacy Policy (GDPR/CCPA compliant)
- [x] Terms of Service
- [x] Data Deletion instructions
- [x] Facebook App Review materials
- [x] Test account for Facebook reviewers

#### Deployment
- [x] Deployed on Vercel
- [x] PostgreSQL on DigitalOcean
- [x] Environment variables configured
- [x] Custom domain DNS setup

---

## 📁 Project Structure

```
portable_buildings/
├── index.html                          # Landing page
├── signup.html                         # User registration
├── login.html                          # User login
├── admin.html                          # Admin panel
├── dealer-site.html                    # Public dealer site template
├── privacy-policy.html                 # Privacy policy
├── terms-of-service.html              # Terms of service
├── data-deletion.html                 # Data deletion instructions
│
├── api/
│   ├── auth/
│   │   ├── signup.js                  # User registration
│   │   ├── login.js                   # User authentication
│   │   ├── facebook-oauth-start.js    # Facebook OAuth initiation
│   │   └── facebook-callback.js       # Facebook OAuth callback
│   ├── inventory/
│   │   ├── list.js                    # Get user's inventory
│   │   ├── add.js                     # Add building
│   │   ├── update.js                  # Update building
│   │   ├── delete.js                  # Delete building
│   │   ├── upload-photo.js           # Upload building photo
│   │   └── sync-gpb.js               # Sync from GPB portal
│   ├── site/
│   │   ├── get-by-subdomain.js       # Get dealer site by subdomain
│   │   ├── get-by-domain.js          # Get dealer site by custom domain
│   │   └── list-dealers.js           # List all dealer sites
│   ├── user/
│   │   ├── settings.js               # Get/update user settings
│   │   ├── save-custom-domain.js     # Save custom domain
│   │   ├── remove-custom-domain.js   # Remove custom domain
│   │   └── delete-account.js         # Delete user account
│   ├── subscription/
│   │   ├── create-checkout-session.js # Stripe checkout
│   │   └── webhook.js                # Stripe webhooks
│   └── facebook/
│       ├── post.js                   # Post to Facebook
│       └── test-post.js              # Test Facebook posting
│
├── lib/
│   ├── auth.js                        # JWT authentication utilities
│   ├── db.js                         # Database connection pool
│   └── decoder.js                    # Serial number decoder
│
├── migrations/
│   ├── create-tables.sql             # Database schema
│   └── add-domain-fields.sql         # Custom domain fields
│
├── gpb-scraper.js                    # GPB portal automation
├── sync.js                           # Inventory sync orchestrator
├── decoder.js                        # Standalone decoder
├── create-facebook-test-account.js   # Facebook test account setup
├── verify-patriot-domain.js          # Domain verification script
│
├── .env                              # Environment variables (DO NOT COMMIT)
├── .gitignore                        # Git ignore rules
├── package.json                      # Dependencies
├── vercel.json                       # Vercel configuration
└── README.md                         # This file
```

---

## ⚙️ Environment Variables

Required in Vercel (or `.env` for local):

```env
# Database
DATABASE_URL=postgres://user:pass@host:port/database
POSTGRES_URL=postgres://user:pass@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# PayPal (CURRENTLY ACTIVE)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or "production"

# Stripe (Legacy - can be reactivated if needed)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Facebook (Optional - for Facebook integration)
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=https://shed-sync.com/api/auth/facebook-callback

# GPB Portal Sync (Optional - for inventory sync)
GPB_PORTAL_URL=https://dealer-portal-url.com
GPB_USERNAME=dealer-username
GPB_PASSWORD=dealer-password
```

---

## 🚀 Getting Started

### Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   ```bash
   copy .env.example .env
   # Edit .env with your credentials
   ```

3. **Run Database Migrations:**
   ```bash
   node run-migration.js
   ```

4. **Start Development Server:**
   ```bash
   vercel dev --listen 3000
   ```

5. **Open in Browser:**
   ```
   http://localhost:3000
   ```

### Production Deployment

Already deployed on Vercel! The platform is live at:
- Main site: https://shed-sync.com
- API: https://shed-sync.com/api/*
- Dealer sites: https://*.shed-sync.com

---

## 🎯 Pre-Launch Checklist

### Before Going Live:

- [ ] **Test Facebook OAuth** - Verify "Connect with Facebook" works
- [ ] **Test Stripe Payments** - Create test subscription
- [ ] **Test Custom Domains** - Verify DNS routing works
- [ ] **Test GPB Sync** - Sync inventory from dealer portal
- [ ] **Load Test** - Test with multiple concurrent users
- [ ] **Security Audit** - Review authentication, SQL injection protection
- [ ] **Backup Strategy** - Set up automated database backups
- [ ] **Monitoring** - Set up error tracking (Sentry, LogRocket, etc.)
- [ ] **SSL/HTTPS** - Verify all pages use HTTPS
- [ ] **SEO** - Add meta tags, sitemap, robots.txt
- [ ] **Email Setup** - Configure transactional emails (SendGrid, Mailgun)
- [ ] **Support System** - Set up support email (support@shed-sync.com)
- [ ] **Analytics** - Add Google Analytics or similar
- [ ] **Terms & Privacy** - Review legal pages with lawyer (if needed)
- [ ] **Facebook App Review** - Submit for Advanced Access
- [ ] **Documentation** - Create user guide for dealers
- [ ] **Pricing Page** - Add pricing info to landing page
- [ ] **Demo Video** - Create walkthrough video for dealers
- [ ] **Beta Testing** - Get 2-3 dealers to test before launch

---

## 📝 Custom Domain Setup (for Dealers)

### DNS Configuration

Dealers need to add **3 DNS records** at their registrar:

#### For Root Domain (patriot-buildings.us):
```
Type: A
Name: @
Value: 76.76.21.123
TTL: 600 seconds

Type: A
Name: @
Value: 76.76.21.93
TTL: 600 seconds
```

#### For WWW Subdomain:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600 seconds
```

**Note:** If the registrar has locked A records (like GoDaddy domain forwarding), just use the CNAME for www and update the database to use `www.domain.com`.

### Verification

After DNS is configured (5-60 minutes), run:
```bash
node verify-[dealer]-domain.js
```

This marks the domain as verified in the database.

---

## 🔐 Facebook App Review

### Required Materials (Already Created):

1. ✅ Privacy Policy: https://shed-sync.com/privacy-policy.html
2. ✅ Terms of Service: https://shed-sync.com/terms-of-service.html
3. ✅ Data Deletion: https://shed-sync.com/data-deletion.html
4. ✅ Test Account: test@facebook.com / TestApp
5. ✅ Testing Instructions: FACEBOOK_TEST_CREDENTIALS.md

### Permissions Requested:

- `pages_show_list` - See user's Facebook Pages
- `pages_read_engagement` - Read page information
- `pages_manage_posts` - Post to user's Facebook Page

### Submission Process:

1. Go to Facebook App Dashboard → App Review
2. Request Advanced Access for the 3 permissions above
3. Provide test credentials and instructions
4. Submit for review (usually 1-3 days)

---

## 🧪 Testing

### Test Accounts:

**Facebook Test Account:**
- Email: test@facebook.com
- Password: TestApp
- Business: Test Portable Buildings
- Subdomain: facebook-test.shed-sync.com

**Patriot Buildings:**
- Email: sales@patriotbuildingsales.com
- Subdomain: patriot-buildings.shed-sync.com
- Custom Domain: www.patriot-buildings.us

**Buy The Shed:**
- Email: sales@buytheshed.com
- Subdomain: buytheshed.shed-sync.com
- Custom Domain: www.buytheshed.com (verified, working)

### Test Scenarios:

1. **User Signup:** Create account → Stripe checkout → Login
2. **Add Inventory:** Add building manually → Upload photo → View on site
3. **GPB Sync:** Enter GPB credentials → Sync inventory → Verify buildings appear
4. **Facebook OAuth:** Connect Facebook → Auto-post → Check Facebook page
5. **Custom Domain:** Add custom domain → Configure DNS → Verify
6. **Serial Decoder:** Enter GPB serial → Verify details extracted
7. **Site Customization:** Change colors → Update logo → Save → View site
8. **Delete Account:** Delete account → Verify all data removed

---

## 🐛 Known Issues / TODO

### High Priority:
- [ ] Add email notifications (welcome email, sync failures, etc.)
- [ ] Add "Forgot Password" functionality
- [ ] Add image resizing/optimization (currently stores full-size)
- [ ] Add rate limiting to API endpoints
- [ ] Add CAPTCHA to signup form (prevent spam)

### Medium Priority:
- [ ] Add inventory import from CSV
- [ ] Add analytics dashboard (page views, building views)
- [ ] Add dealer referral program
- [ ] Add multi-language support
- [ ] Add building comparison feature

### Low Priority:
- [ ] Add dark mode toggle for dealer sites
- [ ] Add dealer blog/news section
- [ ] Add customer reviews/testimonials
- [ ] Add financing calculator
- [ ] Add inventory alerts (low stock, etc.)

---

## 📞 Support & Contact

**For Developers:**
- Documentation: This README
- Environment: `.env` file (see Environment Variables section)
- Database Schema: `migrations/create-tables.sql`

**For Dealers:**
- Login: https://shed-sync.com/login.html
- Support Email: support@shed-sync.com
- Privacy: privacy@shed-sync.com

**For Facebook Review:**
- Test Account: test@facebook.com / TestApp
- Instructions: FACEBOOK_TEST_CREDENTIALS.md
- Data Deletion: https://shed-sync.com/data-deletion.html

---

## 🎉 Launch Plan

### Day Before Launch:
1. Final security audit
2. Database backup
3. Test all critical flows
4. Prepare marketing materials
5. Set up monitoring/alerts

### Launch Day:
1. Announce on social media
2. Email existing beta testers
3. Monitor error logs closely
4. Be ready for support requests
5. Track signups and conversions

### Week After Launch:
1. Gather user feedback
2. Fix any bugs reported
3. Monitor performance metrics
4. Reach out to early users for testimonials
5. Iterate based on feedback

---

## 📜 License

Proprietary - All rights reserved

---

## 💳 PayPal Subscription Setup

### Current Configuration (Sandbox Mode)

**PayPal Sandbox Credentials:**
- Client ID: `AQrxr0jj7_pJyW_Lf__auoXgWU6YWeAedR6NYfgtk51RX1wHFwiVxKm4dqMB-MBpLZK2VvkJmLNdG6h7`
- Client Secret: `EJceCcwDab3kB5APsMk7EEqKDHkVDinOwxO5mX07cr9y5iDHZlKLHF_PETPVQRxmITv5nb4bZi4fYfD1`

**Active Subscription Plan (Sandbox):**
- Plan ID: `P-50X33105GE839004KNDX6SVA`
- Product ID: `PROD-75Y424379E085324V`
- Price: $99/month (recurring)
- Environment: PayPal Sandbox (test mode)

### Files Updated:
- `admin.js` (lines 3130, 3162, 3204) - Updated plan ID
- `create-paypal-sandbox-plan.js` - Script to create sandbox plans

### Creating a New Plan

If you need to create a new sandbox or production plan:

```bash
# For sandbox (testing):
node create-paypal-sandbox-plan.js

# The script will output a new Plan ID
# Update admin.js with the new Plan ID in 3 places:
# - Line 3130: Container ID
# - Line 3162: plan_id in createSubscription
# - Line 3204: render() target
```

### Switching to Production

When ready to go live with real payments:

1. Get production PayPal credentials from https://www.paypal.com
2. Create a production plan (modify script to use production API)
3. Update `admin.js` line 3140:
   ```javascript
   // Change from sandbox to production URL
   script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_PRODUCTION_CLIENT_ID&vault=true&intent=subscription';
   ```
4. Update plan ID in admin.js (3 locations)
5. Test with a real PayPal account

### Testing Sandbox Subscriptions

To test the PayPal flow in sandbox mode:
1. Go to https://developer.paypal.com/dashboard/accounts
2. Create a sandbox buyer account (personal account)
3. Use those credentials when testing checkout
4. Sandbox payments are fake - no real money is charged

### Troubleshooting

**Error: "RESOURCE_NOT_FOUND"**
- Means the plan ID doesn't exist in that environment
- Solution: Run `create-paypal-sandbox-plan.js` to create a new plan

**Error: "SSL certificate error"**
- Local Windows certificate issue
- Solution: Script already includes `NODE_TLS_REJECT_UNAUTHORIZED = '0'` for development

**PayPal button not loading**
- Check browser console for errors
- Verify plan ID matches in all 3 locations in admin.js
- Hard refresh browser (Ctrl+Shift+R)

---

**Built with ❤️ for portable building dealers**

Last Updated: January 2025
Version: 1.0 (Pre-Launch)
