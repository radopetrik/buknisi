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
