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