import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";
import Header from "../../components/Header";
import { checkAvailability } from "@/app/actions/booking";

// Fetches data for the listing page
async function getPageData(citySlug: string, categorySlug: string, date?: string, timeFrom?: string, timeTo?: string) {
  const supabase = await createClient();

  const cityPromise = supabase.from("cities").select().eq("slug", citySlug).single();
  const categoryPromise = supabase.from("categories").select().eq("slug", categorySlug).single();
  const categoriesPromise = supabase.from("categories").select();
  const citiesPromise = supabase.from("cities").select();

  const [{ data: city }, { data: category }, { data: categories }, { data: cities }] = await Promise.all([cityPromise, categoryPromise, categoriesPromise, citiesPromise]);

  if (!city || !category) {
    return { city: null, category: null, categories: [], companies: [], subcategories: [], cities: [] };
  }

  const companiesPromise = supabase
    .from("companies")
    .select("*, photos(url), services(*)")
    .eq("city_id", city.id)
    .eq("category_id", category.id);

  const [{ data: companies }] = await Promise.all([companiesPromise]);

  let finalCompanies = companies || [];
  if (date) {
    const checks = await Promise.all(finalCompanies.map(c => checkAvailability(c.id, date, timeFrom, timeTo)));
    finalCompanies = finalCompanies.filter((_, i) => checks[i]);
  }

  return { city, category, categories: categories || [], companies: finalCompanies, cities: cities || [] };
}

export default async function ListingPage({ params, searchParams }: { params: Promise<{ city: string; category: string }>; searchParams: Promise<{ date?: string; timeFrom?: string; timeTo?: string }> }) {
  const { city: citySlug, category: categorySlug } = await params;
  const sp = await searchParams;
  const { city, category, categories, companies, cities } = await getPageData(citySlug, categorySlug, sp.date, sp.timeFrom, sp.timeTo);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!city || !category) {
    return (
      <main>
        <h1>Stránka nenájdená</h1>
        <p>Ľutujeme, ale požadované mesto alebo kategória neexistuje.</p>
        <Link href="/">Späť na domovskú stránku</Link>
      </main>
    );
  }

  return (
    <>
      <Header 
        user={user} 
        searchBar={
            <SearchBar 
                defaultCity={city?.name} 
                defaultCategory={category?.name} 
                defaultDate={sp.date}
                defaultTimeFrom={sp.timeFrom}
                defaultTimeTo={sp.timeTo}
                cities={cities} 
            />
        }
      />

      <main>
        <div className="controls-row">
            <div style={{display:'flex', gap:'10px'}}>
                <button className="filter-btn">Filtre</button>
                <button className="filter-btn">Zoradiť: Odporúčané</button>
            </div>
            <button className="filter-btn">Zobraziť mapu 📍</button>
        </div>
 
        <h1 className="section-title">{category?.name} v meste {city?.name} ({companies?.length})</h1>
 
        <div className="tags-row">
            {categories?.filter((c: any) => c.id !== category.id).map((cat: any) => (
              <Link key={cat.id} href={`/${city.slug}/${cat.slug}`} className="tag-pill">{cat.name}</Link>
            ))}
        </div>

        {companies?.map(company => (
          <Link key={company.id} className="listing-card" href={`/${city?.slug}/${category?.slug}/c/${company.slug}`}>
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
              <Link href="/">🏠</Link> / <Link href={`/${city?.slug}`}>{city?.name}</Link> / <span>{category?.name}</span>
          </div>
      </div>


    </>
  );
}
