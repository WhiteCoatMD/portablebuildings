/**
 * Test Environment Variables
 * Quick endpoint to check if env vars are loaded
 */

async function handler(req, res) {
    return res.status(200).json({
        hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
        stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : 'NOT SET',
        hasPriceId: !!process.env.STRIPE_PRICE_ID,
        priceIdPrefix: process.env.STRIPE_PRICE_ID ? process.env.STRIPE_PRICE_ID.substring(0, 10) + '...' : 'NOT SET',
        hasDatabase: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || 'not set'
    });
}

module.exports = handler;
