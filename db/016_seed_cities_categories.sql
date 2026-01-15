-- Seed 10 largest cities in Slovakia
INSERT INTO public.cities (name, slug) VALUES
('Bratislava', 'bratislava'),
('Košice', 'kosice'),
('Prešov', 'presov'),
('Žilina', 'zilina'),
('Nitra', 'nitra'),
('Banská Bystrica', 'banska-bystrica'),
('Trnava', 'trnava'),
('Trenčín', 'trencin'),
('Martin', 'martin'),
('Poprad', 'poprad')
ON CONFLICT (slug) DO NOTHING;

-- Seed categories from image (Slovak)
-- image_url is optional (icons can be managed later)
INSERT INTO public.categories (name, slug, ordering, image_url) VALUES
('Kaderníctvo', 'kadernictvo', 10, NULL),
('Barbershop', 'barbershop', 20, NULL),
('Kozmetika', 'kozmetika', 30, NULL),
('Manikúra a pedikúra', 'manikura-pedikura', 40, NULL),
('Fyzioterapia', 'fyzioterapia', 50, NULL),
('Obočie a mihalnice', 'obocie-a-mihalnice', 60, NULL),
('Masáže', 'masaze', 70, NULL),
('Služby pre zvieratá', 'sluzby-pre-zvierata', 80, NULL)
ON CONFLICT (slug) DO NOTHING;
