/**
 * Reset password for sales@buytheshed.com
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        const email = 'sales@buytheshed.com';
        const newPassword = 'BuyTheShed2025!';

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update the password
        const result = await client.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
            [passwordHash, email]
        );

        if (result.rows.length > 0) {
            console.log('✓ Password reset successfully!');
            console.log('\n📧 Email: sales@buytheshed.com');
            console.log('🔑 New Password: BuyTheShed2025!');
            console.log('🔐 Super Admin: YES');
            console.log('\nLogin at: https://shed-sync.com/login.html');
        } else {
            console.log('❌ User not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

resetPassword();
