const { getPool } = require('./lib/db');

async function findPatriotSync() {
    const pool = getPool();
    
    try {
        // Get user info
        const userResult = await pool.query(
            `SELECT id, email, business_name FROM users WHERE email = 'sales@patriotbuildingsales.com'`
        );
        
        if (userResult.rows.length === 0) {
            console.log('User not found');
            return;
        }
        
        const user = userResult.rows[0];
        console.log('User ID:', user.id);
        console.log('Email:', user.email);
        console.log('Business:', user.business_name);
        
        // Get GPB settings
        const settingsResult = await pool.query(
            `SELECT setting_key, setting_value FROM user_settings 
             WHERE user_id = $1 AND setting_key LIKE '%gpb%'`,
            [user.id]
        );
        
        console.log('\nGPB Settings:');
        settingsResult.rows.forEach(row => {
            console.log(`  ${row.setting_key}: ${row.setting_value}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

findPatriotSync();
