-- Add image_url to categories (for category icons)

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS image_url text;
