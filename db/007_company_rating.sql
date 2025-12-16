-- Create company_ratings table
CREATE TABLE IF NOT EXISTS company_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_ratings_user_company_unique UNIQUE (company_id, user_id)
);

-- Add rating columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rating numeric(3, 2) DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

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

-- RLS Policies
ALTER TABLE company_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Everyone can read company ratings" ON company_ratings;
DROP POLICY IF EXISTS "Authenticated users can insert own rating" ON company_ratings;
DROP POLICY IF EXISTS "Users can update own rating" ON company_ratings;
DROP POLICY IF EXISTS "Users can delete own rating" ON company_ratings;

-- Everyone can read ratings
CREATE POLICY "Everyone can read company ratings"
  ON company_ratings FOR SELECT
  USING (true);

-- Authenticated users can insert their own rating
CREATE POLICY "Authenticated users can insert own rating"
  ON company_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rating
CREATE POLICY "Users can update own rating"
  ON company_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own rating
CREATE POLICY "Users can delete own rating"
  ON company_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
