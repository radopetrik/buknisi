-- Update profiles RLS to allow reading all profiles for authenticated users
-- This is necessary for features like Ratings where we need to see the author's name

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
