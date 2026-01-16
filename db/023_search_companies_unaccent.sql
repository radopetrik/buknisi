-- Adds diacritics-insensitive search for companies

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
