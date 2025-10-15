/**
 * Create Stripe Checkout Session
 * Creates a Stripe Checkout session for trial-to-paid upgrade
 */
const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');
const stripe = require('stripe');

const pool = getPool();

// You'll need to set this in your .env file
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID; // Your monthly subscription price ID

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // userId and email can come from authenticated user or request body (for signup flow)
        const userId = req.user?.id || req.body.userId;
        const email = req.user?.email || req.body.email;

        if (!userId || !email) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
            console.warn('[Stripe Checkout] Stripe not configured - skipping payment');
            // For development/testing: mark user as active without payment
            await pool.query(
                `UPDATE users
                 SET subscription_status = 'active',
                     subscription_plan = 'monthly',
                     trial_ends_at = NULL,
                     subscription_current_period_end = NOW() + INTERVAL '30 days'
                 WHERE id = $1`,
                [userId]
            );

            return res.status(200).json({
                success: true,
                skipPayment: true,
                message: 'Stripe not configured - user activated for testing'
            });
        }

        const stripeClient = stripe(STRIPE_SECRET_KEY);

        // Get or create Stripe customer
        const userResult = await pool.query(
            'SELECT stripe_customer_id, business_name FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userResult.rows[0];
        let customerId = user.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripeClient.customers.create({
                email: email,
                metadata: {
                    user_id: userId.toString(),
                    business_name: user.business_name || ''
                }
            });

            customerId = customer.id;

            // Save customer ID to database
            await pool.query(
                'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
                [customerId, userId]
            );
        }

        // Create Checkout session
        const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: STRIPE_PRICE_ID, // Your monthly subscription price ID
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin || 'http://localhost:3000'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}/admin.html`,
            metadata: {
                user_id: userId.toString()
            }
        });

        console.log('[Stripe Checkout] Session created:', session.id, 'for user:', userId);

        return res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (error) {
        console.error('[Stripe Checkout] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create checkout session',
            details: error.message
        });
    }
}

module.exports = handler;
