/**
 * Fix UXS Building Type Records
 * Updates all UXS records in the database to use 'Utility Building' instead of 'Side Utility Building'
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

        // Update all UXS records to use 'Utility Building' instead of 'Side Utility Building' or 'Unknown Type'
        const result = await pool.query(`
            UPDATE user_inventory
            SET type_name = 'Utility Building',
                title = CONCAT(size_display, ' Utility Building')
            WHERE type_code = 'UXS'
              AND (type_name != 'Utility Building' OR title LIKE '%Unknown Type%' OR title LIKE '%Side Utility%')
        `);

        console.log(`✅ Updated ${result.rowCount} UXS records to 'Utility Building'`);

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
