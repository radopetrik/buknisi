
-- 01_companies.sql
-- Insert 10 realistic test companies with creative data + 100 generated ones

-- 1. Insert 10 Manual Companies
INSERT INTO companies (name, slug, category_id, city_id, email, phone, description, address_text, address_gps, is_mobile, rating, rating_count, review_rank, website, facebook, instagram)
VALUES
-- 1. Bratislava - Kozmetika
(
    'Beauty Lounge Bratislava', 
    'beauty-lounge-bratislava', 
    (SELECT id FROM categories WHERE slug = 'kozmetika'), 
    (SELECT id FROM cities WHERE slug = 'bratislava'), 
    'info@beautylounge.sk', 
    '+421901123456', 
    'Exkluzívny kozmetický salón v srdci Bratislavy. Ponúkame komplexnú starostlivosť o pleť, anti-age ošetrenia a relaxačné procedúry.', 
    'Panská 12, Bratislava', 
    ST_SetSRID(ST_MakePoint(17.1077, 48.1444), 4326), 
    false, 
    4.9, 
    120, 
    1, 
    'https://beautylounge.sk', 
    'https://facebook.com/beautylounge', 
    'https://instagram.com/beautylounge'
),
-- 2. Košice - Barbershop
(
    'Gentleman''s Club', 
    'gentlemans-club-kosice', 
    (SELECT id FROM categories WHERE slug = 'barbershop'), 
    (SELECT id FROM cities WHERE slug = 'kosice'), 
    'booking@gentlemansclub.sk', 
    '+421902234567', 
    'Tradičný barbershop pre moderného muža. Precízne strihy, úprava brady a atmosféra starých časov.', 
    'Hlavná 45, Košice', 
    ST_SetSRID(ST_MakePoint(21.2611, 48.7164), 4326), 
    false, 
    4.8, 
    85, 
    2, 
    'https://gentlemansclub.sk', 
    NULL, 
    'https://instagram.com/gentlemansclub'
),
-- 3. Trnava - Kaderníctvo
(
    'Štúdio Vlasy od Lucky', 
    'studio-vlasy-od-lucky', 
    (SELECT id FROM categories WHERE slug = 'kadernictvo'), 
    (SELECT id FROM cities WHERE slug = 'trnava'), 
    'lucka@vlasy.sk', 
    '+421903345678', 
    'Kreatívne kaderníctvo so zameraním na farbenie a balayage. Používame špičkovú vlasovú kozmetiku.', 
    'Štefánikova 5, Trnava', 
    ST_SetSRID(ST_MakePoint(17.5847, 48.3709), 4326), 
    false, 
    4.7, 
    42, 
    5, 
    NULL, 
    'https://facebook.com/vlasyodlucky', 
    'https://instagram.com/vlasyodlucky'
),
-- 4. Žilina - Masáže
(
    'Masáže Uzdrav', 
    'masaze-uzdrav-zilina', 
    (SELECT id FROM categories WHERE slug = 'masaze'), 
    (SELECT id FROM cities WHERE slug = 'zilina'), 
    'recepcia@uzdrav.sk', 
    '+421904456789', 
    'Profesionálne masáže a fyzioterapia. Pomáhame pri bolestiach chrbta a pohybového aparátu.', 
    'Národná 10, Žilina', 
    ST_SetSRID(ST_MakePoint(18.7408, 49.2232), 4326), 
    false, 
    5.0, 
    15, 
    3, 
    'https://uzdrav.sk', 
    NULL, 
    NULL
),
-- 5. Nitra - Manikúra
(
    'Nechty Perfect', 
    'nechty-perfect-nitra', 
    (SELECT id FROM categories WHERE slug = 'manikura-pedikura'), 
    (SELECT id FROM cities WHERE slug = 'nitra'), 
    'objednavky@nechtyperfect.sk', 
    '+421905567890', 
    'Gélové nechty, manikúra a pedikúra. Vždy sledujeme najnovšie trendy v nechtovom dizajne.', 
    'Farská 8, Nitra', 
    ST_SetSRID(ST_MakePoint(18.0855, 48.3128), 4326), 
    false, 
    4.5, 
    60, 
    8, 
    NULL, 
    'https://facebook.com/nechtyperfect', 
    'https://instagram.com/nechtyperfect'
),
-- 6. Banská Bystrica - Fyzioterapia (Mobilná)
(
    'Fyzio Domov', 
    'fyzio-domov-bb', 
    (SELECT id FROM categories WHERE slug = 'fyzioterapia'), 
    (SELECT id FROM cities WHERE slug = 'banska-bystrica'), 
    'info@fyziodomov.sk', 
    '+421906678901', 
    'Mobilná fyzioterapia priamo u vás doma. Rehabilitácia po úrazoch a operáciách v pohodlí domova.', 
    NULL, 
    ST_SetSRID(ST_MakePoint(19.1462, 48.7363), 4326), 
    true, 
    4.9, 
    25, 
    4, 
    'https://fyziodomov.sk', 
    NULL, 
    NULL
),
-- 7. Prešov - Obočie a mihalnice
(
    'Lash Studio Glamour', 
    'lash-studio-glamour', 
    (SELECT id FROM categories WHERE slug = 'obocie-a-mihalnice'), 
    (SELECT id FROM cities WHERE slug = 'presov'), 
    'studio@glamour.sk', 
    '+421907789012', 
    'Špecializované štúdio na predlžovanie mihalníc a lamináciu obočia. Zvýraznite svoju prirodzenú krásu.', 
    'Hlavná 102, Prešov', 
    ST_SetSRID(ST_MakePoint(21.2407, 49.0017), 4326), 
    false, 
    4.6, 
    33, 
    6, 
    NULL, 
    'https://facebook.com/glamourpo', 
    'https://instagram.com/glamourpo'
),
-- 8. Trenčín - Služby pre zvieratá
(
    'Psí Salón Havko', 
    'psi-salon-havko', 
    (SELECT id FROM categories WHERE slug = 'sluzby-pre-zvierata'), 
    (SELECT id FROM cities WHERE slug = 'trencin'), 
    'info@havko.sk', 
    '+421908890123', 
    'Kompletná starostlivosť o srsť vašich miláčikov. Strihanie, kúpanie a trimovanie psov všetkých plemien.', 
    'Mierové námestie 20, Trenčín', 
    ST_SetSRID(ST_MakePoint(18.0436, 48.8945), 4326), 
    false, 
    4.9, 
    90, 
    7, 
    'https://havko.sk', 
    'https://facebook.com/havko', 
    NULL
),
-- 9. Martin - Barbershop
(
    'Old School Barber', 
    'old-school-barber-martin', 
    (SELECT id FROM categories WHERE slug = 'barbershop'), 
    (SELECT id FROM cities WHERE slug = 'martin'), 
    'rezervacie@oldschool.sk', 
    '+421909901234', 
    'Klasické holičstvo v Martine. Hot towel shave, precízne strihy a kvalitná kozmetika.', 
    'M. R. Štefánika 7, Martin', 
    ST_SetSRID(ST_MakePoint(18.9240, 49.0650), 4326), 
    false, 
    4.7, 
    55, 
    9, 
    NULL, 
    NULL, 
    'https://instagram.com/oldschoolbarber'
),
-- 10. Poprad - Masáže (Wellness)
(
    'Zen Masáže & Wellness', 
    'zen-masaze-poprad', 
    (SELECT id FROM categories WHERE slug = 'masaze'), 
    (SELECT id FROM cities WHERE slug = 'poprad'), 
    'relax@zenpoprad.sk', 
    '+421910012345', 
    'Oáza pokoja pod Tatrami. Relaxačné, športové masáže a bankovanie. Príďte si oddýchnuť.', 
    'Námestie sv. Egídia 15, Poprad', 
    ST_SetSRID(ST_MakePoint(20.3003, 49.0560), 4326), 
    false, 
    4.8, 
    18, 
    10, 
    'https://zenpoprad.sk', 
    NULL, 
    NULL
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Generate 100 more random companies
WITH 
  generated_data AS (
    SELECT 
      i,
      (SELECT id FROM categories ORDER BY random() LIMIT 1) as cat_id,
      (SELECT id FROM cities ORDER BY random() LIMIT 1) as city_id
    FROM generate_series(11, 110) i
  ),
  company_details AS (
    SELECT 
      gd.i,
      gd.cat_id,
      gd.city_id,
      c.name as cat_name,
      ci.name as city_name,
      ci.slug as city_slug,
      (random() > 0.8) as is_mobile
    FROM generated_data gd
    JOIN categories c ON gd.cat_id = c.id
    JOIN cities ci ON gd.city_id = ci.id
  )
INSERT INTO companies (
    name, 
    slug, 
    category_id, 
    city_id, 
    email, 
    phone, 
    description, 
    address_text, 
    address_gps, 
    is_mobile, 
    rating, 
    rating_count, 
    review_rank,
    website,
    facebook,
    instagram
)
SELECT 
    CASE 
      WHEN cat_name = 'Kaderníctvo' THEN (ARRAY['Salón', 'Štúdio', 'Kaderníctvo'])[floor(random()*3+1)] || ' ' || (ARRAY['Elegancia', 'Štýl', 'Vlasy', 'Art', 'Design', 'Glamour', 'Trend'])[floor(random()*7+1)] || ' ' || i
      WHEN cat_name = 'Barbershop' THEN (ARRAY['Barber', 'Gentleman', 'Pánsky', 'Old School'])[floor(random()*4+1)] || ' ' || (ARRAY['Club', 'Shop', 'House', 'Room', 'Garage', 'Station'])[floor(random()*6+1)] || ' ' || i
      WHEN cat_name = 'Kozmetika' THEN (ARRAY['Kozmetika', 'Beauty', 'Salón Krásy', 'Pleťové Štúdio'])[floor(random()*4+1)] || ' ' || (ARRAY['Vital', 'Glow', 'Natural', 'Pure', 'Skin', 'Care'])[floor(random()*6+1)] || ' ' || i
      WHEN cat_name = 'Masáže' THEN (ARRAY['Masáže', 'Fyzio', 'Relax', 'Wellness'])[floor(random()*4+1)] || ' ' || (ARRAY['Zdravie', 'Pohoda', 'Dotyk', 'Harmony', 'Balance', 'Vitality'])[floor(random()*6+1)] || ' ' || i
      WHEN cat_name = 'Manikúra a pedikúra' THEN (ARRAY['Nechty', 'Nails', 'Manikúra', 'Pedikúra'])[floor(random()*4+1)] || ' ' || (ARRAY['Perfect', 'Shine', 'Art', 'Studio', 'Pro'])[floor(random()*5+1)] || ' ' || i
      WHEN cat_name = 'Služby pre zvieratá' THEN (ARRAY['Psí Salón', 'Salón pre psov', 'Strihanie psov', 'Havko'])[floor(random()*4+1)] || ' ' || (ARRAY['Rex', 'Labka', 'Chlpáč', 'Kamaráti'])[floor(random()*4+1)] || ' ' || i
      ELSE 'Firma ' || cat_name || ' ' || i
    END as name,
    'firma-' || i || '-' || substr(md5(random()::text), 1, 6) as slug,
    cat_id,
    city_id,
    'info' || i || '@test.buknisi.sk',
    '+4219' || floor(random() * 89 + 10)::text || floor(random() * 899999 + 100000)::text,
    'Profesionálne služby v oblasti ' || cat_name || '. Individuálny prístup a spokojnosť zákazníka sú pre nás prioritou. Nájdete nás v meste ' || city_name || '.',
    CASE WHEN is_mobile THEN NULL ELSE 'Ulica ' || (ARRAY['Mierová', 'Hlavná', 'Štúrova', 'Slovenská', 'Nová', 'Dlhá', 'Krátka', 'Zelená'])[floor(random()*8+1)] || ' ' || floor(random()*100+1)::int || ', ' || city_name END,
    ST_SetSRID(ST_MakePoint(17.0 + random() * 4.0, 48.0 + random() * 1.5), 4326),
    is_mobile,
    (floor(random() * 20 + 30)::numeric / 10), -- 3.0 to 5.0
    floor(random() * 100)::int,
    floor(random() * 100)::int,
    CASE WHEN random() > 0.5 THEN 'https://firma' || i || '.sk' ELSE NULL END,
    CASE WHEN random() > 0.3 THEN 'https://facebook.com/firma' || i ELSE NULL END,
    CASE WHEN random() > 0.3 THEN 'https://instagram.com/firma' || i ELSE NULL END
FROM company_details
ON CONFLICT (slug) DO NOTHING;
