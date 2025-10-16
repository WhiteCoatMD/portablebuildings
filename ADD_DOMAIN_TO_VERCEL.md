# How to Add Custom Domains to Vercel (Multi-Tenant Setup)

## The Problem

When a dealer saves a custom domain (like `allsteelselfstorage.com`), it gets saved to the database and marked as verified. However, **Vercel doesn't know about this domain yet**, so requests to that domain return a 404 error.

For multi-tenant SaaS platforms, each customer's domain needs to be added to Vercel's configuration.

---

## Option 1: Manual Process (Quick Fix)

### Via Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project: **portablebuildings**
3. Click **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `allsteelselfstorage.com`
6. Vercel will verify DNS is pointing correctly
7. SSL certificate will be automatically provisioned
8. Domain will be live in ~1 minute

**Repeat for www subdomain:**
- Add `www.allsteelselfstorage.com` as well

---

## Option 2: Automated via Vercel API (Recommended for Production)

### How It Should Work:

When a user clicks "Save Custom Domain" in the admin panel, the system should:
1. Save domain to database ✅ (already doing this)
2. **Call Vercel API to add domain** ❌ (not implemented yet)
3. Vercel provisions SSL certificate automatically
4. Domain becomes live

### Implementation:

Create a new API endpoint that adds domains to Vercel when saved:

**File:** `api/user/save-custom-domain.js` (modify existing)

Add this after saving to database:

```javascript
// After saving domain to database, add it to Vercel
const vercelToken = process.env.VERCEL_TOKEN;
const vercelProjectId = process.env.VERCEL_PROJECT_ID;

if (vercelToken && vercelProjectId) {
    try {
        // Add root domain
        await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${vercelToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: customDomain
            })
        });

        // Add www subdomain
        await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${vercelToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: `www.${customDomain}`
            })
        });

        console.log(`Added ${customDomain} to Vercel`);
    } catch (error) {
        console.error('Error adding domain to Vercel:', error);
        // Don't fail the request - domain is still saved in DB
    }
}
```

### Environment Variables Needed:

Add to Vercel dashboard → Settings → Environment Variables:

```env
VERCEL_TOKEN=your_vercel_api_token_here
VERCEL_PROJECT_ID=your_project_id_here
```

**To get VERCEL_TOKEN:**
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "Domain Management"
4. Copy the token

**To get VERCEL_PROJECT_ID:**
1. Go to your project settings
2. Look in the URL: `vercel.com/username/PROJECT_NAME/settings`
3. Or run: `vercel project ls` and find the ID

---

## Option 3: CLI Script (For Admin Use)

For now, create a script to manually add domains:

**File:** `add-domain-to-vercel.js`

```javascript
/**
 * Add Custom Domain to Vercel Project
 * Usage: node add-domain-to-vercel.js domain.com
 */

const https = require('https');

const domain = process.argv[2];
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'your_token_here';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'your_project_id';

if (!domain) {
    console.error('Usage: node add-domain-to-vercel.js domain.com');
    process.exit(1);
}

async function addDomain(domainName) {
    const data = JSON.stringify({ name: domainName });

    const options = {
        hostname: 'api.vercel.com',
        port: 443,
        path: `/v9/projects/${PROJECT_ID}/domains`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log(`✅ Added ${domainName} to Vercel`);
                    resolve(JSON.parse(body));
                } else {
                    console.error(`❌ Failed to add ${domainName}:`, body);
                    reject(new Error(body));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log(`Adding ${domain} to Vercel project...`);

    try {
        // Add root domain
        await addDomain(domain);

        // Add www subdomain
        await addDomain(`www.${domain}`);

        console.log('\n✅ Domain added successfully!');
        console.log('SSL certificate will be provisioned automatically.');
        console.log('Domain should be live in ~1 minute.');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

run();
```

**Usage:**
```bash
# Set environment variables
export VERCEL_TOKEN=your_token_here
export VERCEL_PROJECT_ID=your_project_id

# Add domain
node add-domain-to-vercel.js allsteelselfstorage.com
```

---

## Quick Fix for allsteelselfstorage.com RIGHT NOW:

### Via Vercel Dashboard (Fastest):
1. Go to https://vercel.com/dashboard
2. Go to your project
3. Settings → Domains
4. Add `allsteelselfstorage.com`
5. Add `www.allsteelselfstorage.com`
6. Wait 1 minute for SSL
7. Site will be live!

### Or via CLI:
```bash
vercel domains add allsteelselfstorage.com --yes
vercel domains add www.allsteelselfstorage.com --yes
```

---

## Long-Term Solution

Update `api/user/save-custom-domain.js` to automatically add domains to Vercel when dealers save them. This way the process is fully automated:

1. User enters domain
2. Saves to database ✅
3. **Automatically adds to Vercel** (new)
4. DNS instructions shown
5. User configures DNS
6. Domain auto-verifies ✅
7. Site goes live!

No manual intervention needed.

---

## Why This Happens

Vercel doesn't automatically accept traffic for any random domain. For security and SSL purposes, domains must be explicitly added to the project. This is standard for all hosting platforms (Vercel, Netlify, CloudFlare Pages, etc.).

The database verification we built is still important - it ensures DNS is configured correctly. But we also need to tell Vercel "yes, this domain should route to our app."

---

## Summary

**For allsteelselfstorage.com right now:**
- Go to Vercel dashboard
- Add domain manually
- Will be live in 1 minute

**For future domains:**
- Implement Vercel API integration in save-custom-domain.js
- Fully automated for all future dealers
- No manual work required
