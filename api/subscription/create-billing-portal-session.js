/**
 * Create Stripe Billing Portal Session
 * Allows customers to manage their subscription and payment methods
 */
const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');
const stripe = require('stripe');

const pool = getPool();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        if (!STRIPE_SECRET_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Stripe not configured'
            });
        }

        const stripeClient = stripe(STRIPE_SECRET_KEY);

        // Get user's Stripe customer ID
        const userResult = await pool.query(
            'SELECT stripe_customer_id FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const customerId = userResult.rows[0].stripe_customer_id;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: 'No payment method on file. Please subscribe first.'
            });
        }

        // Create Billing Portal session
        const session = await stripeClient.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.origin || 'http://localhost:3000'}/admin.html`,
        });

        console.log('[Billing Portal] Session created for user:', req.user.id);

        return res.status(200).json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('[Billing Portal] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create billing portal session',
            details: error.message
        });
    }
}

module.exports = requireAuth(handler);
