
-- 02_staff.sql
-- Generate 1-3 staff members for each test company

INSERT INTO staff (
    company_id,
    full_name,
    role,
    email,
    phone,
    available_for_booking,
    description
)
SELECT 
    c.id,
    CASE 
        WHEN s.idx = 1 THEN 'Jana ' || (ARRAY['Nováková', 'Horváthová', 'Kováčová', 'Vargová', 'Tóthová'])[floor(random()*5+1)]
        WHEN s.idx = 2 THEN 'Peter ' || (ARRAY['Nagy', 'Baláž', 'Molnár', 'Varga', 'Kováč'])[floor(random()*5+1)]
        ELSE 'Michaela ' || (ARRAY['Szabo', 'Németh', 'Kiss', 'Horváth'])[floor(random()*4+1)]
    END,
    CASE WHEN s.idx = 1 THEN 'manager'::staff_role ELSE 'staffer'::staff_role END,
    'staff' || s.idx || '_' || substr(md5(c.id::text), 1, 6) || '@test.buknisi.sk',
    '+4219' || floor(random() * 89 + 10)::text || floor(random() * 899999 + 100000)::text,
    true,
    'Profesionálny prístup a dlhoročné skúsenosti v odbore.'
FROM companies c
CROSS JOIN generate_series(1, floor(random() * 2 + 1)::int) s(idx); -- 1 to 3 staff members
