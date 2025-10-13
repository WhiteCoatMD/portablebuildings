/**
 * Get Current User API
 * Returns current authenticated user info
 */

const { requireAuth } = require('../../lib/auth');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    return res.status(200).json({
        success: true,
        user: req.user
    });
}

module.exports = requireAuth(handler);
