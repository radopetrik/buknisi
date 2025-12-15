Project "catalog" homepage, tam zobrazujem zoznam "miest" (cities). Po kliku na city sa ukaze zoznam dostupnych typov servisu. (company ma category) tak sa zoberie zoznam companies v tom city a zoznam kategorii ktore maju tie company. Takze ak je v meste "Poprad" "holic" tak zobrazi kategoriu holic a iba tu ak je v poprade iba holic. Takaze kazde city sa este rozdeli na existuje kategorie a az na tie sa bude dat kliknut lebo listing ma povinne city + kategoriu.


Citaj db schemu z "db/schema.sql" 
Vytvor page "listing" z templates/listing.html ktora bude mat url /<city.slug>/<category.slug>/ pricom prva value je z tabulkt "cities" a druha z "categories". kazda company ma jedno city a jedno category. Tak zobrazit tam firmy podla toho. 

Vytvor aj detail company z templates/detail.html a ta bude na url /<city.slug>/<category.slug>/c/<company.slug>/. plosledny paraneter je field slug z company
Na homepage je zoznam miest ako template, to nahrad zoznamom miest v database ("cities") pricom kazde mesto ma "category". Tak po kliku na mesto nech sa zobrazia
kategorie a po kliku na kategoriu sa pojde na "listing". 
V listingu zase ked kliknes na company tak chod na detail

