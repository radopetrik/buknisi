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