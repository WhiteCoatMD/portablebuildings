/**
 * Setup sales@buytheshed.com user account
 * This user needs access to manage a dealer site
 */

const { getPool } = require('./lib/db');
const { hashPassword } = require('./lib/auth');

const pool = getPool();

async function setupSalesUser() {
    try {
        // Check if user exists
        const existing = await pool.query(
            'SELECT id, email, business_name, is_admin FROM users WHERE email = $1',
            ['sales@buytheshed.com']
        );

        if (existing.rows.length > 0) {
            console.log('✓ User already exists:');
            console.log(JSON.stringify(existing.rows[0], null, 2));
            console.log('\nIf you need to reset the password, we can do that.');
        } else {
            console.log('Creating new user account for sales@buytheshed.com...');

            // Generate a password
            const password = 'BuyTheShed2025!'; // They should change this after first login
            const passwordHash = await hashPassword(password);

            // Create the user
            const result = await pool.query(
                `INSERT INTO users (email, password_hash, business_name, is_admin)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, email, business_name, is_admin, created_at`,
                ['sales@buytheshed.com', passwordHash, 'Buy The Shed Sales Team', false]
            );

            console.log('\n✓ User created successfully!');
            console.log(JSON.stringify(result.rows[0], null, 2));
            console.log('\n📧 Email: sales@buytheshed.com');
            console.log('🔑 Password: BuyTheShed2025!');
            console.log('\n⚠️  They should change this password after first login!');
        }

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

setupSalesUser();
