/**
 * Update an existing lead
 */
const { getPool } = require('../../lib/db');
const { verifyToken } = require('../../lib/auth');

const pool = getPool();

module.exports = async (req, res) => {
    if (req.method !== 'PUT') {
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
        const { leadId, ...updates } = req.body;

        if (!leadId) {
            return res.status(400).json({
                success: false,
                error: 'Lead ID is required'
            });
        }

        // Build update query dynamically based on provided fields
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        const fieldMapping = {
            customerName: 'customer_name',
            customerEmail: 'customer_email',
            customerPhone: 'customer_phone',
            buildingSerial: 'building_serial',
            status: 'status',
            source: 'source',
            priority: 'priority',
            nextFollowUpDate: 'next_follow_up_date',
            lastContactedAt: 'last_contacted_at',
            quotedAmount: 'quoted_amount',
            soldAmount: 'sold_amount',
            notes: 'notes',
            lostReason: 'lost_reason'
        };

        for (const [key, dbColumn] of Object.entries(fieldMapping)) {
            if (updates[key] !== undefined) {
                updateFields.push(`${dbColumn} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        // Add user_id and lead_id to values
        values.push(userId);
        const userIdParam = paramIndex;
        paramIndex++;

        values.push(leadId);
        const leadIdParam = paramIndex;

        const query = `
            UPDATE leads
            SET ${updateFields.join(', ')}
            WHERE id = $${leadIdParam} AND user_id = $${userIdParam}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        const lead = result.rows[0];

        console.log('[Leads] Updated lead:', lead.id);

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
                nextFollowUpDate: lead.next_follow_up_date,
                lastContactedAt: lead.last_contacted_at,
                quotedAmount: lead.quoted_amount,
                soldAmount: lead.sold_amount,
                notes: lead.notes,
                lostReason: lead.lost_reason,
                createdAt: lead.created_at,
                updatedAt: lead.updated_at
            }
        });

    } catch (error) {
        console.error('[Leads Update] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to update lead'
        });
    }
};
