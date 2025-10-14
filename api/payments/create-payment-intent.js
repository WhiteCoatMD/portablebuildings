/**
 * Create Stripe Payment Intent
 * Handles payment processing for building purchases
 */
const { getPool } = require('../../lib/db');
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
        const { userId, buildingId, amount, paymentType, customerEmail, customerName } = req.body;

        console.log('[Payment] Creating payment intent:', { userId, buildingId, amount, paymentType });

        // Validate required fields
        if (!userId || !buildingId || !amount || !customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Get user's Stripe credentials from database
        const settingsResult = await pool.query(
            `SELECT setting_key, setting_value FROM user_settings
             WHERE user_id = $1 AND setting_key IN ('cpb_stripe_secret_key', 'cpb_stripe_enabled')`,
            [userId]
        );

        const settings = {};
        settingsResult.rows.forEach(row => {
            try {
                settings[row.setting_key] = JSON.parse(row.setting_value);
            } catch {
                settings[row.setting_key] = row.setting_value;
            }
        });

        // Check if Stripe is enabled
        if (!settings.cpb_stripe_enabled) {
            return res.status(400).json({
                success: false,
                error: 'Stripe payments not enabled for this seller'
            });
        }

        const secretKey = settings.cpb_stripe_secret_key;
        if (!secretKey) {
            return res.status(400).json({
                success: false,
                error: 'Stripe not configured for this seller'
            });
        }

        // Get building information
        const buildingResult = await pool.query(
            `SELECT * FROM user_inventory WHERE user_id = $1 AND id = $2`,
            [userId, buildingId]
        );

        if (buildingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Building not found'
            });
        }

        const building = buildingResult.rows[0];

        // Get user information
        const userResult = await pool.query(
            `SELECT business_name, email FROM users WHERE id = $1`,
            [userId]
        );

        const user = userResult.rows[0];

        // Create Stripe payment intent
        const stripeClient = stripe(secretKey);

        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            receipt_email: customerEmail,
            metadata: {
                building_serial: building.serial_number,
                building_title: building.title,
                payment_type: paymentType || 'full',
                seller_business: user.business_name || user.email,
                seller_id: userId,
                building_id: buildingId
            },
            description: `${paymentType === 'deposit' ? 'Deposit' : 'Purchase'} - ${building.title} (${building.serial_number})`
        });

        console.log('[Payment] Payment intent created:', paymentIntent.id);

        // Log the transaction attempt
        await pool.query(
            `INSERT INTO payment_transactions (user_id, building_id, payment_intent_id, amount, payment_type, customer_email, customer_name, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
            [userId, buildingId, paymentIntent.id, amount, paymentType || 'full', customerEmail, customerName || '']
        );

        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('[Payment] Error creating payment intent:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create payment',
            details: error.message
        });
    }
}

module.exports = handler;
