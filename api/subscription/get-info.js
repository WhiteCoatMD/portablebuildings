/**
 * Get Subscription Information
 * Returns subscription status, payment method, and billing history
 * Now supports PayPal subscriptions only (Stripe removed)
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

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

        // For PayPal subscriptions, payment method info is managed through PayPal portal
        // Users can update payment methods at paypal.com
        const paymentMethodInfo = user.paypal_subscription_id ? {
            provider: 'PayPal',
            note: 'Manage payment method at paypal.com'
        } : null;

        // No billing history available through PayPal API in this implementation
        // Users can view invoices in their PayPal account
        const invoicesList = [];

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
