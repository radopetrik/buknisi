
-- 03_services.sql
-- Generate random services for test companies

INSERT INTO services (
    company_id,
    name,
    price,
    duration,
    price_type,
    is_mobile,
    service_category_id
)
SELECT 
    c.id,
    CASE
        WHEN c.name LIKE '%Kozmetika%' OR c.name LIKE '%Beauty%' THEN (ARRAY['Čistenie pleti', 'Anti-age kúra', 'Masáž tváre', 'Depilácia', 'Laminácia obočia'])[floor(random()*5+1)]
        WHEN c.name LIKE '%Barber%' OR c.name LIKE '%Gentleman%' THEN (ARRAY['Pánsky strih', 'Úprava brady', 'Hot Towel Shave', 'Komplet servis', 'Strih strojčekom'])[floor(random()*5+1)]
        WHEN c.name LIKE '%Vlasy%' OR c.name LIKE '%Kaderníctvo%' THEN (ARRAY['Dámsky strih', 'Farbenie', 'Melír', 'Balayage', 'Fúkaná'])[floor(random()*5+1)]
        WHEN c.name LIKE '%Masáže%' OR c.name LIKE '%Fyzio%' OR c.name LIKE '%Uzdrav%' THEN (ARRAY['Klasická masáž', 'Reflexná masáž', 'Bankovanie', 'Fyzioterapia', 'Lymfodrenáž'])[floor(random()*5+1)]
        WHEN c.name LIKE '%Nechty%' OR c.name LIKE '%Manikúra%' THEN (ARRAY['Gélové nechty', 'Gél lak', 'Klasická manikúra', 'Pedikúra', 'Japonská manikúra'])[floor(random()*5+1)]
        WHEN c.name LIKE '%Lash%' OR c.name LIKE '%Mihalnice%' THEN (ARRAY['3D Mihalnice', 'Klasické mihalnice', 'Lash Lift', 'Laminácia obočia', 'Farbenie mihalníc'])[floor(random()*5+1)]
        WHEN c.name LIKE '%Psí%' OR c.name LIKE '%Havko%' THEN (ARRAY['Strihanie psa', 'Kúpanie', 'Trimovanie', 'Vyčesávanie', 'Strihanie pazúrikov'])[floor(random()*5+1)]
        ELSE (ARRAY['Základná služba', 'Rozšírená služba', 'Prémiová služba', 'Konzultácia', 'Expres služba'])[floor(random()*5+1)]
    END || ' ' || s.idx,
    (floor(random() * 50 + 10))::numeric, -- 10 to 60 EUR
    (floor(random() * 3 + 1) * 30)::int, -- 30, 60, 90 mins
    'fixed'::price_type,
    c.is_mobile,
    (SELECT id FROM service_categories WHERE company_id = c.id ORDER BY random() LIMIT 1)
FROM companies c
CROSS JOIN generate_series(1, floor(random() * 3 + 3)::int) s(idx) -- 3 to 5 services
ON CONFLICT (company_id, name) DO NOTHING;

-- Link all services to all staff in the same company
INSERT INTO staff_services (staff_id, service_id)
SELECT s.id, sv.id
FROM staff s
JOIN services sv ON s.company_id = sv.company_id
ON CONFLICT DO NOTHING;
