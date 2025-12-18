
-- 03_service_categories.sql
-- Generate service categories for companies

INSERT INTO service_categories (company_id, name)
SELECT 
    c.id,
    cat_name
FROM companies c
CROSS JOIN LATERAL (
    SELECT UNNEST(
        CASE
            WHEN c.name LIKE '%Kozmetika%' OR c.name LIKE '%Beauty%' THEN ARRAY['Pleťové ošetrenia', 'Obočie a riasy', 'Depilácia']
            WHEN c.name LIKE '%Barber%' OR c.name LIKE '%Gentleman%' THEN ARRAY['Strihy', 'Úprava brady', 'Balíčky']
            WHEN c.name LIKE '%Vlasy%' OR c.name LIKE '%Kaderníctvo%' THEN ARRAY['Strihy', 'Farbenie', 'Styling']
            WHEN c.name LIKE '%Masáže%' OR c.name LIKE '%Fyzio%' OR c.name LIKE '%Uzdrav%' THEN ARRAY['Masáže', 'Terapie', 'Rehabilitácia']
            WHEN c.name LIKE '%Nechty%' OR c.name LIKE '%Manikúra%' THEN ARRAY['Manikúra', 'Pedikúra', 'Gélové nechty']
            WHEN c.name LIKE '%Psí%' OR c.name LIKE '%Havko%' THEN ARRAY['Kúpanie', 'Strihanie', 'Trimovanie']
            ELSE ARRAY['Hlavné služby', 'Doplnkové služby', 'Špeciálne ponuky']
        END
    ) as cat_name
) as categories
ON CONFLICT (company_id, name) DO NOTHING;
