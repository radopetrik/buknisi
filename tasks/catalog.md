Project "catalog" homepage, tam zobrazujem zoznam "miest" (cities). Po kliku na city sa ukaze zoznam dostupnych typov servisu. (company ma category) tak sa zoberie zoznam companies v tom city a zoznam kategorii ktore maju tie company. Takze ak je v meste "Poprad" "holic" tak zobrazi kategoriu holic a iba tu ak je v poprade iba holic. Takaze kazde city sa este rozdeli na existuje kategorie a az na tie sa bude dat kliknut lebo listing ma povinne city + kategoriu.


Citaj db schemu z "db/schema.sql" 
Vytvor page "listing" z templates/listing.html ktora bude mat url /<city.slug>/<category.slug>/ pricom prva value je z tabulkt "cities" a druha z "categories". kazda company ma jedno city a jedno category. Tak zobrazit tam firmy podla toho. 

Vytvor aj detail company z templates/detail.html a ta bude na url /<city.slug>/<category.slug>/c/<company.slug>/. plosledny paraneter je field slug z company
Na homepage je zoznam miest ako template, to nahrad zoznamom miest v database ("cities") pricom kazde mesto ma "category". Tak po kliku na mesto nech sa zobrazia
kategorie a po kliku na kategoriu sa pojde na "listing". 
V listingu zase ked kliknes na company tak chod na detail


Vo Search-bar nahrad mesto vyskakovacim menu kde si budes most zvolit jedno mesto. nech je moznost aj vyhladavat. Ale bude vediet aj zrusit vyber. Zlad to s celyn dizajnom aplikacie


V search bar hned prvy field sprav z neho autocomplete kde moze vyhladavat v "companies" podla name a v "categories" podla name. Nech je to aj odlisene v autocomplete. vybrat si moze iba jedno

search bar, ked kliknem na search tak nech 1) ak je vybrate comp

Vytvorenie customera. Odkaz na uvode Pre firmy. Pojde na page "internal_welcome". Tam mu da 
na vyber login ale zaregistrovat firmy. Login neriesit to bude iba rediret na inu appku.
Treba riesit form na registraciu firmy. 

tu by som dal otazky ako 
nazov firm  y
login(email)/pass
kategoria
addresa 
city
ulozit -> 


Registracia/Login usera
- user sa moze prihlasit alebo zaregistrovat
- registrovat bud cez email alebo google alebo apple
- prihlasit tiez email google apple
- vsetko riesim cez supabase. citaj agents/supabase.md
- po prihlaseni sa zmeni v hornej liste ze je user prihlaseny
- registrovany user nema pridelenu company. je to user portalu


Booking
- Iba prihlaseny user moze bookovat (Rezervovat), ak nieje user prihlaseny zobrazit modal ze musi sa prihlasit alebo zaregistrovat
- Booking sa da iba jedna company kliknutim na booking alebo priamo na sluzbu (pridat moznost book pri sluzbe v detaile company).
- Po kliku vyskoci "sheet" pattern z prava kde bude moznost pridat vsetko co je v tabulke "bookings" "booking_services" a "booking_service_addons", pochop strukturu aky ma zmysel a vytvor form pre sheet, pouzi tab napr. pre cekciu kde moze zadat poznamku. ak si user klikol na konkretny service tak nech ja uz vyplneny. user nech ma moznost pridavat a odoberat servis, addony k servisu aj s poctom. user ma moznost definovat zaciatok session cas den, koniec sa vyrata podla dlzky sluzby. Treba tiez kontrolovat ci company ma kapacitu na booking. to znamena ze ma otvorene a zaroven ma volny aj staff na ten cas. co znamena ze staff robi v tom case a nema ziadnu inu book na ten cas.
V sheet prehlade bude na spodku cas, dlzka, a cena a mozno booknut"


prihlaseny user nech ma moznost pristupit na sekciu profil. 
vytvorit tuto page. na nej bude mat moznost, menit osobne udaje ako kontakt a pod, moznost vidiet bookings ktore este len budua tie ktore uz boli vykonane->zaplatene.


Pridat page, na kategoriu url: /c/<category.slug>/. 
Ak user nema vybrate mesto (v search bar) tak page ukaze zoznam miest ktore si musi vybrat.
Ak uz ma vybrane mesto tak redirect na /<city>/<category>/

V search bar ako je field "kedy?" tak pridat moznot definovat aj cas od-do 

Zaroven upravit spravanie searchbar ked klikne na hladat
Ked kliknem na search v searchbar tak nech:
1) ak je vyplnena kategoria ale nieje city tak hodi na page "category" kde ak je vyplneny datum/cas tak stale zobrazuje firmy volne v tom case
2) ak je vyplneny datum/cas tak filtrovat company podla toho ci je sluzba volna v tom case (logika je pri bookingu)


na homepage ako je Vybrali sme obľúbené podniky s výborným hodnotením.-> tak tie boxy companies nech sa nacitava z realnych, zatial nahodne

V detaile pridat moznost napisat rating pre company. 
bude treba vytvorit aj tabulku "company_rating" so field "company FK, user FK, rating: 1-5, note (text), datetime.
do "companies" treba pridat field "rating" kde sa bude ukladat priemer ratingu co ma company pri kazdom pridani ratingu.
rating bude most napisat iba prihlaseny user tak treba tam dat o tom message abo daco. 

Vytvor page cities kde bude zoznam vsetkych cities z db. user bo vybere city ide na page "categories". Ktoru tiez treba vytvorit  

Pre tabulku companies pridaj field "rating_count" kde sa bude priebezne ukladat celkovy pocet ratings (pri zmene rating sa bude ukladat).
Zaroven tuto hodnotu treba zohladnit pri vsetktch rating na vsetktch pages ktore zobrazuju ratin


Vytvor page "Stiahnut App" a tam popis aktualny stav co si vies vyhladat a objednat. obrazky daj nejake ilustratyvne.

Sekcia caste otazky: Sprav nove page a to tak ze na page bude user mat na vyber typ otazok a to "User otazky" alebo "Firma Otazky". Pre kazdu vygeneruj nejake otazky a odpovede podla toho co uz je spravene. Sprav odkaz z homepage na tuto page

Sekcia obchodne podmienky a 
Zásady ochrany osobných údajov nieco pidaj, je to web na slovensku, vytvor dve pages. Pridaj odkaz z homepage na tieto pages

Sekcia o nas. vytvor novu page a pridaj tam nejaku vseobecnu story. Pouzi dva nahodne mena chapec a dievca. Startup.

Vytvor sekciu blog. Blog budu staticke clanky, kde bude zoznam a detail, vytvor aj 3 nahodne blogy

Sekcia kontak, pridaj telefone cislo a email a formular tiez naprikla kde bude vydiet prihlaseny uzivatel.
Formular zatial nebude robit nic 


---- Admin idem pridat ------

V appke "admin" folder "admin", pridaj novu sekciu "rating" aj v menu, kde sa budu zobrazovat vsetky ratings prihlasenej company. Bude mozne aj mazat rations. Ratings cita z databazi. Uvidim aj nejake celkove score. 

---

"Task: Pokladna"
Najpr Databaza sa meni:

nova tabulka "invoices" tu su field priblizne co chcem
field: 
    - client FK (null=True)
    - amount (double)
    - date/time
    - payment_method (cash, card)
    - services_and_addons (json) - here it will generate json list of services witn name na price and same for addons name and price 

Este bude treba new field do bookings a to:
    - bookings.invoice FK    


Pokladna (menu) nech tam je toto:

Ak napisem zaplatit tak to je process ked vyskoci modal okno a opyta sa na typ platby zobrazi sumu sluby+addons a clien ak je vyplneny. Booking je zaplatena ak ma vyplneny field "invoice"

Fukcie co by to malo vediet to menu Pokladna:
1) Je mozne pridat novu platbu, kde v sheet sa vyberie services s addons a zaplati sa
2) je mozne vidiet bookings zoznam co este niesu zaplatene tam je moznost kliknut otvori sa checkout a mozes editovat services a addons a zaplatit
3) Je mozne vidiet uz zaplatene sluzby ("invoices" tabulka) a vidiet fakturu 

Akonahle sa zaplati za tak ulozi zaznam do tabulky "invoices"






---- zamestanci


Zmen sekciu zamestanci (staff) tak nech to je rozdelene v lavo zoznam zamestnancov kde su iba mena a v pravo detail zamestnca. Pozri si tabulky "staff_working_hours" a "staff_time_off" tak to daj do kopy aj s tym co existuje v edit a nejak to zmen aby sa dalo editovat oba tabulky co som spomenul





Na hľadanie niekde ešte odkaz na samotný aaa, samotný company na webe. Pričom URL sa skladá lomitko IDéčko mesta, v ktorom je Company Slug mesta Lomitko City Slug city Lomítko P Slug company Doménu zatiaľ daj localhost:3000 


V preview pridaj este okaz na firmu na webe ten sa sklada <catalog_url - zatial daj localhost:3000 >/<city.slug>/<category.slug>/<company.slug>/


Tak ako zobrazuje kategorie tu [city] tak nech tak zobrazuje aj [city]/[category]. Prikladam screenshot z [city].


Prejdi kazdu page a pozri velkosi a typ fontu ci sedi lebo som si vsimol ze minimalne napis sa niekde lisi.
Mozes aj pouzit ine fonty, ma to byt ladene viacej pre zeny ale nech je to extra moderne

Ak kliknes na nejake mesto tak znamena ze si si zmenil preferovane mesto tak nech sa to zohladni aj v hornom search bare kde je city

V sekcii "profile" pridaj este userovy zoznam jeho "invoices". Cele to mozno vylepsi, popremyslaj nad layout


Pre appku "web" V Sekcia 'Pre firmy' spranik ako keby separe web ktory vlastne ponuka customerovy sa zaregistrovat na web a vyuzivat vsetky sluzby. Nastuduj si db/schema.sql a pozri aj pages a zisti co vsetko ponukame (poriadne si to premysli a nacitaj) a sprav z toho sekcie podla screenhots. Farby a fonty pouzi tak ako v aktualnom projekte ale nech to vyzera inac kedze ke to ako keby cela sekcia iba pre firmy.

cennik je zakladna cena mesacne 9.90 a potom cena za kazdeho staff usera 3.90 mesacne

Prikladam konkurenciu ktora robi to iste pre ilustraciu. 


changes [commit|branch|pr], defaults to uncommitted
pozri sa na "pre-firmy" v appke "web" a skus to vizualne zmodernizovat. ma to byt samostatna homepage na predavanie produktu ktory je catalog. 


appku ktoru mam v react + nuxt, je to katalog zo sluzbami a chcel by som 
z toho spravit react native + expo a spravit z toho appku pre ios a android. Tak precitaj vsetko co vies ohladom projektu "web" + citaj db/schema.sql + agents/supabase.md a vytvor novu appku.
