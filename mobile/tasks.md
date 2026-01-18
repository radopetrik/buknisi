-- Extra Categories pre Company
Pre app "admin":
Chcem pridat novu fukciu kde si company moze pridat okrem jednen hlavnej kategorie aj extra kategories.
Takze jednak je treba pridat novu tabulku do db 
V admine pridat do profile mozno pridat extra kategorie a to hned pod "Kategoria" ako sa vybera kategorie.
 Treba premenovat aj Kategoria na Hlavna kategoria 


Done:


-- do profile 
Pre app "admin": Sekcia profile ako je tab zaklad a tam je button "Ulozit zmeny" Ale hned vedla su kategorie tak nech tie kategorie su sucastou ok kde je aj "ulozit zmeny"


-- Service - moznost pridania kategorie
Pre app "admin". Sekcia Nastavenia (settings) -> Service -> Ako sa pridava a edituje service tak pridat moznost sub-category. Field pridat ako prvy field vo forme. Pozriet ci je db field nato ak nie tak pridat.


- Services -> 
Pre app "admin". Settings -> Services -> Ako je listing tak pridat aj sub-kageoriu do boxu



Pre app "admin". Settings -> Services -> Add/Edit -> Kategória služby premenovat na "Vlastne kategorie"


Appka "mobile". Sekcia home a "Prehliadat". Obe budu mat spolocne to ze chcem search zobrazovat ako input (tak ako teraz na home) ale ked kliknem nanho tak sa mi zobrazi nova page "Search". Ta bude obsahovat to co teraz obsahuje search na "Prehliadat" a to je Lokalita, Co hladate a kedy. 


Appka "mobile". Sekcia home. Zobrazit iba search a zoznam "cagegory". To bude obsah celeho homepage

Este zmen nadpis "Booksy" na Buknisi a pridaj logo z appky "web"
Ako je home su nadpisi Kategorie a Mesta tak pridaj este ikony pred to


Appka "mobile". Sekcia "Rezervacia" tak pridat moznost rezervovat viacero services s doplnkami. Pozri logiku v "web" -> "Rezervácia" tak presne tak.

Appka "mobile". Sekcia "Prehladavat" tak vyhod celkovo lokalitu (city). A nadpis ako he odporucame tak napis nieco kde bude aj nazov mesta vybraneho. 

Appka "mobile". Ak rezervujem sluzby tak zobrazovat hned na prvej stranke kde si vyberam sluzby instantne podla toho co klikam

Pridat do profilu prefered_city a pridat tu moznost do web appky "profile" a tiez do mobile appky "profile" sekcii co su uz. A tiez pridat novy field do db. Ak v search zmenim mesto tak nech sa zmeni aj v profile

Appka "mobile". Ak rezervujem sluzby tak zobrazovat ako je podnik tak zobrazovat aj jeho ikonu tak ako to robis pri search.

Appka "mobile". Sekcia Prehliadat vyhodit Location


Appka "mobile". Search page. Pridat button "Vyhladavat". Field city nech moze vybrat city ale po kliku sa iba vyberie city. Pri search ak user klikne na kategoriu tak sa neodkaze na na list ale ostane na search a vyberie sa kagoria. Ak sa klikne na butto vyhladavat tak sa odkaze na spravne page

Appka mobile, sekcia "Prehladavat (explore)". Ako je nadpis kategorie tak pridat aj nazov mesta. Napr. kategorie v meste xyz. Pricom mesto bude klikacie a bude sa dat zmenit na klik. vybehne nejake modal kde sa to zmeni. Ak sa zmeni mesto tak sa zmeni aj prefered_city v profile. 


Appka mobile, sekcia "Prehladavat (explore)". Ako sa zobrazuju kategorie "Services" tak miesto toho zobrazovat "sub_categories". Odkaz ostava ako je (kategoria sa vytiahne z sub_categorie). posle sa ale novy parameter "sub_category".
Tento novy parameter sa pouzije na page city->category. Na city->category Bude zobrazovat companies  ktore maju service so sub-categoriou vybranou (ak nebude vybrana tak ignorovat). Takisto na page city->category pridaj sub-categories tak ako su v explore s tym rozdielom ze budu orderovane podla categorie ktora je vybrana. Na tej istej stranke by som ako je hlavicka a je nazov vybranej kategorie tak aby sa dalo kliknut a zmenit vybranu kategoriu. Vyhodit mesto za kageoriou.
Hned pod zoznam "sub_categorii" ako je nadpis "<cat name> v meste <city> tak cat name nahradit sub_category a ak nieje vybrana zobrazit iba Mesto <city>. Mesto nech je klikacie tak ako v expore a da sa zmenit. 

Appka mobile, page city->category, nech sa na nej zobrazuje menu (spodne tabs). Nepidavat nic do tabs iba nech sa na tej page zobrazi spodne menu a ze som v "explore"


Dalsia uloha, z page "home" ako su kategorie tak nech je odklik na "city-category" 


Appka mobile, Search page, pridaj do vyhladavania "Co hladame" aj moznost vyhladat sub_category. Potom zmen, ze ak je vybrana category alebo sub_category tak ta to hodi na city->category, po kliknuti na search. Taktiez povolit vo vyhladavani pridat iba jednu polozku.

Sprav search nech je taky modal lebo nieje zapleny tak moze byt modal. Pozri kde vsade sa pouziva a zmen to.

----
Appka admin:

1. Calendar
- appka mobile-admin, page callendar. Na tejto page chcem dosiahnut tuto funkcionalitu. Ako prve uvidi prihlaseny user svoje rezervacie v zozname nejak odelene po dnoch v nadpise, ale stale scrolujes v nekonecnom zozname do buducnosti. Dalej bude mozne vidiet calendar ako -> agenda, day, week, nonth a filtrovat podla staff (vsetko alebo iba vybrany staff).

-  appka mobile-admin, page callendar. pridat moznost pridat novy booking. chcel by som dat do stredu medzy ikonky velke "+" ikonu ked sa klikne tak sa otvori modal na pridat objednavky. Co ma obsahovat ten form mozes pozriet na appke "admin" v sekcii ->calendar -> novy booking


appka mobile-admin. Odober dashboard a pridaj novu page "billing". Funkcionalitu sprav podla appky "admin" -> protected -> billing. 

appka mobile-admin - pridaj do sekcie "pokladna" co je asi dasboard tak premenut na billings a zmen komplet obsah tabu podla "admin"-> billings. "Pridat platbu" akciu by som dal na "+" button v spodnom menu ale kedze tam uz je namapovane new booking tak by som otvoril modal kde ti da na vyber new booking ale new platba


appka mobile-admin - viac (staff) pridaj fukcionalitu podla appky "admin" -> staff  

appka mobile-admin - viac -> page profile - sprav skopiruj funkcionalitu z appky "admin" -> profile

appka mobile-admin, sekcia viac -> nastavenia (settings) sprav podla appky "admin" sekcia -> settings

appka mobile-admin, sekcia viac -> hodnotenia (ratins) sprav podla appky "admin" sekcia -> ratings

appka mobile-admin - login page. ako prve to preloz do slovencitny. A chcem pridat moznost registracie ale firmy. A to podla appky "web" -> create_customer.
Tu to ale rozdel na viacero krokov + v polke by dalo ze vytvorit company fyzicky, usera by prihlasilo a potom by este pokracoval wizard so vecami v veci zo viac -> profile a to zakla + hodiny + fotky s moznostou preskoci krok alebo sa vratit do zaklad


appka mobile-admin - jedna polka back button je pekna ale neda sa kliknut na label iba na sipku a su tam potom take ine back buttons ako tieto a tie treba zmenit aby boli vsetky rovnake


appka mobile-admin - page viac -> ako je odhlasit tak nad nim pridaj info o tom kto je prihlaseny

appka mobile-admin - login page + registacia firmy. Pri login pridaj odkaz na reset hesla zatial nikam neveduci, pridaj logo z appky "mobile" aj obrazok na pozadie z appky "admin" -> login. Odkaz registracia firmy daj nejak ako button alebo nejak inak vyraznejsie, krajsie, modernejsie. Prejdi registraciu form aj login page a nejak skrasli

chcel by som pridat novy field do databazi tabulka bookings. lebo chcem pridat novy flow. ak je booking z appkies "web" alebo "mobile" tak musi 
byt este booking akceptovana staffom. nato by som chcel pridat novy field do db. Tiez tym padom treba zmenit ui v "admin" a "mobile-admin" appkach kde bude mozne akceptovat booking. nech sa to robi v oboch pripadoch v calendari. bude musiet byt nejaka nova sekcia kde budu cakajuce bookings ktore moze user potvrdit. a tie nech sa nezobrazuju v kalendari pokilal nesu potvrdene. Zaroveb bude treba zabezpecit aby sa v appkach "web" a "mobile" ak ide booking stavil flag ze caka na potvrdenie.

pozri sa na appku "mobile" na home ci to nevies spravit viac pro take divne mi to pride.    