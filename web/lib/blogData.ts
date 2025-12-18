export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "5-letnych-vlasovych-trendov-2025",
    title: "5 letných vlasových trendov pre rok 2025",
    excerpt: "Objavte najhorúcejšie účesy tohto leta. Od plážových vĺn až po odvážne krátke strihy, ktoré musíte vyskúšať.",
    content: `
      <p>Leto 2025 je tu a s ním prichádzajú nové, svieže trendy vo svete účesov. Či už hľadáte zmenu, alebo len chcete oživiť svoj aktuálny vzhľad, máme pre vás inšpiráciu.</p>
      
      <h3>1. Plážové vlny (Beach Waves)</h3>
      <p>Klasika, ktorá nikdy nevyjde z módy. Tento rok sú vlny ešte prirodzenejšie a textúrovanejšie. Ideálne pre dlhé aj polodlhé vlasy.</p>
      
      <h3>2. Bob s ofinou</h3>
      <p>Krátky strih, ktorý rámuje tvár. Bob strihy sú praktické do horúceho počasia a ofina im dodáva šmrnc.</p>
      
      <h3>3. Medené odtiene</h3>
      <p>Zabudnite na studenú blond, toto leto vládne teplá medená a jahodová blond. Tieto farby krásne vyniknú na slnku.</p>
      
      <h3>4. Vrkoče a pletence</h3>
      <p>Nielenže vyzerajú skvele, ale sú aj praktické. Udržia vlasy z tváre počas horúcich dní a existuje nekonečné množstvo variácií.</p>
      
      <h3>5. "Wet Look"</h3>
      <p>Vlasy s efektom mokrého vzhľadu sú späť. Tento elegantný štýl je perfektný na letné večierky a svadby.</p>
      
      <p>Nebojte sa experimentovať a poraďte sa so svojím kaderníkom, ktorý štýl sa najviac hodí k vašej tvári a typu vlasov. Rezervujte si termín ešte dnes cez Buknisi!</p>
    `,
    date: "2025-06-15",
    author: "Mária Nováková",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80",
    tags: ["Vlasy", "Trendy", "Leto 2025"]
  },
  {
    id: "2",
    slug: "ako-si-vybrat-spravneho-barbera",
    title: "Ako si vybrať správneho barbera: Sprievodca pre moderného muža",
    excerpt: "Nájsť barbera, ktorý rozumie vašim potrebám, nie je vždy jednoduché. Prečítajte si naše tipy, na čo si dať pozor.",
    content: `
      <p>Kvalitný strih a úprava brady sú základom vizitky každého muža. Ako však nájsť barbera, ktorému môžete plne dôverovať?</p>
      
      <h3>Pýtajte sa na skúsenosti</h3>
      <p>Dobrý barber by mal mať za sebou prax a školenia. Nebojte sa opýtať, kde sa učil svojmu remeslu.</p>
      
      <h3>Sledujte čistotu a hygienu</h3>
      <p>Čisté nástroje a upravené prostredie sú nevyhnutnosťou. Profesionál dbá na hygienu po každom klientovi.</p>
      
      <h3>Komunikácia je kľúčová</h3>
      <p>Barber by vás mal počúvať, ale zároveň vám vedieť poradiť. Ak vám povie, že vami vybraný strih sa nehodí k vášmu typu vlasov alebo tvaru tváre, vážte si jeho úprimnosť.</p>
      
      <h3>Recenzie a portfólio</h3>
      <p>Pozrite si fotky jeho prác na sociálnych sieťach alebo priamo na Buknisi. Recenzie od iných zákazníkov vám tiež veľa napovedia.</p>
      
      <p>Pamätajte, že vzťah s barberom je dlhodobá záležitosť. Keď nájdete toho pravého, držte sa ho!</p>
    `,
    date: "2025-05-20",
    author: "Jakub Kováč",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80",
    tags: ["Barber", "Pánsky štýl", "Rady"]
  },
  {
    id: "3",
    slug: "vyhody-pravidelneho-cistenia-pleti",
    title: "Prečo by ste nemali zanedbávať hĺbkové čistenie pleti?",
    excerpt: "Čistenie pleti nie je len o kráse, ale aj o zdraví. Zistite, prečo by sa malo stať súčasťou vašej rutiny.",
    content: `
      <p>Naša pleť je každý deň vystavená znečisteniu, prachu a stresu. Domáca starostlivosť je dôležitá, ale profesionálne hĺbkové čistenie posúva starostlivosť na inú úroveň.</p>
      
      <h3>1. Prevencia akné a vyrážok</h3>
      <p>Hĺbkové čistenie odstraňuje nečistoty z pórov, ktoré bežné umývanie neodstráni. Tým sa predchádza zápalom.</p>
      
      <h3>2. Omladenie a rozjasnenie</h3>
      <p>Odstránením odumretých buniek sa pleť rozžiari a lepšie dýcha. Masáž tváre navyše podporuje prekrvenie a tvorbu kolagénu.</p>
      
      <h3>3. Lepšie vstrebávanie produktov</h3>
      <p>Na vyčistenej pleti fungujú séra a krémy oveľa efektívnejšie, pretože môžu preniknúť hlbšie.</p>
      
      <h3>4. Relax a oddych</h3>
      <p>Návšteva kozmetického salónu je aj o psychohygiene. Doprajte si hodinku pre seba a zrelaxujte.</p>
      
      <p>Odborníci odporúčajú profesionálne čistenie aspoň raz za mesiac. Nájdite si svoj obľúbený salón na Buknisi a objednajte sa ešte dnes.</p>
    `,
    date: "2025-04-10",
    author: "Elena Veselá",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
    tags: ["Skincare", "Zdravie", "Relax"]
  }
];
