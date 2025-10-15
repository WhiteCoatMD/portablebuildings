/**
 * Facebook OAuth - Start Flow
 * Redirects user to Facebook for authorization
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Facebook App credentials - you'll need to set these in Vercel environment variables
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'https://shed-sync.com/api/auth/facebook-callback';

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify user is authenticated
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!FACEBOOK_APP_ID) {
            return res.status(500).json({
                success: false,
                error: 'Facebook App ID not configured'
            });
        }

        // Create state token with user ID to verify callback
        const state = Buffer.from(JSON.stringify({
            userId: decoded.userId,
            timestamp: Date.now()
        })).toString('base64');

        // Facebook OAuth URL with required permissions
        // Using public_profile (automatically approved) to get user authentication
        // The /me/accounts endpoint will return page tokens with manage and post permissions
        // if the user is an admin of the page - no additional permissions needed
        // Note: To request pages_manage_posts and pages_read_engagement, you need to:
        // 1. Search for them in your App Dashboard under "Permissions and Features"
        // 2. Add them to your app
        // 3. Request Advanced Access through App Review
        const facebookAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
            `client_id=${FACEBOOK_APP_ID}` +
            `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
            `&state=${state}` +
            `&scope=public_profile` +
            `&response_type=code`;

        console.log('[FB OAuth] Redirecting user to Facebook authorization');

        // Return the URL for client-side redirect
        res.json({
            success: true,
            authUrl: facebookAuthUrl
        });

    } catch (error) {
        console.error('[FB OAuth] Error starting OAuth flow:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to start Facebook authorization',
            details: error.message
        });
    }
};
