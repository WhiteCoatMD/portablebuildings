-- Migration: Create customer lead management system
-- Tracks customer inquiries, follow-ups, and sales pipeline

-- Main leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),

    -- Lead details
    building_serial VARCHAR(50), -- Optional: which building they're interested in
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, quoted, sold, lost
    source VARCHAR(100), -- website, facebook, phone, walk-in, referral
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high

    -- Follow-up tracking
    next_follow_up_date DATE,
    last_contacted_at TIMESTAMP,

    -- Financial
    quoted_amount DECIMAL(10,2),
    sold_amount DECIMAL(10,2),

    -- Additional info
    notes TEXT,
    lost_reason VARCHAR(255), -- Only filled if status = 'lost'

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead activity history - tracks all interactions
CREATE TABLE IF NOT EXISTS lead_activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- note, call, email, quote_sent, status_change, reminder
    description TEXT NOT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb, -- Store additional data (old_status, new_status, etc.)

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_building_serial ON leads(building_serial);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);

-- Update timestamp trigger for leads
CREATE OR REPLACE FUNCTION update_leads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_timestamp
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_timestamp();

-- Trigger to auto-create activity when lead status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO lead_activities (lead_id, user_id, activity_type, description, metadata)
        VALUES (
            NEW.id,
            NEW.user_id,
            'status_change',
            'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- Trigger to log initial lead creation
CREATE OR REPLACE FUNCTION log_lead_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lead_activities (lead_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.id,
        NEW.user_id,
        'note',
        'Lead created from ' || COALESCE(NEW.source, 'unknown source'),
        jsonb_build_object('source', NEW.source)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_creation
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_creation();
