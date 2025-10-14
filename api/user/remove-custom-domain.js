/**
 * Remove Custom Domain API
 * Allows users to remove their custom domain
 */
const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No authorization token provided'
        });
    }

    const token = authHeader.substring(7);

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Remove custom domain
        await pool.query(
            `UPDATE users
             SET custom_domain = NULL,
                 domain_verified = false,
                 domain_verification_token = NULL,
                 updated_at = NOW()
             WHERE id = $1`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Custom domain removed'
        });

    } catch (error) {
        console.error('[Remove Custom Domain] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to remove custom domain',
            details: error.message
        });
    }
}

module.exports = handler;
