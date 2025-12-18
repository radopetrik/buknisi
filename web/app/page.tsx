import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SearchBar from "./components/SearchBar";
import Header from "./components/Header";
import { blogPosts } from "@/lib/blogData";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

export default async function Home() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from("cities").select();
  const { data: categories } = await supabase.from("categories").select().order('ordering', { ascending: true });
  const { data: companies } = await supabase
    .from("companies")
    .select(`
      *,
      city:cities(name, slug),
      category:categories(name, slug),
      photos(url)
    `)
    .limit(20);
  
  const randomCompanies = companies 
    ? [...companies].sort(() => 0.5 - Math.random()).slice(0, 4) 
    : [];

  const latestBlogPosts = blogPosts.slice(0, 3);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />

      <section className="hero">
        <div className="hero-content">
          <h1>Buď sebavedomá</h1>
          <p>Objavujte a rezervujte krásu & wellness pri vás doma či v meste.</p>
          <div style={{maxWidth: "900px", margin: "0 auto", marginBottom: "12px"}}>
            <SearchBar 
              popoverClassName="hero-datepicker-popover" 
              numberOfMonths={1} 
              cities={cities}
            />
          </div>
          <div className="quick-cats">
            {categories?.map((category) => (
              <Link key={category.id} className="cat-pill" href={`/c/${category.slug}`}>
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <main>
        <section className="section">
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap"}}>
            <div>
              <div className="section-title">Odporúčané miesta</div>
              <div className="section-sub">Vybrali sme obľúbené podniky s výborným hodnotením.</div>
            </div>
            <div style={{display: "flex", gap: "10px"}}>
              <Link href="/cities" className="btn-ghost-sm">PRESKÚMAŤ SALÓNY</Link>
            </div>
          </div>
          <div className="card-grid">
            {randomCompanies.map((company: any) => (
              <Link 
                key={company.id} 
                className="rec-card" 
                href={`/${company.city?.slug}/${company.category?.slug}/c/${company.slug}`}
              >
                <div className="rec-image">
                  <img 
                    src={company.photos?.[0]?.url || "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80"} 
                    alt={company.name} 
                  />
                  <div className="rec-rating"><span>★</span>{Number(company.rating || 0).toFixed(1)} ({company.rating_count || 0})</div>
                </div>
                <div className="rec-body">
                  <div className="rec-name">{company.name}</div>
                  <div className="rec-meta">{company.address_text}, {company.city?.name}</div>
                  <div className="rec-tags">
                    {company.category && (
                      <span className="rec-tag">{company.category.name}</span>
                    )}
                    <span className="rec-tag">Rezervovať</span>
                  </div>
                </div>
              </Link>
            ))}
            {randomCompanies.length === 0 && (
               <p>Žiadne odporúčané podniky.</p>
            )}
          </div>
        </section>

        <section className="section" style={{paddingTop: "10px"}}>
          <div className="section-title">Nájdite odborníka vo vašom meste</div>
          <div className="city-grid">
            {cities?.map((city) => (
              <a key={city.id} className="city-link" href={`/${city.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#d4a373' }}>➜</span> {city.name}
              </a>
            ))}
          </div>
        </section>

        <section className="section" style={{paddingTop: "20px"}}>
          <div className="split">
            <div>
              <h2>Termíny vybavené lepšie</h2>
              <p>Hľadáte najbližší termín u barbera, kaderníčky, fyzioterapeuta alebo nail artistky? Rezervácia brady, farbenia obočia či masáže je otázkou pár klikov.</p>
              <p><strong>Bukni Si</strong> je aplikácia na rezervácie krásy a wellness. Zarezervujete sa za sekundy, bez telefonovania – kedykoľvek, odkiaľkoľvek.</p>
              <p><strong>Objavte top podniky vo svojom okolí a rezervujte okamžite.</strong></p>
            </div>
            <div className="illustration">
              <svg viewBox="0 0 420 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrácia rezervácie">
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffe9df"/>
                    <stop offset="100%" stopColor="#fff7f2"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="420" height="320" fill="#f9fbfc"/>
                <circle cx="120" cy="110" r="90" fill="#fff0f3" />
                <circle cx="310" cy="140" r="70" fill="#e9f4ff" />
                <rect x="90" y="140" width="240" height="110" rx="12" fill="url(#g1)" stroke="#e9d8cb" />
                <rect x="120" y="160" width="60" height="90" rx="8" fill="#d4a373" opacity="0.9" />
                <rect x="200" y="160" width="100" height="70" rx="10" fill="#fff" stroke="#e5d4c5" />
                <rect x="210" y="175" width="80" height="10" rx="5" fill="#f3ebe4" />
                <rect x="210" y="195" width="80" height="10" rx="5" fill="#f3ebe4" />
                <rect x="210" y="215" width="60" height="10" rx="5" fill="#f3ebe4" />
                <path d="M320 130c0 28-36 66-36 66s-36-38-36-66a36 36 0 0 1 72 0z" fill="#d4a373" opacity="0.9" />
                <circle cx="284" cy="130" r="14" fill="#fff" />
                <path d="M284 118c6 0 11 5 11 11s-5 11-11 11-11-5-11-11 5-11 11-11z" fill="#f6efe9" />
                <path d="M284 126c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4z" fill="#d4a373" />
                <line x1="120" y1="160" x2="120" y2="250" stroke="#f6efe9" strokeWidth="6" />
                <line x1="150" y1="160" x2="150" y2="250" stroke="#f6efe9" strokeWidth="6" />
                <rect x="108" y="150" width="80" height="10" rx="4" fill="#f3ebe4" />
              </svg>
            </div>
          </div>
        </section>

        <section className="section" style={{paddingTop: "10px"}}>
          <div className="split">
            <div className="illustration">
              <svg viewBox="0 0 420 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pripomienky v mobile">
                <defs>
                  <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e8f5ff" />
                    <stop offset="100%" stopColor="#f6fafe" />
                  </linearGradient>
                </defs>
                <rect width="420" height="320" fill="#f9fbfc" />
                <circle cx="300" cy="110" r="80" fill="#e9f4ff" />
                <circle cx="140" cy="170" r="95" fill="#fff6ef" />
                <rect x="140" y="60" width="140" height="220" rx="26" fill="url(#g2)" stroke="#d8e5f2" />
                <rect x="158" y="90" width="104" height="160" rx="16" fill="#fff" stroke="#e6eef5" />
                <rect x="190" y="72" width="44" height="6" rx="3" fill="#d4a373" opacity="0.9" />
                <circle cx="210" cy="270" r="12" fill="#d4a373" />
                <rect x="176" y="110" width="68" height="12" rx="6" fill="#f3ebe4" />
                <rect x="176" y="134" width="88" height="10" rx="5" fill="#f3ebe4" />
                <rect x="176" y="154" width="60" height="10" rx="5" fill="#f3ebe4" />
                <rect x="176" y="182" width="88" height="12" rx="6" fill="#e9f4ff" />
                <rect x="176" y="206" width="72" height="10" rx="5" fill="#e9f4ff" />
                <g transform="translate(275 92)">
                  <circle cx="0" cy="0" r="28" fill="#d4a373" />
                  <rect x="-6" y="-16" width="12" height="22" rx="6" fill="#fff" />
                  <circle cx="0" cy="10" r="10" fill="#fff" />
                  <circle cx="-18" cy="-22" r="6" fill="#fff0f3" />
                  <circle cx="18" cy="-22" r="6" fill="#fff0f3" />
                </g>
              </svg>
            </div>
            <div>
              <h2>Niečo vám do toho vošlo? Máme vás.</h2>
              <p>Stiahnite si Bukni Si, online rezervačnú appku, a spravujte termíny odkiaľkoľvek. Preplánujte alebo zrušte bez telefonovania.</p>
              <p>Keďže vieme, že život je hektický, pošleme vám pripomienky. Už nikdy nezabudnete na ďalší termín.</p>
              <div className="app-row" id="appky">
                <a href="#" className="store-btn">
                  <span style={{fontSize: "20px"}}></span>
                  <div className="store-btn-text">
                    <span className="small-txt">Stiahnuť v</span>
                    <span className="big-txt">App Store</span>
                  </div>
                </a>
                <a href="#" className="store-btn">
                  <span style={{fontSize: "20px"}}>▶</span>
                  <div className="store-btn-text">
                    <span className="small-txt">Získať v</span>
                    <span className="big-txt">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{paddingTop: "10px"}}>
          <div className="split">
            <div>
              <h2>Objednajte sa k najlepším</h2>
              <p>Prezrite si vibe podniku, recenzie a portfólio práce. Vyberte si miesto, ktoré vám sedí – od prémiových barberov až po najmilšie nechtové štúdio.</p>
              <p>Ušetrite čas a vybavte ďalší termín online. S Bukni Si je plánovanie krásy jednoduché a bez stresu.</p>
              <Link className="btn-primary-sm" href="/cities">PRESKÚMAŤ SALÓNY</Link>
            </div>
            <div className="illustration">
              <svg viewBox="0 0 420 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hodnotenia v aplikácii">
                <defs>
                  <linearGradient id="g3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef4ec" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
                <rect width="420" height="320" fill="#f9fbfc" />
                <circle cx="140" cy="120" r="82" fill="#e9f4ff" />
                <circle cx="300" cy="190" r="90" fill="#fff0f3" />
                <rect x="150" y="70" width="120" height="200" rx="22" fill="url(#g3)" stroke="#e8dcd0" />
                <rect x="168" y="96" width="84" height="140" rx="14" fill="#fff" stroke="#f1e6da" />
                <rect x="190" y="78" width="40" height="6" rx="3" fill="#d4a373" opacity="0.9" />
                <circle cx="210" cy="255" r="10" fill="#d4a373" />
                <rect x="182" y="112" width="56" height="12" rx="6" fill="#f3ebe4" />
                <rect x="182" y="134" width="72" height="12" rx="6" fill="#f3ebe4" />
                <rect x="182" y="158" width="48" height="10" rx="5" fill="#f3ebe4" />
                <g transform="translate(210 188)">
                  <polygon points="0,-18 5,-4 20,-4 8,5 12,20 0,11 -12,20 -8,5 -20,-4 -5,-4" fill="#f8c35e" />
                  <polygon points="-46,-6 -41,8 -26,8 -38,17 -34,32 -46,23 -58,32 -54,17 -66,8 -51,8" fill="#f8c35e" />
                  <polygon points="46,-6 51,8 66,8 54,17 58,32 46,23 34,32 38,17 26,8 41,8" fill="#f8c35e" />
                </g>
                <g transform="translate(320 170)">
                  <circle cx="0" cy="0" r="32" fill="#d4a373" opacity="0.15" />
                  <circle cx="0" cy="0" r="22" fill="#d4a373" opacity="0.25" />
                  <path d="M-8 0c0-6 4-10 10-10s10 4 10 10c0 7-6 13-10 16-4-3-10-9-10-16z" fill="#d4a373" />
                  <circle cx="2" cy="-2" r="4" fill="#fff" />
                </g>
              </svg>
            </div>
          </div>
        </section>

        <section className="section">
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "30px"}}>
             <div>
               <h2 className="section-title" style={{marginBottom: "8px"}}>Novinky z blogu</h2>
               <p className="section-sub" style={{marginBottom: "0"}}>Prečítajte si najnovšie články a tipy</p>
             </div>
             <Link href="/blog" className="btn-ghost-sm">ZOBRAZIŤ VŠETKY ČLÁNKY</Link>
          </div>
          
          <div className="card-grid">
            {latestBlogPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="rec-card">
                <div className="rec-image">
                  <img src={post.image} alt={post.title} />
                </div>
                <div className="rec-body">
                  <div className="rec-meta">
                    {format(new Date(post.date), "d. MMMM yyyy", { locale: sk })}
                  </div>
                  <h3 className="rec-name" style={{ marginTop: "8px" }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.5", marginTop: "6px" }}>
                    {post.excerpt.substring(0, 100)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
