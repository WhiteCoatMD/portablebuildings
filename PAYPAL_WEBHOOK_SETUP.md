# PayPal Webhook Setup Guide

This guide explains how to configure PayPal webhooks to automatically handle subscription events.

---

## Why You Need This

Without webhooks configured:
- ❌ Cancelled subscriptions won't update in your database
- ❌ Payment failures won't be detected automatically
- ❌ Subscription renewals won't extend user access

With webhooks configured:
- ✅ Automatic subscription status updates
- ✅ Payment failures handled automatically
- ✅ Cancelled subscriptions immediately reflected
- ✅ User access controlled based on payment status

---

## Setup Steps

### 1. Get Your Webhook URL

Your webhook endpoint URL is:
```
https://shed-sync.com/api/subscription/paypal-webhook
```

### 2. Go to PayPal Developer Dashboard

**For Testing (Sandbox):**
1. Log in to https://developer.paypal.com/
2. Go to **Dashboard** → **Apps & Credentials**
3. Select **Sandbox** tab
4. Scroll down to **Webhooks** section

**For Production (Live):**
1. Switch to **Live** tab in the same section

### 3. Create Webhook

1. Click **"Add Webhook"** button
2. **Webhook URL:** Enter your webhook URL:
   ```
   https://shed-sync.com/api/subscription/paypal-webhook
   ```

3. **Event types:** Select these events:
   - ✅ `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
   - ✅ `BILLING.SUBSCRIPTION.CANCELLED` - User cancelled subscription
   - ✅ `BILLING.SUBSCRIPTION.SUSPENDED` - Payment failed/subscription suspended
   - ✅ `BILLING.SUBSCRIPTION.EXPIRED` - Subscription expired
   - ✅ `PAYMENT.SALE.COMPLETED` - Successful payment received
   - ✅ `PAYMENT.SALE.REFUNDED` - Payment refunded

4. Click **Save**

### 4. Get Your Webhook ID (Optional - For Security)

After creating the webhook:
1. Click on the webhook you just created
2. Copy the **Webhook ID** (starts with something like `WH-...`)
3. Add it to your Vercel environment variables:
   ```bash
   vercel env add PAYPAL_WEBHOOK_ID production
   ```
   Then paste the webhook ID when prompted

### 5. Test the Webhook

#### Test in Sandbox:

1. **Create a test subscription:**
   - Login to your admin panel in test mode
   - Click "Upgrade to Premium"
   - Complete PayPal checkout with sandbox account

2. **Verify webhook received event:**
   - Go to PayPal Developer Dashboard → Webhooks
   - Click on your webhook
   - View **Recent Deliveries** tab
   - You should see `BILLING.SUBSCRIPTION.ACTIVATED` with status 200

3. **Test cancellation:**
   - Login to sandbox.paypal.com with test account
   - Go to Settings → Payments → Manage automatic payments
   - Cancel the subscription
   - Check webhook deliveries - should see `BILLING.SUBSCRIPTION.CANCELLED`

4. **Check database:**
   ```bash
   node check-user-subscription.js your-test-email@example.com
   ```
   - Subscription status should update to `cancelled`

---

## Webhook Event Handling

### Event Types and Actions:

| PayPal Event | Status Update | Description |
|-------------|---------------|-------------|
| `BILLING.SUBSCRIPTION.ACTIVATED` | `active` | Subscription successfully activated |
| `BILLING.SUBSCRIPTION.CANCELLED` | `cancelled` | User cancelled their subscription |
| `BILLING.SUBSCRIPTION.SUSPENDED` | `past_due` | Payment failed, subscription suspended |
| `BILLING.SUBSCRIPTION.EXPIRED` | `expired` | Subscription term ended |
| `PAYMENT.SALE.COMPLETED` | `active` | Payment successful, extends period by 30 days |
| `PAYMENT.SALE.REFUNDED` | (logged) | Payment refunded (custom action needed) |

### Database Updates:

The webhook automatically updates these fields in the `users` table:
- `subscription_status` - Current status
- `subscription_current_period_end` - Next billing date
- `paypal_subscription_id` - PayPal subscription ID

---

## Testing Webhook Events

### Manual Webhook Testing:

You can use PayPal's webhook simulator to test events:

1. Go to PayPal Developer Dashboard → Webhooks
2. Click on your webhook
3. Click **"Webhook Simulator"** tab
4. Select an event type (e.g., `BILLING.SUBSCRIPTION.CANCELLED`)
5. Click **"Send Test"**
6. Check your application logs to verify it was processed

### Check Webhook Logs:

**In Vercel:**
```bash
vercel logs production
```

Filter for `[PayPal Webhook]` to see webhook events.

**In PayPal Dashboard:**
1. Go to your webhook settings
2. Click **"Recent Deliveries"** tab
3. View status codes and responses

---

## Troubleshooting

### Webhook Returns 500 Error

**Cause:** Database connection or code error

**Solution:**
1. Check Vercel function logs
2. Verify `DATABASE_URL` is set correctly
3. Check webhook endpoint code in `api/subscription/paypal-webhook.js`

### Webhook Not Receiving Events

**Cause:** Webhook not configured or wrong URL

**Solution:**
1. Verify webhook URL is exactly: `https://shed-sync.com/api/subscription/paypal-webhook`
2. Check webhook is enabled in PayPal dashboard
3. Ensure selected events include subscription events

### Subscription Status Not Updating

**Cause:** No user found with PayPal subscription ID

**Solution:**
1. Verify `paypal_subscription_id` is saved when user subscribes
2. Check database column exists: `paypal_subscription_id`
3. Check webhook logs for user lookup errors

### How to View Logs

**Vercel Logs:**
```bash
vercel logs production --follow
```

**PayPal Webhook Logs:**
1. PayPal Dashboard → Webhooks
2. Click your webhook
3. View **Recent Deliveries** tab

---

## Security Notes

- ✅ Webhook signature verification can be enabled (set `PAYPAL_WEBHOOK_ID`)
- ⚠️ Currently accepts all webhooks (no signature verification)
- ⚠️ For production, implement full PayPal signature verification
- ✅ Only PayPal servers should be able to reach this endpoint
- ⚠️ Never commit webhook IDs to git (use environment variables)

---

## Moving to Production (Live Mode)

Once testing is complete:

### 1. Create Live Webhook

1. In PayPal Dashboard, switch to **Live** mode
2. Go to **Apps & Credentials** → **Webhooks**
3. Add new webhook with production URL
4. Select same event types as sandbox

### 2. Update Environment Variables

If using webhook ID verification:
```bash
# Add live webhook ID
vercel env add PAYPAL_WEBHOOK_ID production
```

### 3. Test Live Webhook

1. Make a real subscription purchase (or refund it immediately)
2. Check PayPal webhook deliveries
3. Verify database updates correctly

---

## Webhook Endpoint Code

The webhook handler is at: `api/subscription/paypal-webhook.js`

It handles these events:
- `BILLING.SUBSCRIPTION.ACTIVATED` - Activates user subscription
- `BILLING.SUBSCRIPTION.CANCELLED` - Marks subscription as cancelled
- `BILLING.SUBSCRIPTION.SUSPENDED` - Marks as past_due (payment failed)
- `BILLING.SUBSCRIPTION.EXPIRED` - Marks subscription as expired
- `PAYMENT.SALE.COMPLETED` - Confirms payment and extends period
- `PAYMENT.SALE.REFUNDED` - Logs refund event

---

## Quick Reference

### Webhook URL
```
https://shed-sync.com/api/subscription/paypal-webhook
```

### Required Events
```
BILLING.SUBSCRIPTION.ACTIVATED
BILLING.SUBSCRIPTION.CANCELLED
BILLING.SUBSCRIPTION.SUSPENDED
BILLING.SUBSCRIPTION.EXPIRED
PAYMENT.SALE.COMPLETED
PAYMENT.SALE.REFUNDED
```

### Test Sandbox Account
Use PayPal sandbox test accounts for testing subscriptions without real charges.

---

## Status After Setup

Once configured correctly:

✅ Users subscribe → PayPal processes payment → webhook fires → subscription activated
✅ Users cancel → webhook fires → subscription marked cancelled → site access removed
✅ Payment fails → webhook fires → subscription suspended → user notified
✅ Admin panel shows correct subscription status
✅ Automatic subscription management

---

## Need Help?

If webhooks still not working:
1. Check all logs (Vercel + PayPal)
2. Verify environment variables are set
3. Test with PayPal webhook simulator
4. Check database has `paypal_subscription_id` column

Contact support: billing@shed-sync.com
