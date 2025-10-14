-- Migration: Add GPB Sales credentials to users table
-- This allows automated syncing per user

ALTER TABLE users
ADD COLUMN IF NOT EXISTS gpb_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS gpb_password_encrypted TEXT,
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;

-- Create index for finding users with auto-sync enabled
CREATE INDEX IF NOT EXISTS idx_users_auto_sync ON users(auto_sync_enabled) WHERE auto_sync_enabled = TRUE;
