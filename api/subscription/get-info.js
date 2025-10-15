/**
 * Get Subscription Information
 * Returns subscription status, payment method, and billing history
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');
const stripe = require('stripe');

const pool = getPool();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Get user subscription information
        const userResult = await pool.query(
            `SELECT subscription_status, subscription_id, stripe_customer_id,
                    subscription_current_period_end, trial_ends_at, paypal_subscription_id,
                    subscription_plan
             FROM users
             WHERE id = $1`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Initialize response data
        let subscriptionInfo = {
            status: user.subscription_status || 'trial',
            trialEndsAt: user.trial_ends_at ? new Date(user.trial_ends_at) : null,
            isTrialExpired: user.trial_ends_at ? new Date(user.trial_ends_at) < new Date() : false,
            hoursRemaining: user.trial_ends_at
                ? Math.max(0, Math.floor((new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60)))
                : null,
            nextBillingDate: user.subscription_current_period_end
                ? new Date(user.subscription_current_period_end).toLocaleDateString()
                : null,
            amount: user.paypal_subscription_id ? '99.00' : null, // PayPal subscriptions are $99/month
            interval: user.paypal_subscription_id ? 'month' : null,
            currency: 'USD',
            provider: user.paypal_subscription_id ? 'paypal' : (user.stripe_customer_id ? 'stripe' : null)
        };

        let paymentMethodInfo = null;
        let invoicesList = [];

        // Fetch additional data from Stripe if available
        if (user.subscription_id && STRIPE_SECRET_KEY) {
            try {
                const stripeClient = stripe(STRIPE_SECRET_KEY);

                // Fetch subscription details to get amount
                const subscription = await stripeClient.subscriptions.retrieve(user.subscription_id);

                if (subscription && subscription.items && subscription.items.data.length > 0) {
                    const price = subscription.items.data[0].price;
                    subscriptionInfo.amount = (price.unit_amount / 100).toFixed(2);
                    subscriptionInfo.interval = price.recurring?.interval || 'month';
                    subscriptionInfo.currency = price.currency.toUpperCase();
                }

                // Fetch payment method if customer exists
                if (user.stripe_customer_id) {
                    const paymentMethods = await stripeClient.paymentMethods.list({
                        customer: user.stripe_customer_id,
                        type: 'card',
                        limit: 1
                    });

                    if (paymentMethods.data.length > 0) {
                        const pm = paymentMethods.data[0];
                        paymentMethodInfo = {
                            brand: pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1),
                            last4: pm.card.last4,
                            expMonth: pm.card.exp_month,
                            expYear: pm.card.exp_year
                        };
                    }

                    // Fetch recent invoices
                    const invoices = await stripeClient.invoices.list({
                        customer: user.stripe_customer_id,
                        limit: 10
                    });

                    invoicesList = invoices.data.map(inv => ({
                        date: inv.created * 1000, // Convert to milliseconds
                        description: inv.description || `Subscription for ${new Date(inv.created * 1000).toLocaleDateString()}`,
                        amount: inv.amount_paid,
                        status: inv.status === 'paid' ? 'paid' : 'failed',
                        receiptUrl: inv.hosted_invoice_url
                    }));
                }
            } catch (stripeError) {
                console.error('[Get Info] Stripe API error:', stripeError.message);
                // Continue with database data only
            }
        }

        const response = {
            success: true,
            subscription: subscriptionInfo,
            paymentMethod: paymentMethodInfo,
            invoices: invoicesList
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('[Subscription] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get subscription information',
            details: error.message
        });
    }
}

module.exports = handler;
