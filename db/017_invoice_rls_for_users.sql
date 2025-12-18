-- Allow authenticated users to view invoices linked to their bookings
CREATE POLICY "Users can view invoices linked to their bookings"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM bookings
      WHERE bookings.invoice_id = invoices.id
        AND bookings.user_id = auth.uid()
    )
  );
