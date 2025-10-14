/**
 * User Trigger Sync
 * Triggers a sync for the authenticated user using their stored GPB credentials
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');
const { decrypt } = require('./save-gpb-credentials');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Get user's credentials from database
        const userQuery = await pool.query(
            `SELECT gpb_username, gpb_password_encrypted, business_name
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = userQuery.rows[0];

        // Check if credentials are saved
        if (!user.gpb_username || !user.gpb_password_encrypted) {
            return res.status(400).json({
                success: false,
                error: 'GPB credentials not configured. Please save your GPB Sales login credentials first.'
            });
        }

        // Decrypt password
        let decryptedPassword;
        try {
            decryptedPassword = decrypt(user.gpb_password_encrypted);
        } catch (decryptError) {
            console.error('Decryption error:', decryptError);
            return res.status(500).json({
                success: false,
                error: 'Failed to decrypt credentials'
            });
        }

        // Get the sync server URL from environment
        const syncServerUrl = process.env.SYNC_SERVER_URL;

        if (!syncServerUrl) {
            return res.status(200).json({
                success: false,
                message: 'Sync server not configured. Contact support.',
                error: 'SYNC_SERVER_URL not set'
            });
        }

        // Trigger the sync with user's credentials
        const lotName = user.business_name || 'Main Lot';
        const webhookSecret = process.env.WEBHOOK_SECRET || 'change-this-secret';

        console.log(`[${new Date().toISOString()}] Triggering sync for user ${req.user.id}: ${lotName}`);
        console.log(`DEBUG - Webhook secret being sent: ${webhookSecret}`);

        const response = await fetch(`${syncServerUrl}/sync-lot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${webhookSecret}`
            },
            body: JSON.stringify({
                username: user.gpb_username,
                password: decryptedPassword,
                lotName: lotName,
                userId: req.user.id
            }),
            signal: AbortSignal.timeout(300000) // 5 minute timeout for scraping
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sync server error: ${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Sync failed');
        }

        // Save the inventory to the database
        console.log(`Received ${result.count} buildings, saving to database...`);

        // Delete existing inventory for this user
        await pool.query(
            'DELETE FROM user_inventory WHERE user_id = $1',
            [req.user.id]
        );

        // Insert new inventory (data is already decoded by sync-server)
        if (result.inventory && result.inventory.length > 0) {
            const insertPromises = result.inventory.map(building => {
                return pool.query(
                    `INSERT INTO user_inventory (
                        user_id, serial_number, type_code, type_name, title,
                        size_display, width, length, date_built, price,
                        rto36, rto48, rto60, rto72, is_repo, location, auto_status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT (user_id, serial_number) DO UPDATE SET
                        type_code = EXCLUDED.type_code,
                        type_name = EXCLUDED.type_name,
                        title = EXCLUDED.title,
                        size_display = EXCLUDED.size_display,
                        width = EXCLUDED.width,
                        length = EXCLUDED.length,
                        date_built = EXCLUDED.date_built,
                        price = EXCLUDED.price,
                        rto36 = EXCLUDED.rto36,
                        rto48 = EXCLUDED.rto48,
                        rto60 = EXCLUDED.rto60,
                        rto72 = EXCLUDED.rto72,
                        is_repo = EXCLUDED.is_repo,
                        location = EXCLUDED.location,
                        updated_at = CURRENT_TIMESTAMP`,
                    [
                        req.user.id,
                        building.serialNumber,
                        building.type_code,
                        building.type_name,
                        building.title,
                        building.size_display,
                        building.width,
                        building.length,
                        building.date_built,
                        building.price,
                        building.rto36,
                        building.rto48,
                        building.rto60,
                        building.rto72,
                        building.isRepo,
                        building.location,
                        'available'
                    ]
                );
            });

            await Promise.all(insertPromises);
        }

        console.log(`Successfully saved ${result.count} buildings for user ${req.user.id}`);

        return res.status(200).json({
            success: true,
            message: `Successfully synced ${result.count} buildings`,
            count: result.count
        });

    } catch (error) {
        console.error('Trigger sync error:', error);

        return res.status(200).json({
            success: false,
            message: 'Sync failed',
            error: error.message,
            help: 'Make sure the sync server is running and your GPB credentials are correct'
        });
    }
}

module.exports = requireAuth(handler);
