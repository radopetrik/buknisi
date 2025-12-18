
-- 01_company_amenities.sql
-- Randomly assign amenities to companies

INSERT INTO company_amenities (company_id, amenity_id)
SELECT 
    c.id,
    a.id
FROM companies c
CROSS JOIN amenities a
WHERE random() > 0.5 -- 50% chance for each company to have each amenity
ON CONFLICT (company_id, amenity_id) DO NOTHING;
