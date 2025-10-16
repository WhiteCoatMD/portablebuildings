# Domain Setup Process - Complete Guide

## How Custom Domains Work (FULLY AUTOMATIC)

When a dealer saves a custom domain in the admin panel, **two things happen automatically**:

1. **Domain is saved in database** with `domain_verified = false` ✅ (automatic)
2. **Domain is added to Vercel via API** so it can serve traffic ✅ (automatic)

---

## What Fixed rankracoon.com

The site was showing "DEPLOYMENT_NOT_FOUND" because the domain wasn't registered with Vercel.

**The solution:**
```bash
vercel domains add rankracoon.com
vercel domains add www.rankracoon.com
```

This adds the domain to Vercel's project configuration, allowing it to serve traffic.

---

## Process for Future Domains (AUTOMATIC)

When a dealer adds a new custom domain through the admin panel:

### ✨ **IT HAPPENS AUTOMATICALLY!**

The system automatically:
1. Saves domain to database
2. Calls Vercel API to add both root domain AND www subdomain
3. Sets up SSL certificates
4. Shows DNS instructions to dealer

**You don't need to do anything!**

### Fallback Options (if automatic fails)

If for some reason the automatic addition doesn't work:

**Option 1: Run the Sync Script**
```bash
node add-pending-domains.js
```

**Option 2: Manual CLI**
```bash
vercel domains add example.com
vercel domains add www.example.com
```

**Option 3: Vercel Dashboard**
Add manually via https://vercel.com/mitch-brattons-projects/portablebuildings/settings/domains

---

## Why Both Root and WWW?

Dealers need BOTH versions:
- `example.com` (root domain)
- `www.example.com` (www subdomain)

This ensures the site works whether visitors type www or not.

---

## DNS Requirements

Dealers must configure **3 DNS records**:

### Record 1: A Record
```
Type: A
Name: @
Value: 76.76.21.93
TTL: 1 Hour
```

### Record 2: A Record (Second IP)
```
Type: A
Name: @
Value: 76.76.21.123
TTL: 1 Hour
```

### Record 3: CNAME Record
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 1 Hour
```

**Why 2 A records?**
Vercel uses multiple IPs for load balancing and reliability. Both IPs are required for the domain to work properly.

---

## Verification Flow

1. **Dealer saves domain** → Stored with `domain_verified = false`
2. **Admin runs script** → Domain added to Vercel
3. **Dealer configures DNS** → Points to Vercel IPs
4. **Auto-verification runs** → System checks DNS after 2 seconds
5. **Domain verified** → `domain_verified = true`, badge turns green
6. **Site goes live!**

---

## Troubleshooting

### Domain shows "DEPLOYMENT_NOT_FOUND"
- **Problem:** Domain not added to Vercel
- **Solution:** Run `node add-pending-domains.js` or add manually via CLI

### Domain shows 404 after adding to Vercel
- **Problem:** `domain_verified = false` in database
- **Solution:** Run `node verify-domain-manual.js email@example.com domain.com`

### Site works but shows wrong content
- **Problem:** Domain pointing to wrong site
- **Solution:** Check `custom_domain` field in database matches exactly

---

## Scripts Reference

### add-pending-domains.js
Adds all custom domains from database to Vercel.
```bash
node add-pending-domains.js
```

### verify-domain-manual.js
Manually verifies a domain (sets `domain_verified = true`).
```bash
node verify-domain-manual.js email@example.com domain.com
```

### check-user-by-id.js
Checks user's domain status.
```bash
node check-user-by-id.js 12
```

---

## Summary

**For each new custom domain - FULLY AUTOMATIC:**

1. Dealer saves domain in admin panel
2. **System automatically adds to Vercel** (both root and www)
3. Dealer configures DNS at their registrar
4. System auto-verifies when DNS propagates
5. Site goes live

**You don't do anything!** It's completely automatic.

The `add-pending-domains.js` script is only needed as a fallback if the API fails.

---

## Automation Ideas (Future)

- Set up cron job to run `add-pending-domains.js` every hour
- Create webhook that triggers on domain save
- Add to deployment pipeline
- Email notification when new domain needs attention

For now, running the script manually after dealers add domains is the simplest and most reliable approach.
