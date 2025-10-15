/**
 * Stripe Subscription Webhook Handler
 * Processes subscription events from Stripe
 */
const { getPool } = require('../../lib/db');
const stripe = require('stripe');

const pool = getPool();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const sig = req.headers['stripe-signature'];
        let event;

        if (STRIPE_WEBHOOK_SECRET) {
            // Verify webhook signature
            const stripeClient = stripe(STRIPE_SECRET_KEY);
            event = stripeClient.webhooks.constructEvent(
                req.body,
                sig,
                STRIPE_WEBHOOK_SECRET
            );
        } else {
            // For development without webhook secret
            event = req.body;
        }

        console.log('[Stripe Webhook] Received event:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('[Stripe Webhook] Error:', error);
        return res.status(400).json({
            success: false,
            error: 'Webhook processing failed',
            details: error.message
        });
    }
}

async function handleCheckoutCompleted(session) {
    try {
        console.log('[Stripe Webhook] Checkout completed:', session.id);
        console.log('[Stripe Webhook] Session data:', {
            subscription: session.subscription,
            customer: session.customer,
            metadata: session.metadata
        });

        const userId = session.metadata?.user_id;
        if (!userId) {
            console.warn('[Stripe Webhook] No user_id in metadata');
            return;
        }

        console.log('[Stripe Webhook] Updating user:', userId, 'with subscription:', session.subscription);

        // Update user with subscription info
        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 subscription_id = $1,
                 stripe_customer_id = $2
             WHERE id = $3
             RETURNING id, email, subscription_status, subscription_id`,
            [session.subscription, session.customer, userId]
        );

        console.log('[Stripe Webhook] Update result:', result.rows);
        console.log('[Stripe Webhook] Rows affected:', result.rowCount);

        if (result.rowCount === 0) {
            console.warn('[Stripe Webhook] No rows updated! User might not exist.');
        } else {
            console.log('[Stripe Webhook] User subscription activated:', userId);
        }

    } catch (error) {
        console.error('[Stripe Webhook] Error handling checkout:', error);
        console.error('[Stripe Webhook] Error stack:', error.stack);
    }
}

async function handleSubscriptionCreated(subscription) {
    try {
        console.log('[Stripe Webhook] Subscription created:', subscription.id);

        await pool.query(
            `UPDATE users
             SET subscription_status = $1,
                 subscription_id = $2,
                 subscription_current_period_end = to_timestamp($3)
             WHERE stripe_customer_id = $4`,
            [
                subscription.status,
                subscription.id,
                subscription.current_period_end,
                subscription.customer
            ]
        );

        console.log('[Stripe Webhook] Subscription saved to database');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling subscription created:', error);
    }
}

async function handleSubscriptionUpdated(subscription) {
    try {
        console.log('[Stripe Webhook] Subscription updated:', subscription.id);

        await pool.query(
            `UPDATE users
             SET subscription_status = $1,
                 subscription_current_period_end = to_timestamp($2)
             WHERE subscription_id = $3`,
            [
                subscription.status,
                subscription.current_period_end,
                subscription.id
            ]
        );

        console.log('[Stripe Webhook] Subscription status updated');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling subscription updated:', error);
    }
}

async function handleSubscriptionDeleted(subscription) {
    try {
        console.log('[Stripe Webhook] Subscription deleted:', subscription.id);

        await pool.query(
            `UPDATE users
             SET subscription_status = 'canceled'
             WHERE subscription_id = $1`,
            [subscription.id]
        );

        console.log('[Stripe Webhook] Subscription marked as canceled');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling subscription deleted:', error);
    }
}

async function handlePaymentSucceeded(invoice) {
    try {
        console.log('[Stripe Webhook] Payment succeeded for invoice:', invoice.id);

        // Ensure subscription is marked as active
        if (invoice.subscription) {
            await pool.query(
                `UPDATE users
                 SET subscription_status = 'active'
                 WHERE subscription_id = $1`,
                [invoice.subscription]
            );
        }

        console.log('[Stripe Webhook] Payment processed successfully');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling payment succeeded:', error);
    }
}

async function handlePaymentFailed(invoice) {
    try {
        console.log('[Stripe Webhook] Payment failed for invoice:', invoice.id);

        // Mark subscription as past_due
        if (invoice.subscription) {
            await pool.query(
                `UPDATE users
                 SET subscription_status = 'past_due'
                 WHERE subscription_id = $1`,
                [invoice.subscription]
            );
        }

        console.log('[Stripe Webhook] Subscription marked as past_due');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling payment failed:', error);
    }
}

module.exports = handler;
