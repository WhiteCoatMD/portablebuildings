-- Migration: Add user contact and location fields
-- This migration adds new fields to the users table for enhanced user profiles

-- Add new contact fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS best_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_hours JSONB DEFAULT '{}'::jsonb;

-- Update timestamp
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE full_name IS NULL;
