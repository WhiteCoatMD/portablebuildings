/**
 * Super Admin - Update User Settings API
 * Update user subscription, features, and status
 */

const { sql } = require('@vercel/postgres');
const { requireAuth } = require('../../lib/auth');

async function handler(req, res) {
    // Check if user is admin
    if (!req.user.is_admin) {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }

    if (req.method !== 'PATCH') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { userId, updates } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Build update query dynamically based on provided fields
        const allowedFields = [
            'subscription_status',
            'subscription_plan',
            'subscription_start_date',
            'subscription_end_date',
            'features',
            'is_admin'
        ];

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                if (key === 'features') {
                    // Handle JSONB field
                    updateFields.push(`${key} = $${paramIndex}::jsonb`);
                    values.push(JSON.stringify(value));
                } else if (key === 'subscription_start_date' || key === 'subscription_end_date') {
                    // Handle timestamp fields
                    updateFields.push(`${key} = $${paramIndex}::timestamp`);
                    values.push(value);
                } else if (key === 'is_admin') {
                    // Handle boolean
                    updateFields.push(`${key} = $${paramIndex}::boolean`);
                    values.push(value);
                } else {
                    updateFields.push(`${key} = $${paramIndex}`);
                    values.push(value);
                }
                paramIndex++;
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }

        // Add updated_at
        updateFields.push('updated_at = CURRENT_TIMESTAMP');

        // Build and execute query
        const query = `
            UPDATE users
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, email, business_name, subscription_status, subscription_plan, features
        `;
        values.push(userId);

        const result = await sql.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
}

module.exports = requireAuth(handler);
