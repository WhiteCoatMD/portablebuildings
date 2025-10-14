/**
 * Update User Subdomain API (Super Admin Only)
 * Allows super admin to change a user's subdomain
 */
const { getPool } = require('../../lib/db');
const jwt = require('jsonwebtoken');

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Reserved subdomains that can't be used
const RESERVED_SUBDOMAINS = [
    'www', 'api', 'admin', 'app', 'mail', 'ftp', 'smtp', 'pop',
    'imap', 'webmail', 'cpanel', 'whm', 'dns', 'ns1', 'ns2',
    'help', 'support', 'blog', 'forum', 'shop', 'store', 'dev',
    'staging', 'test', 'demo', 'beta', 'alpha', 'cdn', 'static',
    'assets', 'media', 'files', 'downloads', 'upload', 'uploads'
];

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
        // Verify token and check if user is admin
        const decoded = jwt.verify(token, JWT_SECRET);
        const adminId = decoded.userId;

        // Check if requesting user is an admin
        const adminCheck = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [adminId]
        );

        if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const { userId, subdomain } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        if (!subdomain) {
            return res.status(400).json({
                success: false,
                error: 'Subdomain is required'
            });
        }

        // Validate subdomain format
        const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;
        if (!subdomainRegex.test(subdomain)) {
            return res.status(400).json({
                success: false,
                error: 'Subdomain must be 3-30 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.'
            });
        }

        // Check if subdomain is reserved
        if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
            return res.status(400).json({
                success: false,
                error: 'This subdomain is reserved and cannot be used.'
            });
        }

        // Check if subdomain is already taken by another user
        const existingSubdomain = await pool.query(
            'SELECT id, email FROM users WHERE subdomain = $1 AND id != $2',
            [subdomain.toLowerCase(), userId]
        );

        if (existingSubdomain.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: `This subdomain is already taken by ${existingSubdomain.rows[0].email}`
            });
        }

        // Update subdomain
        await pool.query(
            `UPDATE users
             SET subdomain = $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [subdomain.toLowerCase(), userId]
        );

        // Get updated user info
        const updatedUser = await pool.query(
            'SELECT email, subdomain FROM users WHERE id = $1',
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Subdomain updated successfully',
            user: updatedUser.rows[0]
        });

    } catch (error) {
        console.error('[Update User Subdomain] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to update subdomain',
            details: error.message
        });
    }
}

module.exports = handler;
