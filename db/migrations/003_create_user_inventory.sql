-- Migration: Create user-specific inventory table
-- Each user has their own inventory stored in the database

CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    serial_number VARCHAR(50) NOT NULL,

    -- Building details from decoder
    type_code VARCHAR(10),
    type_name VARCHAR(100),
    title VARCHAR(255),
    size_display VARCHAR(50),
    width INTEGER,
    length INTEGER,
    date_built VARCHAR(50),

    -- Pricing
    price DECIMAL(10,2),
    rto36 DECIMAL(10,2),
    rto48 DECIMAL(10,2),
    rto60 DECIMAL(10,2),
    rto72 DECIMAL(10,2),

    -- Status and location
    is_repo BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    auto_status VARCHAR(50) DEFAULT 'available',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure each user has unique serial numbers
    UNIQUE(user_id, serial_number)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_serial ON user_inventory(serial_number);
CREATE INDEX IF NOT EXISTS idx_user_inventory_type ON user_inventory(type_code);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_inventory_timestamp
    BEFORE UPDATE ON user_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_user_inventory_timestamp();
