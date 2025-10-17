/**
 * Manually clear Facebook tokens from database
 */
const { getPool } = require('./lib/db');

async function clearFacebookTokens() {
    const pool = getPool();

    try {
        console.log('Clearing all Facebook tokens from database...');

        // Delete all Facebook-related settings
        const result = await pool.query(`
            DELETE FROM user_settings
            WHERE setting_key IN (
                'cpb_facebook_page_id',
                'cpb_facebook_access_token',
                'cpb_facebook_page_name',
                'cpb_facebook_config'
            )
        `);

        console.log(`✅ Deleted ${result.rowCount} Facebook settings`);
        console.log('Now try reconnecting Facebook in the admin panel');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

clearFacebookTokens();
