
-- 03_services_addons.sql
-- Generate addons and link them to services

INSERT INTO addons (
    company_id,
    name,
    price,
    duration,
    description
)
SELECT 
    c.id,
    CASE
        WHEN c.name LIKE '%Kozmetika%' OR c.name LIKE '%Beauty%' THEN (ARRAY['Kolagénová maska', 'Masáž rúk', 'Ampulka vitamínov', 'Farbenie obočia'])[floor(random()*4+1)]
        WHEN c.name LIKE '%Barber%' OR c.name LIKE '%Gentleman%' THEN (ARRAY['Masáž hlavy', 'Čierna maska', 'Voskovanie nosa', 'Parna kúpeľ'])[floor(random()*4+1)]
        WHEN c.name LIKE '%Vlasy%' OR c.name LIKE '%Kaderníctvo%' THEN (ARRAY['Kúra Olaplex', 'Masáž hlavy', 'Extra styling', 'Vlasová maska'])[floor(random()*4+1)]
        WHEN c.name LIKE '%Masáže%' OR c.name LIKE '%Fyzio%' OR c.name LIKE '%Uzdrav%' THEN (ARRAY['Tejpovanie', 'Lávové kamene', 'Aromaterapia', 'Rašelinový zábal'])[floor(random()*4+1)]
        WHEN c.name LIKE '%Nechty%' OR c.name LIKE '%Manikúra%' THEN (ARRAY['Parafínový zábal', 'Nail Art', 'Oprava nechtu', 'Peeling rúk'])[floor(random()*4+1)]
        WHEN c.name LIKE '%Lash%' OR c.name LIKE '%Mihalnice%' THEN (ARRAY['Výživa mihalníc', 'Farbenie spodných rias', 'Hydrogélová podložka', 'Kefka zdarma'])[floor(random()*4+1)]
        WHEN c.name LIKE '%Psí%' OR c.name LIKE '%Havko%' THEN (ARRAY['Čistenie uší', 'Strihanie pazúrikov', 'Parfum pre psov', 'Mašlička'])[floor(random()*4+1)]
        ELSE (ARRAY['Extra starostlivosť', 'Konzultácia naviac', 'Prémiový produkt', 'Darčekové balenie'])[floor(random()*4+1)]
    END || ' ' || s.idx,
    (floor(random() * 20 + 5))::numeric, -- 5 to 25 EUR
    (floor(random() * 3 + 1) * 10)::int, -- 10, 20, 30 mins
    'Doplnková služba pre ešte lepší zážitok.'
FROM companies c
CROSS JOIN generate_series(1, floor(random() * 2 + 1)::int) s(idx) -- 1 to 2 addons per company
ON CONFLICT (company_id, name) DO NOTHING;

-- Link addons to services (randomly)
INSERT INTO service_addons (service_id, addon_id)
SELECT 
    s.id,
    a.id
FROM services s
JOIN addons a ON s.company_id = a.company_id
WHERE random() > 0.3 -- 70% chance to link an addon to a service
ON CONFLICT (service_id, addon_id) DO NOTHING;
