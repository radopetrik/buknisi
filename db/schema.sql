-- Schema snapshot: reflects current database structure. Update alongside migrations.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
CREATE TYPE IF NOT EXISTS day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

CREATE TYPE IF NOT EXISTS staff_role AS ENUM ('basic', 'staffer', 'reception', 'manager');

CREATE TYPE IF NOT EXISTS price_type AS ENUM ('fixed', 'free', 'dont_show', 'starts_at');

CREATE TYPE IF NOT EXISTS time_off_reason AS ENUM ('sick_day', 'vacation', 'training');

-- Lookup tables
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  ordering integer NOT NULL DEFAULT 0,
  image_url text
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);

-- Core entities
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email citext,
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES categories(id),
  address_gps geography(POINT, 4326),
  address_text text,
  description text,
  city_id uuid REFERENCES cities(id),
  review_rank integer,
  contact_phone text,
  facebook text,
  instagram text,
  website text,
  is_mobile boolean NOT NULL DEFAULT false,
  rating numeric(3, 2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  CONSTRAINT companies_email_chk CHECK (email IS NULL OR email <> ''),
  CONSTRAINT companies_facebook_url_chk CHECK (facebook IS NULL OR facebook ~ '^https?://'),
  CONSTRAINT companies_instagram_url_chk CHECK (instagram IS NULL OR instagram ~ '^https?://'),
  CONSTRAINT companies_website_url_chk CHECK (website IS NULL OR website ~ '^https?://')
);

CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT company_users_unique UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS company_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_ratings_user_company_unique UNIQUE (company_id, user_id)
);

-- Ensure company_ratings has FK to profiles
ALTER TABLE company_ratings
ADD CONSTRAINT company_ratings_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

ALTER TABLE company_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read company ratings"
  ON company_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own rating"
  ON company_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rating"
  ON company_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company members can delete company ratings"
  ON company_ratings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM company_users
      WHERE company_users.company_id = company_ratings.company_id
      AND company_users.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text
);

CREATE TABLE IF NOT EXISTS company_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  CONSTRAINT company_amenities_unique UNIQUE (company_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS company_business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  day_in_week day_of_week NOT NULL,
  from_time time NOT NULL,
  to_time time NOT NULL,
  break_from_time time,
  break_to_time time,
  CONSTRAINT company_business_hours_day_unique UNIQUE (company_id, day_in_week),
  CONSTRAINT company_business_hours_time_chk CHECK (from_time < to_time)
);

CREATE TABLE IF NOT EXISTS company_business_hours_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  message text,
  from_hour time,
  to_hour time,
  break_from time,
  break_to time,
  CONSTRAINT company_business_hours_extras_date_unique UNIQUE (company_id, date)
);

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo text,
  role staff_role NOT NULL DEFAULT 'staffer',
  position text,
  email citext,
  phone text,
  available_for_booking boolean NOT NULL DEFAULT true,
  description text
);

CREATE TABLE IF NOT EXISTS staff_time_offs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  all_day boolean NOT NULL DEFAULT false,
  day date NOT NULL,
  from_time time,
  to_time time,
  reason time_off_reason NOT NULL DEFAULT 'vacation',
  CONSTRAINT staff_time_offs_time_chk CHECK (
    (all_day AND from_time IS NULL AND to_time IS NULL) OR
    (NOT all_day AND from_time IS NOT NULL AND to_time IS NOT NULL AND from_time <= to_time)
  )
);

CREATE TABLE IF NOT EXISTS staff_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_in_week day_of_week NOT NULL,
  from_time time NOT NULL,
  to_time time NOT NULL,
  break_from_time time,
  break_to_time time,
  CONSTRAINT staff_working_hours_day_unique UNIQUE (staff_id, day_in_week),
  CONSTRAINT staff_working_hours_time_chk CHECK (from_time < to_time)
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ordering integer NOT NULL DEFAULT 0,
  url text NOT NULL,
  CONSTRAINT photos_company_order_unique UNIQUE (company_id, ordering),
  CONSTRAINT photos_url_chk CHECK (url ~ '^https?://')
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members view photos"
ON photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM company_users
    WHERE company_users.company_id = photos.company_id
      AND company_users.user_id = auth.uid()
  )
);

CREATE POLICY "Company members insert photos"
ON photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM company_users
    WHERE company_users.company_id = photos.company_id
      AND company_users.user_id = auth.uid()
  )
);

CREATE POLICY "Company members update photos"
ON photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM company_users
    WHERE company_users.company_id = photos.company_id
      AND company_users.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM company_users
    WHERE company_users.company_id = photos.company_id
      AND company_users.user_id = auth.uid()
  )
);

CREATE POLICY "Company members delete photos"
ON photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM company_users
    WHERE company_users.company_id = photos.company_id
      AND company_users.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email citext
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name text,
  last_name text,
  phone text,
  email text,
  preferred_city_id uuid REFERENCES public.cities(id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_city_id
  ON public.profiles(preferred_city_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS service_type_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type_category_id uuid REFERENCES service_type_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  CONSTRAINT service_types_unique UNIQUE (service_type_category_id, name)
);

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  CONSTRAINT service_categories_unique UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  price_type price_type NOT NULL DEFAULT 'fixed',
  service_type_id uuid REFERENCES service_types(id) ON DELETE SET NULL,
  service_category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  duration integer NOT NULL,
  is_mobile boolean NOT NULL DEFAULT false,
  photo text,
  CONSTRAINT services_unique_name_company UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS staff_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  CONSTRAINT staff_services_unique UNIQUE (staff_id, service_id)
);

CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  price numeric(12,2) NOT NULL DEFAULT 0,
  duration integer NOT NULL,
  description text,
  photo text,
  CONSTRAINT addons_unique UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  CONSTRAINT service_addons_unique UNIQUE (service_id, addon_id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  date date NOT NULL,
  time_from time NOT NULL,
  time_to time NOT NULL,
  internal_note text,
  client_note text,
  CONSTRAINT bookings_time_chk CHECK (time_from < time_to)
);

CREATE TABLE IF NOT EXISTS booking_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  CONSTRAINT booking_services_unique UNIQUE (booking_id, service_id)
);

CREATE TABLE IF NOT EXISTS booking_service_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_service_id uuid NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  count integer NOT NULL DEFAULT 1,
  CONSTRAINT booking_service_addons_unique UNIQUE (booking_service_id, addon_id)
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date date NOT NULL,
  from_time time NOT NULL,
  to_time time NOT NULL,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  description text,
  CONSTRAINT reservations_time_chk CHECK (from_time < to_time)
);

-- Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update company rating and count
CREATE OR REPLACE FUNCTION update_company_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_company_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_company_id := OLD.company_id;
  ELSE
    target_company_id := NEW.company_id;
  END IF;

  UPDATE companies
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM company_ratings
      WHERE company_id = target_company_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM company_ratings
      WHERE company_id = target_company_id
    )
  WHERE id = target_company_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for company rating changes
DROP TRIGGER IF EXISTS on_company_rating_change ON company_ratings;
CREATE TRIGGER on_company_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON company_ratings
  FOR EACH ROW EXECUTE PROCEDURE update_company_rating();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category_id);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city_id);
CREATE INDEX IF NOT EXISTS idx_company_amenities_company ON company_amenities(company_id);
CREATE INDEX IF NOT EXISTS idx_company_business_hours_company ON company_business_hours(company_id);
CREATE INDEX IF NOT EXISTS idx_staff_company ON staff(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_addons_company ON addons(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_company_date ON bookings(company_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_company_date ON reservations(company_id, date);

-- 011_enable_storage_rls.sql

-- Create the storage bucket 'company_photos' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_photos', 'company_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Company members upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Company members delete photos" ON storage.objects;

-- Policy: Allow public read access to company_photos bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'company_photos' );

-- Policy: Allow authenticated users to upload photos to their own company folder
-- Path structure: company_id/filename.ext
CREATE POLICY "Company members upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_photos' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE public.company_users.user_id = auth.uid()
      AND public.company_users.company_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Allow authenticated users to delete photos from their own company folder
CREATE POLICY "Company members delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company_photos' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE public.company_users.user_id = auth.uid()
      AND public.company_users.company_id::text = (storage.foldername(name))[1]
  )
);

-- 012_reorder_photos_func.sql

CREATE OR REPLACE FUNCTION reorder_photos(p_company_id uuid, p_photo_ids uuid[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_idx integer;
BEGIN
  -- Pass 1: Set ordering to negative values to avoid collisions
  -- using -1000 - index to be safe and far from 0
  FOR v_idx IN 1 .. array_length(p_photo_ids, 1) LOOP
    v_id := p_photo_ids[v_idx];
    UPDATE photos 
    SET ordering = -1000 - v_idx
    WHERE id = v_id AND company_id = p_company_id;
  END LOOP;

  -- Pass 2: Set ordering to desired 0-based index
  FOR v_idx IN 1 .. array_length(p_photo_ids, 1) LOOP
    v_id := p_photo_ids[v_idx];
    UPDATE photos 
    SET ordering = v_idx - 1
    WHERE id = v_id AND company_id = p_company_id;
  END LOOP;
END;
$$;

-- 015_add_staff_photos_bucket.sql

-- Create the storage bucket 'staff_photos' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff_photos', 'staff_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Staff photos public access" ON storage.objects;
DROP POLICY IF EXISTS "Company members upload staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Company members delete staff photos" ON storage.objects;
DROP POLICY IF EXISTS "Company members update staff photos" ON storage.objects;

-- Policy: Allow public read access to staff_photos bucket
CREATE POLICY "Staff photos public access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'staff_photos' );

-- Policy: Allow authenticated users to upload photos to their own company folder
-- Path structure: company_id/filename.ext
CREATE POLICY "Company members upload staff photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff_photos' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE public.company_users.user_id = auth.uid()
      AND public.company_users.company_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Allow authenticated users to update photos in their own company folder
CREATE POLICY "Company members update staff photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff_photos' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE public.company_users.user_id = auth.uid()
      AND public.company_users.company_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'staff_photos' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE public.company_users.user_id = auth.uid()
      AND public.company_users.company_id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Allow authenticated users to delete photos from their own company folder
CREATE POLICY "Company members delete staff photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff_photos' AND
  (storage.foldername(name))[1] IS NOT NULL AND
  EXISTS (
    SELECT 1
    FROM public.company_users
    WHERE public.company_users.user_id = auth.uid()
      AND public.company_users.company_id::text = (storage.foldername(name))[1]
  )
);

-- 013_add_invoices.sql

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card')),
  services_and_addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM company_users
      WHERE company_users.company_id = invoices.company_id
        AND company_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Company members insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM company_users
      WHERE company_users.company_id = invoices.company_id
        AND company_users.user_id = auth.uid()
    )
  );

-- Update bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_invoice ON bookings(invoice_id);

-- 017_invoice_rls_for_users.sql

-- Allow authenticated users to view invoices linked to their bookings
CREATE POLICY "Users can view invoices linked to their bookings"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM bookings
      WHERE bookings.invoice_id = invoices.id
        AND bookings.user_id = auth.uid()
    )
  );
-- Add sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  ordering integer NOT NULL DEFAULT 0,
  CONSTRAINT sub_categories_category_name_unique UNIQUE (category_id, name)
);

-- Add index for slug
CREATE INDEX IF NOT EXISTS idx_sub_categories_slug ON sub_categories(slug);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category_id ON sub_categories(category_id);

-- Add sub_category_id to companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS sub_category_id uuid REFERENCES sub_categories(id) ON DELETE SET NULL;

-- Add index for companies sub_category
CREATE INDEX IF NOT EXISTS idx_companies_sub_category ON companies(sub_category_id);

-- Add company_extra_categories join table
CREATE TABLE IF NOT EXISTS company_extra_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  CONSTRAINT company_extra_categories_unique UNIQUE (company_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_company_extra_categories_company ON company_extra_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_company_extra_categories_category ON company_extra_categories(category_id);

-- 020_add_services_sub_category.sql
ALTER TABLE services
ADD COLUMN IF NOT EXISTS sub_category_id uuid REFERENCES sub_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_sub_category ON services(sub_category_id);

-- 023_search_companies_unaccent.sql

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.search_companies(term text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  category_slug text,
  city_slug text,
  photo_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    cat.slug AS category_slug,
    ci.slug AS city_slug,
    p.url AS photo_url
  FROM public.companies c
  LEFT JOIN public.categories cat ON cat.id = c.category_id
  LEFT JOIN public.cities ci ON ci.id = c.city_id
  LEFT JOIN LATERAL (
    SELECT url
    FROM public.photos p
    WHERE p.company_id = c.id
    ORDER BY p.ordering ASC
    LIMIT 1
  ) p ON true
  WHERE unaccent(c.name) ILIKE '%' || unaccent(term) || '%'
  ORDER BY c.name
  LIMIT 3;
$$;
