/**
 * Add an activity/note to a lead
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
        const { leadId, activityType, description, metadata } = req.body;

        if (!leadId || !activityType || !description) {
            return res.status(400).json({
                success: false,
                error: 'Lead ID, activity type, and description are required'
            });
        }

        // Verify lead belongs to user
        const leadCheck = await pool.query(
            'SELECT id FROM leads WHERE id = $1 AND user_id = $2',
            [leadId, userId]
        );

        if (leadCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        // Insert activity
        const result = await pool.query(
            `INSERT INTO lead_activities (lead_id, user_id, activity_type, description, metadata)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [leadId, userId, activityType, description, metadata || {}]
        );

        const activity = result.rows[0];

        // If it's a call or email, update last_contacted_at
        if (activityType === 'call' || activityType === 'email') {
            await pool.query(
                'UPDATE leads SET last_contacted_at = NOW() WHERE id = $1',
                [leadId]
            );
        }

        console.log('[Leads] Added activity to lead:', leadId);

        return res.json({
            success: true,
            activity: {
                id: activity.id,
                leadId: activity.lead_id,
                activityType: activity.activity_type,
                description: activity.description,
                metadata: activity.metadata,
                createdAt: activity.created_at
            }
        });

    } catch (error) {
        console.error('[Leads Activity] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to add activity'
        });
    }
};
