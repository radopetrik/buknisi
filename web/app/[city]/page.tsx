import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import SearchBar from "../components/SearchBar";

async function getPageData(citySlug: string) {
  const supabase = await createClient();

  const { data: city } = await supabase.from("cities").select().eq("slug", citySlug).single();
  
  if (!city) {
    return { city: null, companies: [], categories: [], cities: [] };
  }

  const companiesPromise = supabase
    .from("companies")
    .select("*, photos(url), services(*), category:categories(name, slug)")
    .eq("city_id", city.id)
    .order("review_rank", { ascending: false, nullsFirst: false })
    .limit(10);
  
  const categoriesPromise = supabase.from("categories").select();
  const citiesPromise = supabase.from("cities").select();
    
  const [{ data: companies }, { data: categories }, { data: cities }] = await Promise.all([companiesPromise, categoriesPromise, citiesPromise]);

  return { city, companies: companies || [], categories: categories || [], cities: cities || [] };
}


export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const { city, companies, categories, cities } = await getPageData(citySlug);

  if (!city) {
    return (
      <main>
        <h1>Mesto nenájdené</h1>
        <p>Ľutujeme, ale požadované mesto neexistuje.</p>
        <Link href="/">Späť na domovskú stránku</Link>
      </main>
    );
  }

  return (
    <>
      <header>
        <div className="header-inner">
            <Link href="/" className="logo">
                <img src="/logo_buknisi.png" alt="Bukni Si" />
            </Link>
            
            <SearchBar defaultCity={city?.name} cities={cities} />

            <nav className="nav-links">
                <a href="#">Prihlásiť sa</a>
                <a href="#">Pre firmy</a>
            </nav>
        </div>
      </header>

      <main>
        <div className="controls-row">
            <div style={{display:'flex', gap:'10px'}}>
                <button className="filter-btn">Filtre</button>
                <button className="filter-btn">Zoradiť: Odporúčané</button>
            </div>
            <button className="filter-btn">Zobraziť mapu 📍</button>
        </div>
 
        <h1 className="section-title">Odporúčané podniky v meste {city?.name} ({companies?.length})</h1>
 
        <div className="tags-row">
            {categories?.map((cat: any) => (
              <Link key={cat.id} href={`/${city.slug}/${cat.slug}`} className="tag-pill">{cat.name}</Link>
            ))}
        </div>

        {companies?.map((company: any) => (
          <Link key={company.id} className="listing-card" href={`/${city?.slug}/${company.category.slug}/c/${company.slug}`}>
              <div className="card-image-col">
                  <img src={company.photos?.[0]?.url || "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80"} alt={company.name || "Image"} className="main-img" />
                  <div className="rating-float"><span>★</span> {Number(company.rating || 0).toFixed(1)} ({company.rating_count || 0})</div>
              </div>
              
              <div className="card-content-col">
                  <div className="salon-header">
                      <div className="salon-name">{company.name}</div>
                      <div className="salon-meta">{company.address_text}</div>
                  </div>

                  <div className="service-table">
                      {company.services?.slice(0, 3).map((service: any) => (
                        <div key={service.id} className="service-row">
                            <div className="service-left">
                                <span className="service-title">{service.name}</span>
                                {service.description && <span className="service-desc">{service.description}</span>}
                            </div>
                            <div className="service-right">
                                {service.price && <span className="price">{service.price}€</span>}
                                {service.duration_minutes && <span className="duration">{service.duration_minutes}min</span>}
                            </div>
                        </div>
                      ))}
                  </div>
              </div>
          </Link>
        ))}
      </main>

      <div className="breadcrumbs-container">
          <div className="breadcrumbs">
              <Link href="/">🏠</Link> / <span>{city?.name}</span>
          </div>
      </div>


    </>
  );
}
