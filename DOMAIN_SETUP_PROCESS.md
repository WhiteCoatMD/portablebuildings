# Domain Setup Process - Complete Guide

## How Custom Domains Work

When a dealer saves a custom domain in the admin panel, **two things need to happen**:

1. **Domain is saved in database** with `domain_verified = false` ✅ (automatic)
2. **Domain is added to Vercel** so it can serve traffic ⚠️ (requires manual step)

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

## Process for Future Domains

When a dealer adds a new custom domain:

### Option 1: Run the Automatic Script (Recommended)

```bash
node add-pending-domains.js
```

This script:
- Checks database for all custom domains
- Adds each domain to Vercel using `vercel domains add`
- Adds both root (example.com) and www (www.example.com) versions
- Shows success/error status for each

**Run this after dealers save new domains.**

### Option 2: Manual Addition via CLI

```bash
vercel domains add example.com
vercel domains add www.example.com
```

### Option 3: Vercel Dashboard

1. Go to https://vercel.com/mitch-brattons-projects/portablebuildings/settings/domains
2. Click "Add Domain"
3. Enter `example.com` → Click Add
4. Enter `www.example.com` → Click Add

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

**For each new custom domain:**

1. Dealer saves domain in admin panel
2. **YOU run:** `node add-pending-domains.js`
3. Dealer configures DNS at their registrar
4. System auto-verifies when DNS propagates
5. Site goes live

**That's it!** The script handles adding both root and www versions to Vercel automatically.

---

## Automation Ideas (Future)

- Set up cron job to run `add-pending-domains.js` every hour
- Create webhook that triggers on domain save
- Add to deployment pipeline
- Email notification when new domain needs attention

For now, running the script manually after dealers add domains is the simplest and most reliable approach.
