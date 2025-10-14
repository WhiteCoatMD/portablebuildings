/**
 * Get Subscription Information
 * Returns subscription status, payment method, and billing history
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
                    subscription_current_period_end
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

        // Format subscription info
        const subscriptionInfo = {
            status: user.subscription_status || 'active',
            nextBillingDate: user.subscription_current_period_end
                ? new Date(user.subscription_current_period_end).toLocaleDateString()
                : null
        };

        // TODO: In production, fetch actual payment method and invoices from Stripe
        // For now, return placeholder data
        const response = {
            success: true,
            subscription: subscriptionInfo,
            paymentMethod: null, // Will be populated from Stripe in production
            invoices: [] // Will be populated from Stripe in production
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
