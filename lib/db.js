/**
 * Shared Database Connection Pool
 * Optimized for serverless environments (Vercel)
 */

const { Pool } = require('pg');

// Create a single shared pool instance
// This will be reused across multiple function invocations
let pool = null;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
            ssl: {
                rejectUnauthorized: false
            },
            // Serverless-optimized settings for Vercel
            // Note: Each serverless function instance gets its own pool
            // Multiple concurrent requests to same instance share this pool
            max: 10, // Allow up to 10 concurrent connections per serverless instance
            min: 0, // Don't keep idle connections
            idleTimeoutMillis: 10000, // Close idle clients after 10 seconds (aggressive cleanup)
            connectionTimeoutMillis: 5000, // Wait 5 seconds for connection
            allowExitOnIdle: true // Allow process to exit if all clients are idle
        });

        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected database error:', err);
        });
    }

    return pool;
}

module.exports = { getPool };
