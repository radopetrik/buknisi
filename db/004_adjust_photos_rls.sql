-- Refine RLS policies for photos table so that company members can manage their media

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members manage photos" ON photos;
DROP POLICY IF EXISTS "Company members view photos" ON photos;
DROP POLICY IF EXISTS "Company members insert photos" ON photos;
DROP POLICY IF EXISTS "Company members update photos" ON photos;
DROP POLICY IF EXISTS "Company members delete photos" ON photos;

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
