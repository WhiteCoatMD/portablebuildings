/**
 * Test Stripe Connection
 * Validates Stripe API keys
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');
const stripe = require('stripe');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'POST') {
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

        const { publishableKey, secretKey } = req.body;

        // Get secret key from database if not provided
        let actualSecretKey = secretKey;
        if (!actualSecretKey) {
            const result = await pool.query(
                `SELECT setting_value FROM user_settings
                 WHERE user_id = $1 AND setting_key = 'cpb_stripe_secret_key'`,
                [decoded.userId]
            );

            if (result.rows.length > 0) {
                actualSecretKey = JSON.parse(result.rows[0].setting_value);
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'No secret key found'
                });
            }
        }

        // Validate key formats
        if (!publishableKey || !publishableKey.startsWith('pk_')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid publishable key format'
            });
        }

        if (!actualSecretKey || !actualSecretKey.startsWith('sk_')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid secret key format'
            });
        }

        // Test the connection by creating a Stripe instance and retrieving account info
        const stripeClient = stripe(actualSecretKey);

        try {
            const account = await stripeClient.account.retrieve();

            // Determine if using test or live mode
            const mode = actualSecretKey.includes('_test_') ? 'test' : 'live';

            return res.status(200).json({
                success: true,
                mode,
                accountId: account.id,
                email: account.email || account.business_profile?.name || 'Unknown'
            });

        } catch (stripeError) {
            console.error('[Stripe Test] Stripe API error:', stripeError.message);
            return res.status(400).json({
                success: false,
                error: stripeError.message || 'Invalid Stripe credentials'
            });
        }

    } catch (error) {
        console.error('[Stripe Test] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to test Stripe connection',
            details: error.message
        });
    }
}

module.exports = handler;
