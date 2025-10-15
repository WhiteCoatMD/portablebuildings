/**
 * Reset password for sales@buytheshed.com
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
    try {
        const email = 'sales@buytheshed.com';
        const newPassword = 'Newstart101!';

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        const result = await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
            [hashedPassword, email]
        );

        if (result.rows.length > 0) {
            console.log('✅ Password reset successfully!');
            console.log(`   Email: ${result.rows[0].email}`);
            console.log(`   New Password: ${newPassword}`);
        } else {
            console.log('❌ User not found');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

resetPassword();
