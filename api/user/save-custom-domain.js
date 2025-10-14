/**
 * Save Custom Domain API
 * Allows users to set their custom domain
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

        const { customDomain } = req.body;

        if (!customDomain) {
            return res.status(400).json({
                success: false,
                error: 'Custom domain is required'
            });
        }

        // Validate domain format
        const domainRegex = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i;
        if (!domainRegex.test(customDomain)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid domain format'
            });
        }

        // Check if domain is already taken by another user
        const existingDomain = await pool.query(
            'SELECT id FROM users WHERE custom_domain = $1 AND id != $2',
            [customDomain.toLowerCase(), userId]
        );

        if (existingDomain.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'This domain is already connected to another account'
            });
        }

        // Save custom domain (unverified initially)
        await pool.query(
            `UPDATE users
             SET custom_domain = $1,
                 domain_verified = false,
                 updated_at = NOW()
             WHERE id = $2`,
            [customDomain.toLowerCase(), userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Custom domain saved. Please configure DNS to verify.',
            customDomain: customDomain.toLowerCase()
        });

    } catch (error) {
        console.error('[Save Custom Domain] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to save custom domain',
            details: error.message
        });
    }
}

module.exports = handler;
