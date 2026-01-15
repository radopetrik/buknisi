-- Add company_extra_categories join table

CREATE TABLE IF NOT EXISTS company_extra_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT company_extra_categories_unique UNIQUE (company_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_company_extra_categories_company ON company_extra_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_company_extra_categories_category ON company_extra_categories(category_id);
