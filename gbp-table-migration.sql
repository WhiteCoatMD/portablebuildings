-- Create google_business_connections table for Google Business Profile OAuth integration
-- Run this SQL in your Vercel Postgres dashboard: https://vercel.com/dashboard > Your Project > Storage > Your Database > Query

CREATE TABLE IF NOT EXISTS google_business_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    account_id VARCHAR(255),
    account_name VARCHAR(255),
    location_id VARCHAR(255),
    location_name VARCHAR(255),
    location_address TEXT,
    is_active BOOLEAN DEFAULT true,
    last_post_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_business_user_id
ON google_business_connections(user_id);
