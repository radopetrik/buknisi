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
INSERT INTO public.categories (name, slug, ordering) VALUES
('Kaderníctvo', 'kadernictvo', 10),
('Barbershop', 'barbershop', 20),
('Kozmetika', 'kozmetika', 30),
('Manikúra a pedikúra', 'manikura-pedikura', 40),
('Fyzioterapia', 'fyzioterapia', 50),
('Obočie a mihalnice', 'obocie-a-mihalnice', 60),
('Masáže', 'masaze', 70),
('Služby pre zvieratá', 'sluzby-pre-zvierata', 80)
ON CONFLICT (slug) DO NOTHING;
