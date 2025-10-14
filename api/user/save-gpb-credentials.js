/**
 * Save GPB Sales Credentials
 * Stores encrypted credentials for automated syncing
 */

const { requireAuth } = require('../../lib/auth');
const { getPool } = require('../../lib/db');
const crypto = require('crypto');

const pool = getPool();

// Simple encryption (in production, use a proper key management system)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-change-me!!';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const { username, password, autoSync } = req.body;

    if (!username) {
        return res.status(400).json({
            success: false,
            error: 'Username required'
        });
    }

    try {
        // If password is provided, update everything including password
        if (password) {
            const encryptedPassword = encrypt(password);
            await pool.query(
                `UPDATE users
                 SET gpb_username = $1,
                     gpb_password_encrypted = $2,
                     auto_sync_enabled = $3,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [username, encryptedPassword, autoSync || false, req.user.id]
            );
        } else {
            // Update username and autoSync only, keep existing password
            await pool.query(
                `UPDATE users
                 SET gpb_username = $1,
                     auto_sync_enabled = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3`,
                [username, autoSync || false, req.user.id]
            );
        }

        return res.status(200).json({
            success: true,
            message: 'GPB credentials saved successfully'
        });

    } catch (error) {
        console.error('Save credentials error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save credentials'
        });
    }
}

module.exports = requireAuth(handler);
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
