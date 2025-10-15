/**
 * PayPal Webhook Handler
 * Processes subscription events from PayPal
 *
 * Important webhook events:
 * - BILLING.SUBSCRIPTION.ACTIVATED
 * - BILLING.SUBSCRIPTION.CANCELLED
 * - BILLING.SUBSCRIPTION.SUSPENDED
 * - BILLING.SUBSCRIPTION.EXPIRED
 * - PAYMENT.SALE.COMPLETED
 * - PAYMENT.SALE.REFUNDED
 */

const { getPool } = require('../../lib/db');
const crypto = require('crypto');

const pool = getPool();

// PayPal webhook credentials (set in environment variables)
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID?.trim();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const event = req.body;

        console.log('[PayPal Webhook] Received event:', event.event_type);
        console.log('[PayPal Webhook] Resource:', event.resource);

        // Verify webhook signature (optional but recommended)
        if (PAYPAL_WEBHOOK_ID) {
            const verified = await verifyPayPalWebhook(req);
            if (!verified) {
                console.warn('[PayPal Webhook] Signature verification failed');
                return res.status(401).json({
                    success: false,
                    error: 'Webhook signature verification failed'
                });
            }
        }

        // Handle different event types
        switch (event.event_type) {
            // Subscription lifecycle events
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
            case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
                await handleSubscriptionActivated(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.SUSPENDED':
            case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
                await handleSubscriptionSuspended(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.EXPIRED':
                await handleSubscriptionExpired(event.resource);
                break;

            // Payment events
            case 'PAYMENT.SALE.COMPLETED':
            case 'PAYMENT.CAPTURE.COMPLETED':
                await handlePaymentCompleted(event.resource);
                break;

            case 'PAYMENT.SALE.REFUNDED':
            case 'PAYMENT.CAPTURE.REFUNDED':
                await handlePaymentRefunded(event.resource);
                break;

            case 'PAYMENT.SALE.DENIED':
            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED':
                await handlePaymentFailed(event.resource);
                break;

            default:
                console.log(`[PayPal Webhook] Unhandled event type: ${event.event_type}`);
        }

        return res.status(200).json({ success: true, received: true });

    } catch (error) {
        console.error('[PayPal Webhook] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Webhook processing failed',
            details: error.message
        });
    }
}

// Handle subscription activation
async function handleSubscriptionActivated(subscription) {
    try {
        console.log('[PayPal Webhook] Subscription activated:', subscription.id);

        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 subscription_id = $1,
                 paypal_subscription_id = $1,
                 subscription_plan = 'monthly',
                 trial_ends_at = NULL,
                 subscription_current_period_end = NOW() + INTERVAL '30 days'
             WHERE paypal_subscription_id = $1
             RETURNING id, email`,
            [subscription.id]
        );

        if (result.rowCount > 0) {
            console.log('[PayPal Webhook] User subscription activated:', result.rows[0]);
        } else {
            console.warn('[PayPal Webhook] No user found with subscription ID:', subscription.id);
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling subscription activated:', error);
    }
}

// Handle subscription cancellation
async function handleSubscriptionCancelled(subscription) {
    try {
        console.log('[PayPal Webhook] Subscription cancelled:', subscription.id);

        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'cancelled'
             WHERE paypal_subscription_id = $1
             RETURNING id, email`,
            [subscription.id]
        );

        if (result.rowCount > 0) {
            console.log('[PayPal Webhook] User subscription cancelled:', result.rows[0]);
        } else {
            console.warn('[PayPal Webhook] No user found with subscription ID:', subscription.id);
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling subscription cancelled:', error);
    }
}

// Handle subscription suspension (payment failure)
async function handleSubscriptionSuspended(subscription) {
    try {
        console.log('[PayPal Webhook] Subscription suspended:', subscription.id);

        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'past_due'
             WHERE paypal_subscription_id = $1
             RETURNING id, email`,
            [subscription.id]
        );

        if (result.rowCount > 0) {
            console.log('[PayPal Webhook] User subscription suspended:', result.rows[0]);
        } else {
            console.warn('[PayPal Webhook] No user found with subscription ID:', subscription.id);
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling subscription suspended:', error);
    }
}

// Handle subscription expiration
async function handleSubscriptionExpired(subscription) {
    try {
        console.log('[PayPal Webhook] Subscription expired:', subscription.id);

        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'expired'
             WHERE paypal_subscription_id = $1
             RETURNING id, email`,
            [subscription.id]
        );

        if (result.rowCount > 0) {
            console.log('[PayPal Webhook] User subscription expired:', result.rows[0]);
        } else {
            console.warn('[PayPal Webhook] No user found with subscription ID:', subscription.id);
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling subscription expired:', error);
    }
}

// Handle successful payment
async function handlePaymentCompleted(payment) {
    try {
        console.log('[PayPal Webhook] Payment completed:', payment.id);

        // Extract subscription ID from billing agreement
        const subscriptionId = payment.billing_agreement_id;

        if (subscriptionId) {
            // Extend subscription period by 30 days
            const result = await pool.query(
                `UPDATE users
                 SET subscription_status = 'active',
                     subscription_current_period_end = NOW() + INTERVAL '30 days'
                 WHERE paypal_subscription_id = $1
                 RETURNING id, email`,
                [subscriptionId]
            );

            if (result.rowCount > 0) {
                console.log('[PayPal Webhook] Payment processed for user:', result.rows[0]);
            }
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling payment completed:', error);
    }
}

// Handle payment refund
async function handlePaymentRefunded(payment) {
    try {
        console.log('[PayPal Webhook] Payment refunded:', payment.id);

        const subscriptionId = payment.billing_agreement_id;

        if (subscriptionId) {
            // Optionally mark subscription as refunded or take other action
            console.log('[PayPal Webhook] Refund processed for subscription:', subscriptionId);
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling payment refunded:', error);
    }
}

// Handle payment failure
async function handlePaymentFailed(payment) {
    try {
        console.log('[PayPal Webhook] Payment failed:', payment.id);

        const subscriptionId = payment.billing_agreement_id;

        if (subscriptionId) {
            const result = await pool.query(
                `UPDATE users
                 SET subscription_status = 'past_due'
                 WHERE paypal_subscription_id = $1
                 RETURNING id, email`,
                [subscriptionId]
            );

            if (result.rowCount > 0) {
                console.log('[PayPal Webhook] User marked as past_due due to payment failure:', result.rows[0]);
            }
        }

    } catch (error) {
        console.error('[PayPal Webhook] Error handling payment failed:', error);
    }
}

// Verify PayPal webhook signature (optional but recommended for security)
async function verifyPayPalWebhook(req) {
    try {
        // PayPal webhook verification requires:
        // - transmission_id (header)
        // - transmission_time (header)
        // - transmission_sig (header)
        // - cert_url (header)
        // - auth_algo (header)
        // - webhook_id (from PayPal dashboard)
        // - webhook event body

        // For simplicity, we're skipping signature verification here
        // In production, you should implement full signature verification
        // using PayPal's SDK or manual verification

        return true; // Accept all webhooks for now

    } catch (error) {
        console.error('[PayPal Webhook] Verification error:', error);
        return false;
    }
}

module.exports = handler;
