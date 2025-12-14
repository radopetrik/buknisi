-- Add slug columns to lookup tables and backfill existing data
ALTER TABLE cities ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug text;

-- Backfill cities
UPDATE cities
SET slug = trim(both '-' FROM lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi')))
WHERE slug IS NULL;

-- Ensure unique city slugs by appending a hash when necessary
WITH duplicates AS (
  SELECT id,
         slug,
         row_number() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM cities
  WHERE slug IS NOT NULL
)
UPDATE cities AS c
SET slug = c.slug || '-' || left(replace(c.id::text, '-', ''), 6)
FROM duplicates d
WHERE c.id = d.id
  AND d.rn > 1;

ALTER TABLE cities
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT cities_slug_unique UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);

-- Backfill categories
UPDATE categories
SET slug = trim(both '-' FROM lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi')))
WHERE slug IS NULL;

WITH category_duplicates AS (
  SELECT id,
         slug,
         row_number() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM categories
  WHERE slug IS NOT NULL
)
UPDATE categories AS c
SET slug = c.slug || '-' || left(replace(c.id::text, '-', ''), 6)
FROM category_duplicates d
WHERE c.id = d.id
  AND d.rn > 1;

ALTER TABLE categories
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
