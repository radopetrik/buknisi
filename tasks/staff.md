V appke "admin" sekcia "staff" pridaj moznost editovania tabulky "staff". Editacia nech otvori ako sheet, kde bude most napr. aj pridat service vid tabulku "staff_services", preto ako sheel lebo je mozne ze bude treba scrollovat ked bude mat vela services.


V appke "admin" folder admin! sekcia "Clients" pridaj moznost CRUID pre tabulku client. Vsetko nech sa podla company. Moze sa priamo pouzit supabase lebo budem pouzivat RSL.
Pridaj aj vyhkladavanie podla mena a cisla. Na edit pouzi dialog co uz pouzivam napr. v "settings->services"


V appke "admin" folder admin!  Sekcia profile sluzi na vyplnenie tabulky "company" a tabulky "company_amenities" a "company_business_hours" a "company_business_hours_extras". 
Tiez tabulka "photos". Kazdy user ma iba jednu company tak to bude rovno preview company zaznamu ktory mozes editovat. Co je photos tak prve photo (podla order) je cover photo. Tak porozmyslaj ako to vyzera v profile nejake preview aby sa userovy lepsie menilo mozno aj taby. Hlavne rozmyslaj co je co naco to sluzi a sprav to najviac ako vies aby user to lachko pochopil a vedel si prectavit profil firmy v katalogu. Cim najviac pouzivaj shadcn a mozes pozriet aj do condex7

V appke "admin" folder admin!  Sekcia "billing", tu budeme zobrazovat booking z pohladu zaplatenia. Budu sekcie "Caka na zaplatenie" kde budu vsetky bookings ktore este nie 
su zaplatene alebo skoncene a  sekcia "Zaplatene" kde uz budu zaplatene bookings. 
Caka na zaplatenie ak sa nato klikne tak hlavna akcia bude Zaplatit. Pri tento akcii bude mozne editovat services a addons pri bookingu. 
Tie co uz zaplatene tiez bude mozne manipulovat so sluzbami.

Vytvor novu nextjs appku "catalog". Pouzi contex7 mpc server pre inspiraciu
Napojena bude na supabase. Struktura databazi je v "db/schema.sql"
Na zaciatok vytvor tieto 3 pages z template ulozeneho v adresary "templatess".
Website je public website katalog friem co ponukaju servis. Landing page vytvor z templates/index.html
Potom vytvor page "list" ulozene v "templates/listing.html" a daj to na url na url "/<city_slug>/<category_slug>/" a zobrazuj zaznam z tabulky "companies" filtrovane podla table "city" field "slug" (ten treba vytvorit) a  field "category" ktory odkazuje na "categories" a ten ma field "slug" (este nema treba vytvorit).
Posledna page je detail company detail (ulozene html templates/detail.html). ten bude na url "/<city_slug>/<category_slug>/c/<slug> 
Kde slug je z tabulky "companies" field "slug".
Updatni potom AGENTS.md ak uznas za vhodne.

 







