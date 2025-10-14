/**
 * Get GPB Sales Credentials
 * Retrieves the user's saved GPB credentials for syncing
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');
const { decrypt } = require('./save-gpb-credentials');

const pool = getPool();

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        // Get user's credentials from database
        const result = await pool.query(
            `SELECT gpb_username, gpb_password_encrypted, auto_sync_enabled
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = result.rows[0];

        // Check if credentials are saved
        if (!user.gpb_username || !user.gpb_password_encrypted) {
            return res.status(200).json({
                success: true,
                hasCredentials: false,
                autoSync: false
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

        return res.status(200).json({
            success: true,
            hasCredentials: true,
            username: user.gpb_username,
            password: decryptedPassword,
            autoSync: user.auto_sync_enabled || false
        });

    } catch (error) {
        console.error('Get credentials error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve credentials'
        });
    }
}

module.exports = requireAuth(handler);
