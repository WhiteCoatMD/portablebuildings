-- Create demo_leads table for ShedSync demo requests
CREATE TABLE IF NOT EXISTS demo_leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_demo_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demo_leads_updated_at
    BEFORE UPDATE ON demo_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_demo_leads_updated_at();

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_demo_leads_status ON demo_leads(status);
CREATE INDEX IF NOT EXISTS idx_demo_leads_created_at ON demo_leads(created_at DESC);
