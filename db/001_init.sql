-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'day_of_week') then
    create type day_of_week as enum (
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'staff_role') then
    create type staff_role as enum ('basic', 'staffer', 'reception', 'manager');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'price_type') then
    create type price_type as enum ('fixed', 'free', 'dont_show', 'starts_at');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'time_off_reason') then
    create type time_off_reason as enum ('sick_day', 'vacation', 'training');
  end if;
end $$;

-- Lookup tables
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  ordering integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
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

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email citext
);

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

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category_id);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city_id);
CREATE INDEX IF NOT EXISTS idx_company_amenities_company ON company_amenities(company_id);
CREATE INDEX IF NOT EXISTS idx_company_business_hours_company ON company_business_hours(company_id);
CREATE INDEX IF NOT EXISTS idx_staff_company ON staff(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_addons_company ON addons(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_company_date ON bookings(company_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_company_date ON reservations(company_id, date);
