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
