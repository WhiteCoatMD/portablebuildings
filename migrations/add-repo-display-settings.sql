-- Add repo display settings to users table
-- This allows dealers to customize how repo/preowned buildings are displayed

ALTER TABLE users
ADD COLUMN IF NOT EXISTS repo_sort_order TEXT DEFAULT 'last', -- 'first' or 'last'
ADD COLUMN IF NOT EXISTS repo_price_display TEXT DEFAULT 'strikethrough'; -- 'strikethrough' or 'discounted'

-- Update existing users to have default values
UPDATE users
SET repo_sort_order = 'last',
    repo_price_display = 'strikethrough'
WHERE repo_sort_order IS NULL OR repo_price_display IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.repo_sort_order IS 'Determines if repo buildings appear first or last in inventory list';
COMMENT ON COLUMN users.repo_price_display IS 'Determines if repo prices show as strikethrough with CTA or with discount applied';
