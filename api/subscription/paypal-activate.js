/**
 * PayPal Subscription Activation
 * Activates user subscription after PayPal approval
 */
const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).json({
                success: false,
                error: 'Subscription ID is required'
            });
        }

        console.log('[PayPal] Activating subscription for user:', req.user.id, 'with subscription:', subscriptionId);

        // Update user to active subscription
        const result = await pool.query(
            `UPDATE users
             SET subscription_status = 'active',
                 subscription_id = $1,
                 subscription_plan = 'monthly',
                 trial_ends_at = NULL,
                 subscription_current_period_end = NOW() + INTERVAL '30 days',
                 paypal_subscription_id = $1
             WHERE id = $2
             RETURNING id, email, subscription_status, subscription_id`,
            [subscriptionId, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log('[PayPal] User subscription activated:', result.rows[0]);

        return res.status(200).json({
            success: true,
            message: 'Subscription activated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('[PayPal Activate] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to activate subscription',
            details: error.message
        });
    }
}

module.exports = requireAuth(handler);
