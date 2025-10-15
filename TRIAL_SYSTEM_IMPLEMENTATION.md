# Trial System Implementation - In Progress

**Date:** October 15, 2025
**Status:** Core backend complete, frontend/restrictions in progress

---

## What's Been Implemented ✅

### 1. 72-Hour Free Trial on Signup
- **File:** `lib/auth.js` (lines 71-83)
- New users automatically get `subscription_status = 'trial'` and `trial_ends_at = NOW() + 72 hours`
- No payment required upfront

### 2. Signup Flow Updated
- **File:** `signup.html` (lines 347-359)
- Removed Stripe checkout redirection after account creation
- Shows message: "Account created! You have a 72-hour free trial"
- Redirects directly to login page

### 3. Trial-to-Paid Upgrade Endpoint
- **File:** `api/subscription/create-checkout-session.js`
- Modified to work for both:
  - Trial users upgrading to paid (authenticated)
  - New signups (backward compatibility - though not used now)
- Cancel URL now points to admin.html instead of payment-cancelled.html

### 4. Billing Portal for Payment Method Updates
- **File:** `api/subscription/create-billing-portal-session.js` (NEW)
- Creates Stripe Billing Portal session
- Allows users to:
  - Update payment method
  - View invoices
  - Manage subscription
- Protected by `requireAuth` middleware

### 5. Subscription Info API Enhanced
- **File:** `api/subscription/get-info.js` (lines 39-71)
- Now returns:
  - `trialEndsAt`: timestamp of when trial expires
  - `isTrialExpired`: boolean if trial has passed
  - `hoursRemaining`: hours left in trial (or 0 if expired)
  - Existing subscription data (status, billing date, amount, etc.)

---

## What Still Needs to Be Done 🚧

### 1. Update Admin Panel JavaScript ⚠️ IN PROGRESS
**File to modify:** `admin.js`

Need to find the function that loads subscription info and update it to:

```javascript
// Around line 1400-1500 in admin.js, find loadSubscriptionInfo() or similar

async function loadSubscriptionInfo() {
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/subscription/get-info', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
        const sub = data.subscription;

        // Check if user is on trial
        if (sub.status === 'trial') {
            if (sub.isTrialExpired) {
                // TRIAL EXPIRED - Show upgrade now message
                document.getElementById('subscription-plan').textContent = 'Trial Expired';
                document.getElementById('subscription-amount').innerHTML = `
                    <span style="color: #f44336; font-weight: bold;">Trial Ended</span>
                `;
                document.getElementById('subscription-status').innerHTML = `
                    <span style="color: #f44336;">⚠️ Expired - Upgrade Required</span>
                `;
                document.getElementById('subscription-next-billing').textContent = '—';

                // Show upgrade button
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'btn btn-primary btn-lg';
                upgradeBtn.textContent = '💳 Upgrade to Premium ($99/month)';
                upgradeBtn.onclick = upgradeToP​remium;
                document.getElementById('subscription-info').appendChild(upgradeBtn);

            } else {
                // TRIAL ACTIVE - Show countdown
                document.getElementById('subscription-plan').textContent = 'Free Trial';
                document.getElementById('subscription-amount').innerHTML = `
                    <span style="color: #4caf50; font-weight: bold;">$0 (Trial)</span>
                `;
                document.getElementById('subscription-status').innerHTML = `
                    <span style="color: #ff9800;">🕐 ${sub.hoursRemaining} hours remaining</span>
                `;
                document.getElementById('subscription-next-billing').textContent =
                    new Date(sub.trialEndsAt).toLocaleString();

                // Show "Upgrade Now" button
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'btn btn-warning';
                upgradeBtn.textContent = '⬆️ Upgrade to Premium Now';
                upgradeBtn.onclick = upgradeToP​remium;
                upgradeBtn.style.marginTop = '1rem';
                document.getElementById('subscription-info').appendChild(upgradeBtn);
            }
        } else {
            // PAID SUBSCRIPTION - Show normal info
            document.getElementById('subscription-plan').textContent = 'Monthly Subscription';
            document.getElementById('subscription-amount').textContent =
                `$${sub.amount || '99'}/${sub.interval || 'month'}`;
            document.getElementById('subscription-status').innerHTML =
                `<span style="color: #4caf50;">● Active</span>`;
            document.getElementById('subscription-next-billing').textContent =
                sub.nextBillingDate || '—';
        }

        // Payment method info
        if (data.paymentMethod) {
            const pm = data.paymentMethod;
            document.getElementById('card-info').textContent =
                `${pm.brand} ending in ${pm.last4}`;
            document.getElementById('card-expires').textContent =
                `Expires ${pm.expMonth}/${pm.expYear}`;
        }

        // Billing history
        // ... existing code for billing history ...
    }
}

// Add upgrade function
async function upgradeToP​remium() {
    const token = localStorage.getItem('auth_token');
    try {
        const response = await fetch('/api/subscription/create-checkout-session', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // userId and email come from token
        });

        const data = await response.json();
        if (data.success && data.url) {
            window.location.href = data.url; // Redirect to Stripe
        } else {
            alert('Failed to create checkout session: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        alert('Failed to start upgrade process');
    }
}

// Update payment method via Billing Portal
async function updatePaymentMethod() {
    const token = localStorage.getItem('auth_token');
    try {
        const response = await fetch('/api/subscription/create-billing-portal-session', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success && data.url) {
            window.location.href = data.url; // Redirect to Stripe Billing Portal
        } else {
            // User doesn't have payment method yet - send to upgrade flow
            if (confirm('No payment method on file. Upgrade to premium now?')) {
                upgradeToP​remium();
            }
        }
    } catch (error) {
        console.error('Billing portal error:', error);
        alert('Failed to open billing portal');
    }
}
```

**Also need to update:** The `updatePaymentMethod()` function call in admin.html (line 1013)

### 2. Add Site Access Restriction for Expired Trials
**Files to modify:**
- `api/site/get-by-domain.js` (lines 94-100)
- `site-loader.js` (client-side check)

**Server-side check (api/site/get-by-domain.js):**
```javascript
// After finding the user (line 92), add trial check:
if (!user) {
    return res.status(404).json({
        success: false,
        error: 'Site not found',
        domain: domain
    });
}

// CHECK TRIAL STATUS
if (user.subscription_status === 'trial' && user.trial_ends_at) {
    const trialExpired = new Date(user.trial_ends_at) < new Date();
    if (trialExpired) {
        return res.status(403).json({
            success: false,
            error: 'Trial expired',
            message: 'This dealer\'s trial period has ended. Site access is suspended until subscription is activated.',
            trialExpired: true
        });
    }
}

// Continue with normal flow...
```

**Client-side check (site-loader.js):**
```javascript
// After fetch response, check for trial expired
const response = await fetch(`/api/site/get-by-domain?domain=${hostname}`);
const data = await response.json();

if (!data.success) {
    if (data.trialExpired) {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; font-family: sans-serif;">
                <h1 style="color: #f44336; font-size: 2.5rem;">⚠️ Site Temporarily Unavailable</h1>
                <p style="font-size: 1.25rem; color: #666; margin-top: 1rem;">
                    This dealer's trial period has ended.
                </p>
                <p style="font-size: 1rem; color: #999; margin-top: 2rem;">
                    If you're the site owner, please log in to upgrade your subscription.
                </p>
                <a href="/login.html" style="display: inline-block; margin-top: 2rem; padding: 1rem 2rem; background: #2196f3; color: white; text-decoration: none; border-radius: 8px;">
                    Login to Upgrade
                </a>
            </div>
        `;
        return;
    }
    // ... other error handling ...
}
```

### 3. Add Facebook Publishing Restriction for Trial Accounts
**Files to modify:**
- Any Facebook posting endpoint (likely in `api/facebook/` directory)
- Check user's subscription_status before allowing posts

**Example:**
```javascript
// In Facebook posting endpoint
const userResult = await pool.query(
    'SELECT subscription_status FROM users WHERE id = $1',
    [userId]
);

if (userResult.rows[0].subscription_status === 'trial') {
    return res.status(403).json({
        success: false,
        error: 'Facebook posting not available on trial plan',
        message: 'Upgrade to premium to unlock Facebook auto-posting'
    });
}
```

**Also update admin.js Facebook section:**
```javascript
// Show trial restriction message if on trial
if (subscriptionStatus === 'trial') {
    document.getElementById('facebook-trial-warning').style.display = 'block';
    document.getElementById('enableAutoPost').disabled = true;
}
```

### 4. Configure Stripe Webhook
**Steps:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-vercel-domain.vercel.app/api/subscription/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret (starts with `whsec_`)
6. Add to Vercel environment variables: `STRIPE_WEBHOOK_SECRET=whsec_...`
7. Redeploy

**Webhook endpoint already exists:** `api/subscription/webhook.js`

---

## Testing Checklist 📋

### Trial Flow
- [ ] Create new account
- [ ] Verify trial_ends_at is set to 72 hours from now
- [ ] Login and verify admin panel shows trial status
- [ ] Verify trial countdown displays correctly
- [ ] Verify "Upgrade Now" button appears

### Upgrade Flow
- [ ] Click "Upgrade Now" button
- [ ] Complete Stripe checkout
- [ ] Verify webhook updates subscription_status to 'active'
- [ ] Verify admin panel now shows "Active" subscription
- [ ] Verify trial_ends_at is cleared

### Expired Trial
- [ ] Manually set trial_ends_at to past date in database
- [ ] Visit dealer's public site - should show "Site Unavailable" message
- [ ] Login to admin panel - should show "Trial Expired" with urgent upgrade button
- [ ] Cannot access Facebook posting features

### Payment Method Updates
- [ ] Active subscriber clicks "Update Payment Method"
- [ ] Redirects to Stripe Billing Portal
- [ ] Can update card
- [ ] Redirects back to admin panel

### Facebook Posting
- [ ] Trial user cannot enable Facebook auto-posting
- [ ] Shows upgrade message
- [ ] Paid user can enable Facebook auto-posting

---

## Database Schema Requirements

Make sure these columns exist in `users` table:
```sql
- subscription_status VARCHAR (values: 'trial', 'active', 'past_due', 'canceled')
- trial_ends_at TIMESTAMP
- subscription_id VARCHAR (Stripe subscription ID)
- stripe_customer_id VARCHAR (Stripe customer ID)
- subscription_current_period_end TIMESTAMP
```

Check with:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('subscription_status', 'trial_ends_at', 'subscription_id', 'stripe_customer_id', 'subscription_current_period_end');
```

---

## Environment Variables Needed

### Vercel
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook configured)
```

### DigitalOcean (no changes needed)
Already configured correctly.

---

## Summary

**Core functionality is complete:**
✅ Signup gives 72-hour trial
✅ Trial-to-paid upgrade endpoint ready
✅ Billing portal for payment updates ready
✅ Subscription API returns trial info

**Frontend work needed:**
⚠️ Admin panel JavaScript (trial countdown, upgrade button)
⚠️ Site access restriction for expired trials
⚠️ Facebook posting restriction for trial users
⚠️ Stripe webhook configuration

**Estimated time to complete:** 30-45 minutes
