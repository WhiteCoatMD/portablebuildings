/**
 * Get all leads for the authenticated user
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

        const userId = decoded.userId;

        // Optional filters from query params
        const { status, priority } = req.query;

        let query = `
            SELECT * FROM leads
            WHERE user_id = $1
        `;
        const params = [userId];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        if (priority) {
            params.push(priority);
            query += ` AND priority = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);

        const leads = result.rows.map(lead => ({
            id: lead.id,
            customerName: lead.customer_name,
            customerEmail: lead.customer_email,
            customerPhone: lead.customer_phone,
            buildingSerial: lead.building_serial,
            status: lead.status,
            source: lead.source,
            priority: lead.priority,
            nextFollowUpDate: lead.next_follow_up_date,
            lastContactedAt: lead.last_contacted_at,
            quotedAmount: lead.quoted_amount,
            soldAmount: lead.sold_amount,
            notes: lead.notes,
            lostReason: lead.lost_reason,
            createdAt: lead.created_at,
            updatedAt: lead.updated_at
        }));

        return res.json({
            success: true,
            leads: leads,
            count: leads.length
        });

    } catch (error) {
        console.error('[Leads List] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch leads'
        });
    }
};
