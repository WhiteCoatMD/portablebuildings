# Stripe Webhook Setup Guide

**IMPORTANT:** You must configure this webhook for subscription status to update automatically after users pay!

---

## Why You Need This

Without the webhook configured:
- ❌ Users pay but subscription stays "trial"
- ❌ No automatic subscription updates
- ❌ Manual database updates required

With webhook configured:
- ✅ Subscription status updates automatically after payment
- ✅ Users get instant access after subscribing
- ✅ Failed payments handled automatically

---

## Setup Steps

### 1. Find Your Vercel Deployment URL

Your Vercel project URL should be something like:
- `https://your-project-name.vercel.app`
- Or your custom domain if configured

### 2. Go to Stripe Dashboard

1. Log in to https://dashboard.stripe.com
2. Make sure you're in **TEST MODE** first (toggle in top right)
3. Click **Developers** → **Webhooks** in the left sidebar

### 3. Add Webhook Endpoint

Click **"Add endpoint"** button and configure:

**Endpoint URL:**
```
https://your-vercel-url.vercel.app/api/subscription/webhook
```

**Events to send:** Select these specific events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

**API version:** Use latest (currently v2024-10-28)

### 4. Get the Signing Secret

After creating the endpoint:
1. Click on the endpoint you just created
2. Click **"Reveal signing secret"**
3. Copy the secret (starts with `whsec_`)

### 5. Add to Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_your_secret_here` (paste the secret from step 4)
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**

### 6. Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the ⋯ menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

---

## Testing the Webhook

### Test in Stripe Dashboard (TEST MODE)

1. Create a test signup:
   - Go to your signup page
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

2. Complete the test payment

3. Check Stripe Dashboard:
   - Go to **Developers** → **Webhooks**
   - Click on your webhook endpoint
   - Check **"Logs"** tab
   - You should see successful events (status 200)

4. Check your database:
   ```sql
   SELECT email, subscription_status, subscription_id, stripe_customer_id
   FROM users
   WHERE email = 'your-test-email@example.com';
   ```
   - `subscription_status` should be `'active'`
   - `subscription_id` should be populated
   - `stripe_customer_id` should be populated

### Test Failed Payment

1. In Stripe Dashboard (test mode):
   - Go to **Customers**
   - Find your test customer
   - Go to **Subscriptions**
   - Click the subscription
   - Click **"…"** menu → **"Update subscription"**
   - Click **"Cancel subscription"**

2. Check webhook logs - should see `customer.subscription.deleted` event

3. Check database - `subscription_status` should update to `'canceled'`

---

## Moving to Production (LIVE MODE)

Once testing is complete:

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle to **LIVE MODE** (top right)
2. Repeat webhook setup steps above for live mode
3. Use your production Vercel URL

### 2. Update Environment Variables

In Vercel, update these to LIVE keys:

```
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_PRICE_ID=price_your_live_price_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
```

**IMPORTANT:** Create a new LIVE product/price in Stripe first!
- Go to **Products** (in Live mode)
- Create product: "Shed Sync Dealer Program"
- Set price: $99/month recurring
- Copy the price ID (starts with `price_`)

### 3. Redeploy with Live Keys

After updating environment variables, redeploy your Vercel project.

---

## Troubleshooting

### Webhook Returns 401 Unauthorized

**Cause:** Webhook secret is incorrect or not set

**Solution:**
1. Double-check you copied the correct secret from Stripe
2. Make sure `STRIPE_WEBHOOK_SECRET` is set in Vercel
3. Redeploy after adding the variable

### Webhook Returns 500 Error

**Cause:** Database connection or code error

**Solution:**
1. Check Vercel function logs
2. Make sure `DATABASE_URL` is set correctly
3. Check webhook endpoint code in `api/subscription/webhook.js`

### Subscription Status Not Updating

**Cause:** Webhook not receiving events

**Solution:**
1. Check webhook is enabled in Stripe Dashboard
2. Verify the endpoint URL is correct
3. Check webhook logs in Stripe Dashboard
4. Make sure selected events include `checkout.session.completed`

### How to View Logs

**Vercel:**
1. Go to your project dashboard
2. Click **Logs** tab
3. Filter by `/api/subscription/webhook`

**Stripe:**
1. Go to **Developers** → **Webhooks**
2. Click your endpoint
3. View **Logs** tab

---

## Webhook Endpoint Code

The webhook handler is at: `api/subscription/webhook.js`

It handles these events:
- `checkout.session.completed` - Activates subscription after checkout
- `customer.subscription.created/updated` - Syncs subscription changes
- `customer.subscription.deleted` - Marks subscription as canceled
- `invoice.payment_succeeded` - Confirms successful payment
- `invoice.payment_failed` - Handles failed payments

---

## Security Notes

- ✅ Webhook signature is verified (if `STRIPE_WEBHOOK_SECRET` is set)
- ✅ Only Stripe can trigger this endpoint
- ✅ Replay attacks are prevented by signature verification
- ⚠️ Never commit webhook secrets to git (they're in .env.local which is gitignored)

---

## Quick Reference

### Test Mode

**Webhook URL:** `https://your-domain.vercel.app/api/subscription/webhook`

**Test Card:** 4242 4242 4242 4242

**Test Webhook Secret:** `whsec_...` (from Stripe Dashboard → Developers → Webhooks)

### Live Mode

**Webhook URL:** Same as test (Stripe knows the mode from the API key)

**Live Webhook Secret:** Different from test (get from Live mode webhook config)

---

## Status After Setup

Once configured correctly:

✅ Users signup → get 72-hour trial
✅ Users click "Upgrade Now" → redirect to Stripe
✅ Users complete payment → webhook fires → subscription activated
✅ Admin panel shows "Active" subscription
✅ Public site stays online
✅ Failed payments automatically update status

---

## Need Help?

If webhook still not working:
1. Check all logs (Vercel + Stripe)
2. Verify environment variables are set
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   stripe trigger checkout.session.completed
   ```

Contact support: billing@shed-sync.com
