-- Add sub_category_id to services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS sub_category_id uuid REFERENCES sub_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_sub_category ON services(sub_category_id);
