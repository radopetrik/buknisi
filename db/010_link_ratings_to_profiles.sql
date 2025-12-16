-- Link company_ratings directly to profiles to allow embedding/joins in Supabase
-- This enables selecting `profiles (*)` when querying `company_ratings`

ALTER TABLE company_ratings
ADD CONSTRAINT company_ratings_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;
