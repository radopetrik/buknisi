-- Ensure public read access
DROP POLICY IF EXISTS "Everyone can read company ratings" ON company_ratings;
CREATE POLICY "Everyone can read company ratings"
  ON company_ratings FOR SELECT
  USING (true);

-- Restrict delete to company members (admins) only
-- First, drop the policy that allows users to delete their own ratings
DROP POLICY IF EXISTS "Users can delete own rating" ON company_ratings;

-- Create policy for company members
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
