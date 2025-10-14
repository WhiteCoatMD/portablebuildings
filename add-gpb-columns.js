/**
 * Migration Script - Add GPB Credential Columns
 * Adds gpb_username, gpb_password_encrypted, and auto_sync_enabled to users table
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function addGpbColumns() {
    console.log('🔧 Adding GPB credential columns to users table...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    await client.connect();

    try {
        // Check if columns already exist
        const checkColumns = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('gpb_username', 'gpb_password_encrypted', 'auto_sync_enabled')
        `);

        const existingColumns = checkColumns.rows.map(r => r.column_name);
        console.log('Existing GPB columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'none');

        // Add gpb_username if it doesn't exist
        if (!existingColumns.includes('gpb_username')) {
            console.log('Adding gpb_username column...');
            await client.query(`
                ALTER TABLE users
                ADD COLUMN gpb_username VARCHAR(255)
            `);
            console.log('✅ gpb_username column added');
        } else {
            console.log('✓ gpb_username column already exists');
        }

        // Add gpb_password_encrypted if it doesn't exist
        if (!existingColumns.includes('gpb_password_encrypted')) {
            console.log('Adding gpb_password_encrypted column...');
            await client.query(`
                ALTER TABLE users
                ADD COLUMN gpb_password_encrypted TEXT
            `);
            console.log('✅ gpb_password_encrypted column added');
        } else {
            console.log('✓ gpb_password_encrypted column already exists');
        }

        // Add auto_sync_enabled if it doesn't exist
        if (!existingColumns.includes('auto_sync_enabled')) {
            console.log('Adding auto_sync_enabled column...');
            await client.query(`
                ALTER TABLE users
                ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ auto_sync_enabled column added');
        } else {
            console.log('✓ auto_sync_enabled column already exists');
        }

        console.log('\n🎉 Migration complete!');
        console.log('Users table now supports storing GPB Sales credentials per user.\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

addGpbColumns()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
