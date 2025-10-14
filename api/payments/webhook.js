/**
 * Stripe Webhook Handler
 * Processes payment events from Stripe
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
        const event = req.body;

        console.log('[Stripe Webhook] Received event:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'payment_intent.canceled':
                await handlePaymentCanceled(event.data.object);
                break;

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('[Stripe Webhook] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Webhook processing failed'
        });
    }
}

async function handlePaymentSuccess(paymentIntent) {
    try {
        console.log('[Stripe Webhook] Payment succeeded:', paymentIntent.id);

        // Update transaction status
        const result = await pool.query(
            `UPDATE payment_transactions
             SET status = 'completed', updated_at = CURRENT_TIMESTAMP
             WHERE payment_intent_id = $1
             RETURNING *`,
            [paymentIntent.id]
        );

        if (result.rows.length > 0) {
            const transaction = result.rows[0];

            // If it's a full payment, mark the building as sold
            if (transaction.payment_type === 'full') {
                await pool.query(
                    `UPDATE user_inventory
                     SET auto_status = 'sold'
                     WHERE id = $1 AND user_id = $2`,
                    [transaction.building_id, transaction.user_id]
                );

                console.log('[Stripe Webhook] Building marked as sold:', transaction.building_id);
            }

            console.log('[Stripe Webhook] Transaction updated successfully');
        } else {
            console.warn('[Stripe Webhook] Transaction not found for payment intent:', paymentIntent.id);
        }

    } catch (error) {
        console.error('[Stripe Webhook] Error handling payment success:', error);
    }
}

async function handlePaymentFailed(paymentIntent) {
    try {
        console.log('[Stripe Webhook] Payment failed:', paymentIntent.id);

        await pool.query(
            `UPDATE payment_transactions
             SET status = 'failed', updated_at = CURRENT_TIMESTAMP
             WHERE payment_intent_id = $1`,
            [paymentIntent.id]
        );

        console.log('[Stripe Webhook] Transaction marked as failed');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling payment failure:', error);
    }
}

async function handlePaymentCanceled(paymentIntent) {
    try {
        console.log('[Stripe Webhook] Payment canceled:', paymentIntent.id);

        await pool.query(
            `UPDATE payment_transactions
             SET status = 'canceled', updated_at = CURRENT_TIMESTAMP
             WHERE payment_intent_id = $1`,
            [paymentIntent.id]
        );

        console.log('[Stripe Webhook] Transaction marked as canceled');

    } catch (error) {
        console.error('[Stripe Webhook] Error handling payment cancellation:', error);
    }
}

module.exports = handler;
