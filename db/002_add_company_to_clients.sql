-- Attach clients to companies and ensure referential integrity
ALTER TABLE clients
  ADD COLUMN company_id uuid;

ALTER TABLE clients
  ADD CONSTRAINT clients_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

UPDATE clients
SET company_id = (
  SELECT bookings.company_id
  FROM bookings
  WHERE bookings.client_id = clients.id
  LIMIT 1
)
WHERE company_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM clients WHERE company_id IS NULL) THEN
    RAISE EXCEPTION 'clients.company_id cannot be NULL after migration';
  END IF;
END;
$$;

ALTER TABLE clients
  ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
