/**
 * Create test account for Facebook App Review
 * Email: test@facebook.com
 * Password: TestApp
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTestAccount() {
    try {
        const email = 'test@facebook.com';
        const password = 'TestApp';
        const businessName = 'Test Portable Buildings';
        const phone = '555-123-4567';
        const address = '123 Test Street, Test City, LA 71201';

        console.log('Creating Facebook test account...');

        // Check if account already exists
        const existingUser = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            console.log('⚠️  Test account already exists!');
            console.log('   Updating password...');

            const hashedPassword = await bcrypt.hash(password, 10);

            await pool.query(
                `UPDATE users
                 SET password_hash = $1,
                     subscription_status = 'active',
                     subscription_plan = 'monthly',
                     trial_ends_at = NOW() + INTERVAL '90 days',
                     updated_at = NOW()
                 WHERE email = $2`,
                [hashedPassword, email]
            );

            console.log('✅ Test account password updated!');
            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('📋 FACEBOOK TEST ACCOUNT CREDENTIALS');
            console.log('═══════════════════════════════════════════');
            console.log('Email:    test@facebook.com');
            console.log('Password: TestApp');
            console.log('Status:   Active (90-day trial)');
            console.log('═══════════════════════════════════════════');
            console.log('');
            console.log('🔗 Login URL: https://shed-sync.com/login.html');
            console.log('');

            await pool.end();
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the test account
        const result = await pool.query(
            `INSERT INTO users (
                email,
                password_hash,
                business_name,
                full_name,
                phone,
                address,
                subscription_status,
                subscription_plan,
                trial_ends_at,
                subdomain,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '90 days', $9, NOW(), NOW())
            RETURNING id, email, business_name`,
            [
                email,
                hashedPassword,
                businessName,
                'Facebook Test User',
                phone,
                address,
                'active',
                'monthly',
                'facebook-test'
            ]
        );

        const user = result.rows[0];

        console.log('✅ Facebook test account created successfully!');
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('📋 FACEBOOK TEST ACCOUNT CREDENTIALS');
        console.log('═══════════════════════════════════════════');
        console.log('Email:         test@facebook.com');
        console.log('Password:      TestApp');
        console.log('Business Name: Test Portable Buildings');
        console.log('Subdomain:     facebook-test.shed-sync.com');
        console.log('Status:        Active (90-day trial)');
        console.log('User ID:       ' + user.id);
        console.log('═══════════════════════════════════════════');
        console.log('');
        console.log('🔗 Login URL:   https://shed-sync.com/login.html');
        console.log('🌐 Test Site:   https://facebook-test.shed-sync.com');
        console.log('');

        // Add some sample inventory data
        console.log('📦 Adding sample inventory...');

        await pool.query(
            `INSERT INTO user_inventory (
                user_id,
                serial_number,
                type_code,
                type_name,
                title,
                size_display,
                width,
                length,
                price,
                rto36,
                rto48,
                rto60,
                location,
                is_repo,
                auto_status,
                created_at,
                updated_at
            ) VALUES
            ($1, 'TEST001', 'UB', 'Utility Barn', '10x12 Utility Barn', '10x12', 10, 12, 3500, 125, 105, 95, 'Main Lot', false, 'available', NOW(), NOW()),
            ($1, 'TEST002', 'LB', 'Lofted Barn', '12x24 Lofted Barn', '12x24', 12, 24, 6800, 245, 205, 185, 'Main Lot', false, 'available', NOW(), NOW()),
            ($1, 'TEST003', 'CB', 'Cabin', '12x32 Cabin', '12x32', 12, 32, 12500, 450, 375, 340, 'Main Lot', false, 'available', NOW(), NOW())`,
            [user.id]
        );

        console.log('✅ Added 3 sample buildings to test inventory');
        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('📝 INSTRUCTIONS FOR FACEBOOK REVIEWERS');
        console.log('═══════════════════════════════════════════');
        console.log('1. Visit: https://shed-sync.com/login.html');
        console.log('2. Login with the credentials above');
        console.log('3. Navigate to "Site Customization" tab');
        console.log('4. Scroll to "Facebook Auto-Posting" section');
        console.log('5. Click "Connect with Facebook" button');
        console.log('6. Authorize ShedSync to access your Facebook page');
        console.log('7. Test the auto-posting feature');
        console.log('═══════════════════════════════════════════');

    } catch (error) {
        console.error('❌ Error creating test account:', error.message);
    } finally {
        await pool.end();
    }
}

createTestAccount();
