# How Domain Verification Works - Complete Guide

## The Problem We Solved

When you save a custom domain like `allsteelselfstorage.com`, the site won't work until `domain_verified = true` in the database. This is because `api/site/get-by-domain.js` (line 63) requires:

```javascript
WHERE custom_domain = $1 AND domain_verified = true
```

Without this flag set to true, the domain returns a 404 error.

---

## The Automatic Solution (How It Works Now)

### Step-by-Step Process:

#### 1. User Saves Domain
**File:** `api/user/save-custom-domain.js`

When user enters domain and clicks "Save Custom Domain":
- Saves `custom_domain = 'allsteelselfstorage.com'`
- Sets `domain_verified = false` initially
- Returns success to browser

```javascript
await pool.query(
    `UPDATE users SET custom_domain = $1, domain_verified = false WHERE id = $2`,
    [customDomain.toLowerCase(), userId]
);
```

#### 2. Admin Panel Shows Status
**File:** `admin.js` (lines 2677-2713)

When page loads, if user has a custom domain:
- Shows status box with domain name
- Shows badge: "⏳ Pending Verification" (orange)
- Shows DNS instructions
- **Automatically checks domain status after 2 seconds**

```javascript
if (!user.domain_verified) {
    // Show DNS instructions
    document.getElementById('dns-instructions').style.display = 'block';

    // Auto-check in background
    setTimeout(() => {
        checkDomainVerification();
    }, 2000);
}
```

#### 3. Automatic DNS Check
**File:** `api/user/check-domain-status.js` (lines 77-114)

The system automatically checks:

```javascript
// Check A record for root domain
const aRecords = await dns.resolve4('allsteelselfstorage.com');
if (aRecords.includes('76.76.21.93')) {
    dnsDetails.aRecord = true;
}

// Check CNAME record for www subdomain
const cnameRecords = await dns.resolveCname('www.allsteelselfstorage.com');
if (cnameRecords.includes('cname.vercel-dns.com')) {
    dnsDetails.cnameRecord = true;
}

// If EITHER record is correct, auto-verify!
if (aRecords.includes('76.76.21.93') || cnameRecords.includes('cname.vercel-dns.com')) {
    await pool.query(
        'UPDATE users SET domain_verified = true WHERE id = $1',
        [userId]
    );

    return { verified: true, autoVerified: true };
}
```

#### 4. Badge Updates to Green
**File:** `admin.js` (lines 2842-2859)

When verification succeeds:
- Badge changes to "✓ Verified" (green)
- DNS instructions hide
- Toast notification: "Domain verified successfully!"
- User object updated: `domain_verified = true`

#### 5. Site Goes Live Immediately
**File:** `api/site/get-by-domain.js` (lines 58-92)

Now when someone visits `allsteelselfstorage.com`:
- Vercel receives request
- Calls get-by-domain.js
- Queries database for custom_domain match
- **Finds domain with domain_verified = true** ✅
- Returns site configuration
- Renders dealer's site

---

## What Made allsteelselfstorage.com Work

You ran this command:
```bash
node verify-domain-manual.js cma3bratton@gmail.com allsteelselfstorage.com
```

This script did one simple thing:
```javascript
await pool.query(
    'UPDATE users SET domain_verified = true WHERE email = $1',
    [email]
);
```

That's it! Just set the flag to true, and the site started working immediately.

---

## Future Domains Will Work Automatically

### For New Domains After This Update:

**Timeline:**
1. **T+0 seconds:** User saves domain → Shows "Pending"
2. **T+2 seconds:** Auto-check runs in background
3. **If DNS already configured:** Badge turns green instantly, site is live!
4. **If DNS not configured:** Badge stays orange, shows helpful message

**User can also:**
- Click "🔄 Check Status" button anytime for instant check
- Refresh the page (auto-check runs again)
- Wait - auto-check runs every time they load the admin panel

### Example User Experience:

**Scenario 1: DNS Already Configured**
```
1. User configures DNS at registrar first
2. User enters domain in admin panel
3. Clicks "Save Custom Domain"
4. 2 seconds later: "✓ Domain verified successfully!"
5. Site is live immediately
```

**Scenario 2: DNS Not Configured Yet**
```
1. User enters domain in admin panel
2. Clicks "Save Custom Domain"
3. Sees DNS instructions
4. Configures DNS at registrar
5. Clicks "🔄 Check Status" (or just waits/refreshes)
6. "✓ Domain verified successfully!"
7. Site is live
```

---

## Why This Works (Technical Details)

### Vercel's Multi-Tenant Domain Routing

Vercel automatically handles custom domains when:
1. DNS points to Vercel's IP (76.76.21.93) or CNAME
2. Your app knows how to route the domain (via get-by-domain.js)

**You don't need to add domains to Vercel manually!**

When a request comes in:
```
User visits allsteelselfstorage.com
    ↓
DNS resolves to 76.76.21.93 (Vercel's IP)
    ↓
Vercel receives request with Host: allsteelselfstorage.com
    ↓
Vercel routes to your app (portablebuildings)
    ↓
index.html loads with domain router script
    ↓
Script detects it's not main platform domain
    ↓
Redirects to site.html
    ↓
site.html calls /api/site/get-by-domain
    ↓
API checks database for custom_domain + domain_verified = true
    ↓
Returns site configuration
    ↓
Renders dealer's site
```

### The Critical Database Check

**File:** `api/site/get-by-domain.js` (line 63-64)

```javascript
let result = await pool.query(
    'SELECT * FROM users WHERE custom_domain = $1 AND domain_verified = true',
    [domain]
);
```

This is the gatekeeper! If `domain_verified = false`, the query returns empty and site shows 404.

---

## Manual Override (For Admin Use)

If you ever need to manually verify a domain:

```bash
node verify-domain-manual.js user@example.com theirdomain.com
```

This is useful for:
- Testing
- Troubleshooting
- Bypassing auto-check if DNS is weird
- Emergency fixes

---

## DNS Requirements

For a domain to auto-verify, it needs **EITHER**:

### Option A: A Record (Root Domain)
```
Type: A
Name: @
Value: 76.76.21.93
```

### Option B: CNAME Record (WWW Subdomain)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Best Practice: Both
For maximum compatibility, users should configure both:
- A record for `domain.com`
- CNAME for `www.domain.com`

Then both URLs work!

---

## Troubleshooting

### Domain Not Verifying?

**Check DNS:**
```bash
nslookup allsteelselfstorage.com
nslookup www.allsteelselfstorage.com
```

**Check Database:**
```bash
node verify-domain-manual.js user@example.com domain.com
```

**Check API Response:**
- Open browser console
- Go to Domain & Website tab
- Click "Check Status"
- Look at Network tab for API response

### Common Issues:

1. **DNS not propagated yet**
   - Solution: Wait 5-60 minutes, click "Check Status" again

2. **Wrong IP address**
   - Solution: Update A record to 76.76.21.93

3. **Wrong CNAME target**
   - Solution: Update CNAME to cname.vercel-dns.com

4. **Domain already used by another user**
   - Solution: Check database for duplicate custom_domain entries

---

## Files Involved

### Database
- **users.custom_domain** - The domain name
- **users.domain_verified** - Boolean flag (true/false)

### API Endpoints
1. **api/user/save-custom-domain.js** - Saves domain, sets verified = false
2. **api/user/check-domain-status.js** - Checks DNS, auto-verifies if correct
3. **api/user/remove-custom-domain.js** - Removes domain
4. **api/site/get-by-domain.js** - Routes custom domains (requires verified = true)

### Frontend
1. **admin.html** (lines 865-964) - Domain management UI
2. **admin.js** (lines 2677-2926) - Domain verification logic
3. **site.html** - Dealer site (loaded when custom domain accessed)
4. **index.html** - Has domain router that redirects to site.html

### Admin Tools
1. **verify-domain-manual.js** - Manually verify any domain
2. **check-user-by-id.js** - Check user's domain status

---

## Summary

**What you did manually:**
```bash
node verify-domain-manual.js cma3bratton@gmail.com allsteelselfstorage.com
# This set domain_verified = true
```

**What happens automatically now:**
1. User saves domain → domain_verified = false
2. Page loads → Auto-checks DNS after 2 seconds
3. If DNS correct → domain_verified = true automatically
4. Badge turns green → Site is live!

**No manual intervention needed for future domains!** 🎉

The system is fully automatic - users just need to:
1. Save their domain
2. Configure DNS
3. Wait/refresh (or click "Check Status")
4. Domain verifies automatically
5. Site goes live

---

## Testing It

To test with a new domain:

1. Have user save domain in admin panel
2. They configure DNS at their registrar
3. Wait 2 seconds (auto-check) or click "Check Status"
4. Watch badge turn green
5. Visit domain in browser
6. Should load their dealer site immediately!

No manual steps from you needed! ✅
