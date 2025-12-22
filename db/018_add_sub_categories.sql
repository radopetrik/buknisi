-- Add sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  ordering integer NOT NULL DEFAULT 0,
  CONSTRAINT sub_categories_category_name_unique UNIQUE (category_id, name)
);

-- Add index for slug
CREATE INDEX IF NOT EXISTS idx_sub_categories_slug ON sub_categories(slug);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);

-- Add sub_category_id to companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS sub_category_id uuid REFERENCES sub_categories(id) ON DELETE SET NULL;

-- Add index for companies sub_category
CREATE INDEX IF NOT EXISTS idx_companies_sub_category ON companies(sub_category_id);
