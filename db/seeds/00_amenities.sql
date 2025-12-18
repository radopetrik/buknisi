
-- 00_amenities.sql
-- Seed base amenities

INSERT INTO amenities (name, icon) VALUES
('Wifi', 'wifi'),
('Parkovanie', 'parking-circle'),
('Klimatizácia', 'snowflake'),
('Bezbariérový prístup', 'accessibility'),
('Platba kartou', 'credit-card'),
('Občerstvenie', 'coffee'),
('Detský kútik', 'baby'),
('Pet friendly', 'dog'),
('Rezervácia online', 'calendar-check'),
('Darčekové poukážky', 'gift')
ON CONFLICT (name) DO NOTHING;
