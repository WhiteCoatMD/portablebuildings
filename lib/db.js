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
            // Serverless-optimized settings
            max: 1, // Maximum number of clients in the pool (keep low for serverless)
            idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
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
