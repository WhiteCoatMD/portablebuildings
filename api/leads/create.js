/**
 * Create a new lead
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
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
        const {
            customerName,
            customerEmail,
            customerPhone,
            buildingSerial,
            source,
            priority,
            notes
        } = req.body;

        // Validate required fields
        if (!customerName) {
            return res.status(400).json({
                success: false,
                error: 'Customer name is required'
            });
        }

        // At least one contact method required
        if (!customerEmail && !customerPhone) {
            return res.status(400).json({
                success: false,
                error: 'Email or phone number is required'
            });
        }

        // Insert lead
        const result = await pool.query(
            `INSERT INTO leads (
                user_id, customer_name, customer_email, customer_phone,
                building_serial, source, priority, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new')
            RETURNING *`,
            [
                userId,
                customerName,
                customerEmail || null,
                customerPhone || null,
                buildingSerial || null,
                source || 'website',
                priority || 'medium',
                notes || null
            ]
        );

        const lead = result.rows[0];

        console.log('[Leads] Created new lead:', lead.id, 'for user:', userId);

        return res.json({
            success: true,
            lead: {
                id: lead.id,
                customerName: lead.customer_name,
                customerEmail: lead.customer_email,
                customerPhone: lead.customer_phone,
                buildingSerial: lead.building_serial,
                status: lead.status,
                source: lead.source,
                priority: lead.priority,
                notes: lead.notes,
                createdAt: lead.created_at
            }
        });

    } catch (error) {
        console.error('[Leads Create] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to create lead'
        });
    }
};
