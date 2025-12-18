import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";

async function getPageData(citySlug: string) {
  const supabase = await createClient();

  const { data: city } = await supabase.from("cities").select().eq("slug", citySlug).single();
  
  if (!city) {
    return { city: null, categories: [], cities: [] };
  }

  const categoriesPromise = supabase.from("categories").select().order('ordering', { ascending: true });
  const citiesPromise = supabase.from("cities").select().order('name');
    
  const [{ data: categories }, { data: cities }] = await Promise.all([categoriesPromise, citiesPromise]);

  return { city, categories: categories || [], cities: cities || [] };
}

export default async function CityCategoriesPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: citySlug } = await params;
  const { city, categories, cities } = await getPageData(citySlug);

  if (!city) {
    return (
      <main className="section">
        <h1>Mesto nenájdené</h1>
        <Link href="/cities">Späť na zoznam miest</Link>
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
                <Link href="/login">Prihlásiť sa</Link>
                <Link href="/create_customer">Pre firmy</Link>
            </nav>
        </div>
      </header>

      <main>
        <div className="breadcrumbs-container">
            <div className="breadcrumbs">
                <Link href="/">🏠</Link> / <Link href="/cities">Mestá</Link> / <Link href={`/${city.slug}`}>{city.name}</Link> / <span>Kategórie</span>
            </div>
        </div>

        <section className="section" style={{paddingTop: 0}}>
            <h1 className="section-title">Kategórie v meste {city.name}</h1>
            <div className="tags-row">
                {categories?.map((cat) => (
                    <Link key={cat.id} href={`/${city.slug}/${cat.slug}`} className="tag-pill">
                        {cat.name}
                    </Link>
                ))}
            </div>
        </section>
      </main>

    </>
  );
}
