
-- 04_clients.sql
-- Generate clients for test companies

INSERT INTO clients (
    company_id,
    first_name,
    last_name,
    phone,
    email
)
SELECT 
    c.id,
    (ARRAY['Adam', 'Michal', 'Tomáš', 'Martin', 'Marek', 'Peter', 'Lucia', 'Zuzana', 'Eva', 'Mária'])[floor(random()*10+1)],
    (ARRAY['Kováč', 'Varga', 'Tóth', 'Horváth', 'Nagy', 'Baláž', 'Szabo', 'Molnár'])[floor(random()*8+1)],
    '+4219' || floor(random() * 89 + 10)::text || floor(random() * 899999 + 100000)::text,
    'klient' || s.idx || '_' || substr(md5(c.id::text), 1, 4) || '@gmail.com'
FROM companies c
CROSS JOIN generate_series(1, 5) s(idx); -- 5 clients per company
