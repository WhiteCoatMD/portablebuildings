/**
 * Check Subdomain Availability API
 * Validates subdomain format and checks if it's available
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
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const { subdomain } = req.body;

        if (!subdomain) {
            return res.status(400).json({
                success: false,
                available: false,
                error: 'Subdomain is required'
            });
        }

        // Validate subdomain format
        // Must be 3-30 characters, lowercase alphanumeric and hyphens only
        // Cannot start or end with hyphen
        const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/;
        if (!subdomainRegex.test(subdomain)) {
            return res.status(400).json({
                success: false,
                available: false,
                error: 'Subdomain must be 3-30 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.'
            });
        }

        // Check if subdomain is reserved
        if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
            return res.status(400).json({
                success: false,
                available: false,
                error: 'This subdomain is reserved and cannot be used.'
            });
        }

        // Check if subdomain is already taken by another user
        const existingSubdomain = await pool.query(
            'SELECT id FROM users WHERE subdomain = $1 AND id != $2',
            [subdomain.toLowerCase(), userId]
        );

        if (existingSubdomain.rows.length > 0) {
            return res.status(200).json({
                success: true,
                available: false,
                message: 'This subdomain is already taken.'
            });
        }

        // Subdomain is available
        return res.status(200).json({
            success: true,
            available: true,
            message: 'This subdomain is available!',
            subdomain: subdomain.toLowerCase()
        });

    } catch (error) {
        console.error('[Check Subdomain] Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Failed to check subdomain availability',
            details: error.message
        });
    }
}

module.exports = handler;
