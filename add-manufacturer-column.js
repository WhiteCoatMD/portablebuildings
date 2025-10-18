/**
 * Add Manufacturer Support to Users Table
 * Adds manufacturer column and sets existing users to 'graceland'
 */
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async () => {
    try {
        console.log('🔧 Adding manufacturer support...\n');

        // Add manufacturer column if it doesn't exist
        console.log('1️⃣ Adding manufacturer column to users table...');
        await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(50) DEFAULT 'graceland'
        `);
        console.log('✅ Manufacturer column added\n');

        // Update existing users to 'graceland'
        console.log('2️⃣ Setting existing users to Graceland manufacturer...');
        const result = await pool.query(`
            UPDATE users
            SET manufacturer = 'graceland'
            WHERE manufacturer IS NULL OR manufacturer = ''
        `);
        console.log(`✅ Updated ${result.rowCount} existing users to 'graceland'\n`);

        // Show current users
        console.log('3️⃣ Current users with manufacturer:');
        const users = await pool.query(`
            SELECT id, email, business_name, manufacturer
            FROM users
            ORDER BY created_at ASC
        `);

        users.rows.forEach(user => {
            console.log(`   - ${user.email}: ${user.manufacturer}`);
        });

        console.log(`\n✅ Database update complete!`);
        console.log(`📊 Total users: ${users.rows.length}`);

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
