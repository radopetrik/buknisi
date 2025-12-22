-- Seed sub-categories
-- Kaderníctvo
INSERT INTO sub_categories (category_id, name, slug, ordering)
VALUES 
((SELECT id FROM categories WHERE slug = 'kadernictvo'), 'Pánske', 'panske-kadernictvo', 10),
((SELECT id FROM categories WHERE slug = 'kadernictvo'), 'Dámske', 'damske-kadernictvo', 20),
((SELECT id FROM categories WHERE slug = 'kadernictvo'), 'Detské', 'detske-kadernictvo', 30)
ON CONFLICT (slug) DO NOTHING;

-- Kozmetika
INSERT INTO sub_categories (category_id, name, slug, ordering)
VALUES 
((SELECT id FROM categories WHERE slug = 'kozmetika'), 'Pleťové ošetrenia', 'pletove-osetrenia', 10),
((SELECT id FROM categories WHERE slug = 'kozmetika'), 'Depilácia', 'depilacia', 20),
((SELECT id FROM categories WHERE slug = 'kozmetika'), 'Líčenie', 'licenie', 30)
ON CONFLICT (slug) DO NOTHING;

-- Masáže
INSERT INTO sub_categories (category_id, name, slug, ordering)
VALUES 
((SELECT id FROM categories WHERE slug = 'masaze'), 'Klasická masáž', 'klasicka-masaz', 10),
((SELECT id FROM categories WHERE slug = 'masaze'), 'Športová masáž', 'sportova-masaz', 20),
((SELECT id FROM categories WHERE slug = 'masaze'), 'Relaxačná masáž', 'relaxacna-masaz', 30),
((SELECT id FROM categories WHERE slug = 'masaze'), 'Thajská masáž', 'thajska-masaz', 40)
ON CONFLICT (slug) DO NOTHING;

-- Manikúra a pedikúra
INSERT INTO sub_categories (category_id, name, slug, ordering)
VALUES 
((SELECT id FROM categories WHERE slug = 'manikura-pedikura'), 'Manikúra', 'manikura', 10),
((SELECT id FROM categories WHERE slug = 'manikura-pedikura'), 'Pedikúra', 'pedikura', 20)
ON CONFLICT (slug) DO NOTHING;
