/**
 * Fix UXS Building Type Records
 * Updates all UXS records in the database to use 'Side Utility' as the correct building type
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
        console.log('Connecting to database...');

        // Update all UXS records to use 'Side Utility' instead of 'Utility Building' or 'Unknown Type'
        const result = await pool.query(`
            UPDATE user_inventory
            SET type_name = 'Side Utility',
                title = CONCAT(size_display, ' Side Utility')
            WHERE type_code = 'UXS'
              AND (type_name != 'Side Utility' OR title LIKE '%Unknown Type%' OR title LIKE '%Utility Building%')
        `);

        console.log(`✅ Updated ${result.rowCount} UXS records to 'Side Utility'`);

        // Show what we updated
        const check = await pool.query(`
            SELECT serial_number, type_code, type_name, title
            FROM user_inventory
            WHERE type_code = 'UXS'
            ORDER BY created_at DESC
            LIMIT 10
        `);

        console.log('\nSample UXS records after update:');
        check.rows.forEach(row => {
            console.log(`  - ${row.serial_number}: ${row.type_name} (${row.title})`);
        });

        await pool.end();
        console.log('\n✅ Database update complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
