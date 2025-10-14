/**
 * Debug Endpoint - Check Subdomain in Database
 * Helps diagnose subdomain lookup issues
 */
const { getPool } = require('../../lib/db');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { email, subdomain } = req.query;

        if (!email && !subdomain) {
            return res.status(400).json({
                success: false,
                error: 'Provide either email or subdomain query parameter'
            });
        }

        let result;
        if (email) {
            result = await pool.query(
                'SELECT id, email, subdomain, business_name, created_at FROM users WHERE email = $1',
                [email]
            );
        } else {
            result = await pool.query(
                'SELECT id, email, subdomain, business_name, created_at FROM users WHERE subdomain = $1',
                [subdomain]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No user found with ${email ? 'email' : 'subdomain'}: ${email || subdomain}`
            });
        }

        const user = result.rows[0];

        // Also check all users with subdomains
        const allSubdomains = await pool.query(
            'SELECT id, email, subdomain FROM users WHERE subdomain IS NOT NULL ORDER BY subdomain'
        );

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                subdomain: user.subdomain,
                businessName: user.business_name,
                createdAt: user.created_at
            },
            allSubdomains: allSubdomains.rows.map(u => ({
                email: u.email,
                subdomain: u.subdomain
            }))
        });

    } catch (error) {
        console.error('[Debug] Error checking subdomain:', error);
        return res.status(500).json({
            success: false,
            error: 'Database error',
            details: error.message
        });
    }
}

module.exports = handler;
