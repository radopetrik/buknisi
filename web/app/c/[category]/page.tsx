import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SearchBar from "../../components/SearchBar";
import Header from "../../components/Header";
import { checkAvailability } from "../../actions/booking";

async function getPageData(categorySlug: string, date?: string, timeFrom?: string, timeTo?: string) {
  const supabase = await createClient();

  const { data: category } = await supabase.from("categories").select().eq("slug", categorySlug).single();
  
  if (!category) return { category: null };

  const { data: allCities } = await supabase.from("cities").select("*");

  // Case 1: Date is present -> Show Companies (Global Search)
  if (date) {
      const { data: allCompanies } = await supabase
        .from("companies")
        .select("*, photos(url), services(*), city:cities(name, slug)")
        .eq("category_id", category.id);
        
      if (!allCompanies) return { category, companies: [], cities: allCities || [], mode: 'companies' };

      // Filter by availability
      const checks = await Promise.all(allCompanies.map(c => checkAvailability(c.id, date, timeFrom, timeTo)));
      const availableCompanies = allCompanies.filter((_, i) => checks[i]);
      
      return { category, companies: availableCompanies, cities: allCities || [], mode: 'companies' };
  } 

  // Case 2: No Date -> Show Cities
  const { data: companiesInCat } = await supabase
      .from("companies")
      .select("city_id")
      .eq("category_id", category.id);
      
  const cityIds = Array.from(new Set(companiesInCat?.map(c => c.city_id) || []));
  
  const relevantCities = allCities?.filter(c => cityIds.includes(c.id)) || [];
      
  return { category, cities: allCities || [], relevantCities, mode: 'cities' };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<{ date?: string; timeFrom?: string; timeTo?: string }> }) {
    const { category: categorySlug } = await params;
    const sp = await searchParams;
    
    const cookieStore = await cookies();
    const citySlug = cookieStore.get('user-city')?.value;
    
    // Redirect if city is known and we are not in "Global Availability Search" mode
    if (citySlug && !sp.date) {
        redirect(`/${citySlug}/${categorySlug}`);
    }

    const data = await getPageData(categorySlug, sp.date, sp.timeFrom, sp.timeTo);
    
    if (!data.category) {
        return <div>Kategória neexistuje</div>;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <>
            <Header 
                user={user} 
                searchBar={
                    <SearchBar 
                        defaultCategory={data.category.name} 
                        defaultDate={sp.date}
                        defaultTimeFrom={sp.timeFrom}
                        defaultTimeTo={sp.timeTo}
                        cities={data.cities} 
                    />
                } 
            />
            
            <main>
                <div className="container" style={{maxWidth: '1200px', margin: '0 auto', padding: '20px'}}>
                    <h1>{data.category.name}</h1>
                    
                    {data.mode === 'cities' ? (
                        <div>
                            <p style={{marginBottom: '20px', color: '#666'}}>Vyberte mesto:</p>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px'}}>
                                {data.relevantCities?.map((city: any) => (
                                    <Link 
                                        key={city.id} 
                                        href={`/${city.slug}/${categorySlug}`}
                                        style={{
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: '1px solid #eee',
                                            textAlign: 'center',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            fontWeight: '500',
                                            backgroundColor: '#f9f9f9',
                                            transition: 'transform 0.2s'
                                        }}
                                    >
                                        {city.name}
                                    </Link>
                                ))}
                                {data.relevantCities?.length === 0 && (
                                    <p>V tejto kategórii zatiaľ nemáme žiadne salóny.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{marginBottom: '20px', color: '#666'}}>
                                Dostupné salóny na {sp.date} {sp.timeFrom ? `od ${sp.timeFrom}` : ''} {sp.timeTo ? `do ${sp.timeTo}` : ''}
                            </p>
                            
                            {data.companies?.map((company: any) => (
                                <Link key={company.id} className="listing-card" href={`/${company.city?.slug || 'city'}/${categorySlug}/c/${company.slug}`} style={{display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: '20px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden'}}>
                                    <div style={{display: 'flex', flexDirection: 'row', gap: '20px', padding: '20px'}}>
                                        <div style={{width: '120px', height: '120px', flexShrink: 0}}>
                                            <img 
                                                src={company.photos?.[0]?.url || "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80"} 
                                                alt={company.name} 
                                                style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} 
                                            />
                                        </div>
                                        <div style={{flex: 1}}>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                                                <h3 style={{margin: '0 0 5px 0', fontSize: '18px'}}>{company.name}</h3>
                                                <span style={{fontSize: '12px', background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px'}}>
                                                    {company.city?.name}
                                                </span>
                                            </div>
                                            <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#666'}}>{company.address_text}</p>
                                            
                                            <div style={{marginTop: '10px'}}>
                                                 {company.services?.slice(0, 2).map((service: any) => (
                                                    <span key={service.id} style={{display: 'inline-block', fontSize: '12px', border: '1px solid #eee', padding: '4px 8px', borderRadius: '4px', marginRight: '8px', color: '#555'}}>
                                                        {service.name}
                                                    </span>
                                                 ))}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            
                            {data.companies?.length === 0 && (
                                <p>Nenašli sa žiadne voľné termíny pre zvolený dátum.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
