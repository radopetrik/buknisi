
-- 05_bookings_invoices.sql
-- Generate bookings and invoices

-- 1. Create Bookings
WITH data AS (
    SELECT 
        c.id as client_id,
        comp.id as company_id,
        s.id as service_id,
        st.id as staff_id,
        (current_date + (random() * 60 - 30)::int * interval '1 day')::date as booking_date,
        (floor(random() * 8 + 9) || ':00')::time as time_from,
        s.duration
    FROM clients c
    JOIN companies comp ON c.company_id = comp.id
    JOIN services s ON s.company_id = comp.id
    JOIN staff st ON st.company_id = comp.id
    -- Removed name filter to apply to all companies
    ORDER BY random()
    LIMIT 200 -- Generate 200 bookings across the 10 companies
)
INSERT INTO bookings (
    client_id,
    company_id,
    service_id,
    staff_id,
    date,
    time_from,
    time_to,
    internal_note
)
SELECT 
    client_id,
    company_id,
    service_id,
    staff_id,
    booking_date,
    time_from,
    (time_from + (duration || ' minutes')::interval),
    'Testovacia rezervácia'
FROM data;

-- 2. Link Booking Services
INSERT INTO booking_services (booking_id, service_id)
SELECT id, service_id 
FROM bookings 
WHERE internal_note = 'Testovacia rezervácia'
ON CONFLICT DO NOTHING;

-- 3. Create Invoices for 50% of bookings
DO $$
DECLARE
    r RECORD;
    v_invoice_id uuid;
BEGIN
    FOR r IN 
        SELECT b.id, b.company_id, b.client_id, s.price, b.date, b.time_to, s.name as service_name, s.price as service_price
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.internal_note = 'Testovacia rezervácia'
        AND b.invoice_id IS NULL
        AND random() > 0.5 -- 50% chance
    LOOP
        INSERT INTO invoices (company_id, client_id, amount, payment_method, services_and_addons, created_at)
        VALUES (
            r.company_id, 
            r.client_id, 
            r.price, 
            CASE WHEN random() > 0.5 THEN 'card' ELSE 'cash' END,
            jsonb_build_array(jsonb_build_object('name', r.service_name, 'price', r.service_price)),
            (r.date + r.time_to)
        )
        RETURNING id INTO v_invoice_id;

        UPDATE bookings SET invoice_id = v_invoice_id WHERE id = r.id;
    END LOOP;
END;
$$;
