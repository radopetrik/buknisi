-- Enable row level security for company photos and allow only company members to manage records

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members manage photos" ON photos;

CREATE POLICY "Company members manage photos"
ON photos
FOR ALL
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
