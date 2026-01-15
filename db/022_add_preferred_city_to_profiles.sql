-- Add preferred city to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_city_id uuid REFERENCES public.cities(id);

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_city_id
  ON public.profiles(preferred_city_id);
