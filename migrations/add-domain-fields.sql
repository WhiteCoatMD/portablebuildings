-- Add domain and subdomain fields to users table
-- Run this migration on your PostgreSQL database

ALTER TABLE users ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(100);

-- Create index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_users_subdomain ON users(subdomain);
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);

-- Generate subdomains for existing users based on business_name
-- This will create URL-friendly subdomains
UPDATE users
SET subdomain = LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
))
WHERE subdomain IS NULL AND business_name IS NOT NULL;

-- For users without business_name, use email prefix
UPDATE users
SET subdomain = LOWER(SPLIT_PART(email, '@', 1))
WHERE subdomain IS NULL;

-- Add uniqueness check - if duplicate subdomains, append user ID
UPDATE users u1
SET subdomain = subdomain || '-' || id::TEXT
WHERE EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.subdomain = u1.subdomain
    AND u2.id < u1.id
);
