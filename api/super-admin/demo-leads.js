/**
 * Super Admin: Get all demo leads
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Verify super admin
        const userResult = await pool.query(
            'SELECT is_super_admin FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].is_super_admin) {
            return res.status(403).json({
                success: false,
                error: 'Super admin access required'
            });
        }

        // Get all demo leads, ordered by most recent first
        const result = await pool.query(
            `SELECT * FROM demo_leads ORDER BY created_at DESC`
        );

        return res.json({
            success: true,
            leads: result.rows.map(lead => ({
                id: lead.id,
                name: lead.name,
                city: lead.city,
                state: lead.state,
                phone: lead.phone,
                email: lead.email,
                status: lead.status,
                notes: lead.notes,
                createdAt: lead.created_at,
                updatedAt: lead.updated_at
            }))
        });

    } catch (error) {
        console.error('[Super Admin Demo Leads] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch demo leads'
        });
    }
};
