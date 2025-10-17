require('dotenv').config({ path: '.env.local' });
const { getPool } = require('./lib/db');

async function checkSchema() {
    const pool = getPool();
    try {
        const result = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.table(result.rows);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
