/**
 * List Dealers API
 * Returns list of all dealers for the landing page demo section
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
        const result = await pool.query(
            `SELECT id, email, business_name, subdomain, custom_domain, domain_verified
             FROM users
             WHERE subdomain IS NOT NULL
             ORDER BY created_at ASC`
        );

        const dealers = result.rows.map(user => ({
            id: user.id,
            email: user.email,
            businessName: user.business_name,
            subdomain: user.subdomain,
            customDomain: user.domain_verified ? user.custom_domain : null
        }));

        return res.status(200).json({
            success: true,
            dealers: dealers
        });

    } catch (error) {
        console.error('[List Dealers] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to load dealers',
            details: error.message
        });
    }
}

module.exports = handler;
