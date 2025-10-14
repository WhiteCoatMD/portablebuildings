/**
 * Setup sales@buytheshed.com as super admin
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function setupSuperAdmin() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        // Check if user exists
        const existing = await client.query(
            'SELECT id, email, business_name, is_admin FROM users WHERE email = $1',
            ['sales@buytheshed.com']
        );

        if (existing.rows.length > 0) {
            console.log('✓ User already exists:');
            console.log(JSON.stringify(existing.rows[0], null, 2));

            // Update to super admin if not already
            if (!existing.rows[0].is_admin) {
                await client.query(
                    'UPDATE users SET is_admin = true WHERE email = $1',
                    ['sales@buytheshed.com']
                );
                console.log('\n✓ Updated to super admin status!');
            } else {
                console.log('\n✓ Already has super admin status!');
            }

            // Option to reset password
            console.log('\nTo reset password, uncomment the password reset section in this script.');
        } else {
            console.log('Creating new super admin account for sales@buytheshed.com...');

            // Generate password hash
            const password = 'BuyTheShed2025!';
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Create the user with super admin access
            const result = await client.query(
                `INSERT INTO users (email, password_hash, business_name, is_admin)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, email, business_name, is_admin, created_at`,
                ['sales@buytheshed.com', passwordHash, 'Community Portable Buildings - West Monroe', true]
            );

            console.log('\n✓ Super admin created successfully!');
            console.log(JSON.stringify(result.rows[0], null, 2));
            console.log('\n📧 Email: sales@buytheshed.com');
            console.log('🔑 Password: BuyTheShed2025!');
            console.log('🔐 Super Admin: YES');
            console.log('\n⚠️  Change this password after first login!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

setupSuperAdmin();
