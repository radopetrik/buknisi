import { createClient } from "@/utils/supabase/server";
import Link from 'next/link';
import SearchBar from "../../../../components/SearchBar";
import Header from "../../../../components/Header";
import { BookHeroBtn, ServiceRow } from "../../../../components/CompanyInteractions";
import { getAvailableSlots } from "@/app/actions/booking";
import { format } from "date-fns";
import CompanyRating from "@/app/components/CompanyRating";
import { OpeningHoursList } from "@/app/components/OpeningHours";

async function getCompanyData(companySlug: string) {
    const supabase = await createClient();
    const { data: company } = await supabase
        .from("companies")
        .select("*, category:categories(name, slug), city:cities(name, slug), photos(url), services(*), company_business_hours(*)")
        .eq("slug", companySlug)
        .single();
    
    let ratings = [];
    let profilesMap = new Map();

    if (company) {
        const { data: ratingsData } = await supabase
            .from("company_ratings")
            .select("*")
            .eq("company_id", company.id)
            .order('created_at', { ascending: false });
        
        ratings = ratingsData || [];

        if (ratings.length > 0) {
            const userIds = ratings.map((r: any) => r.user_id);
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, first_name, last_name")
                .in("id", userIds);
            
            if (profiles) {
                profiles.forEach((p: any) => profilesMap.set(p.id, p));
            }
        }
    }

    // Fetch cities for the search bar
    const { data: cities } = await supabase.from("cities").select();

    return { company, ratings, profilesMap, cities: cities || [] };
}

export default async function CompanyPage({ params: paramsPromise }: { params: Promise<{ city: string; category: string; company: string }> }) {
  const params = await paramsPromise;
  const { company, ratings, profilesMap, cities } = await getCompanyData(params.company);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!company) {
    return (
      <main>
        <h1>Firma nenájdené</h1>
        <Link href="/">Späť na domovskú stránku</Link>
      </main>
    );
  }

  const { city, category } = company;

  const minDuration = company.services && company.services.length > 0 
    ? Math.min(...company.services.map((s: any) => s.duration)) 
    : 30;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySlots = await getAvailableSlots(company.id, today, minDuration);

  // Use the new rating field if available, fallback to review_rank or default
  const averageRating = company.rating ? Number(company.rating).toFixed(1) : (company.review_rank ? company.review_rank + ".0" : "0.0");
  const reviewCount = ratings.length;

  return (
    <>
      <Header 
        user={user} 
        searchBar={<SearchBar defaultCity={city?.name} defaultCategory={category?.name} cities={cities} />}
      />
      
      <main>
        <div className="breadcrumbs">
            <Link href="/">🏠 Vyhľadávanie</Link> / 
            {city && <><Link href={`/${city.slug}`}>{city.name}</Link> /</>}
            {city && category && <><Link href={`/${city.slug}/${category.slug}`}>{category.name}</Link> /</>}
            <span>{company.name}</span>
        </div>

        <section className="detail-hero">
            <div className="hero-image">
                <img src={company.photos?.[0]?.url || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"} alt={company.name || "Image"} />
                <div className="badge"><span>★</span>{averageRating} · {reviewCount} hodnotení</div>
            </div>
            <div className="hero-info">
                <h1>{company.name}</h1>
                <div className="meta-row">
                    <span>{category?.name} • {company.address_text}</span>
                </div>
                
                <div style={{ marginBottom: '14px', maxWidth: '300px' }}>
                     <OpeningHoursList hours={company.company_business_hours} variant="hero" />
                </div>
                
                <div className="meta-row">
                    {/* Placeholder for amenities */}
                    <span>Bezplatné Wi‑Fi</span>
                    <span>Bezplatné parkovanie</span>
                    <span>Platba kartou</span>
                </div>
                <div className="cta-row">
                    <BookHeroBtn company={company} />
                    <a className="btn-ghost" href="#contact">Kontakt</a>
                </div>
            </div>
        </section>

        <section className="info-panels" id="booking">
            <div className="panel">
                <h2>Dnešné termíny</h2>
                <div className="slots">
                    {todaySlots.length > 0 ? (
                        todaySlots.slice(0, 8).map(slot => (
                            <div key={slot} className="slot">{slot}</div>
                        ))
                    ) : (
                         <div style={{color: '#666', padding: '10px 0'}}>Na dnes už nie sú žiadne voľné termíny.</div>
                    )}
                </div>
            </div>
            {company.description && 
              <div className="panel">
                  <h2>Popis salónu</h2>
                  <p>{company.description}</p>
              </div>
            }
        </section>

        {company.services && company.services.length > 0 &&
          <section className="panel">
              <h2>Cenník služieb</h2>
              <div className="service-list">
                  {company.services.map((service: any) => (
                    <ServiceRow key={service.id} service={service} company={company} />
                  ))}
              </div>
          </section>
        }

        {company.photos && company.photos.length > 1 &&
          <section className="panel" style={{marginTop: "20px"}}>
              <h2>Galéria</h2>
              <div className="gallery">
                  {company.photos.slice(1).map((photo: any) => (
                    <img key={photo.url} src={photo.url} alt="Gallery image" />
                  ))}
              </div>
          </section>
        }


        <section className="panel" id="reviews" style={{marginTop: "20px"}}>
            <h2>Hodnotenia zákazníkov</h2>
            <div className="review-grid">
                <div className="review-summary">
                    <div className="review-score">{averageRating}</div>
                    <div className="review-stars">
                        {'★'.repeat(Math.round(Number(averageRating)))}
                        {'☆'.repeat(5 - Math.round(Number(averageRating)))}
                    </div>
                    <p style={{color:'var(--text-muted)', margin: '10px 0 14px'}}>Na základe {reviewCount} overených hodnotení</p>
                </div>
                
                <div className="reviews-list" style={{ flex: 1 }}>
                    {ratings.length > 0 ? (
                        ratings.map((rating: any) => {
                            const profile = profilesMap.get(rating.user_id);
                            const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Anonym';
                            return (
                                <div key={rating.id} className="review-item" style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <strong>{name || 'Používateľ'}</strong>
                                        <span style={{ color: '#888', fontSize: '0.9em' }}>{format(new Date(rating.created_at), 'd. M. yyyy')}</span>
                                    </div>
                                    <div className="review-stars" style={{ color: '#ffc107', marginBottom: '8px' }}>
                                        {'★'.repeat(rating.rating)}
                                        {'☆'.repeat(5 - rating.rating)}
                                    </div>
                                    {rating.note && <p className="review-text">{rating.note}</p>}
                                </div>
                            );
                        })
                    ) : (
                        <p style={{ color: '#666' }}>Zatiaľ žiadne hodnotenia. Buďte prvý!</p>
                    )}
                    
                    <CompanyRating 
                        companyId={company.id} 
                        companyName={company.name} 
                        user={user} 
                        path={`/${city?.slug}/${category?.slug}/c/${company.slug}`} 
                    />
                </div>
            </div>
        </section>

        <section className="panel" id="contact" style={{marginTop: "20px"}}>
            <h2>Kontakt a poloha</h2>
            <div className="contact-info">
                {company.address_text && <div><strong>Adresa:</strong> {company.address_text}</div>}
                {company.phone && <div><strong>Telefón:</strong> {company.phone}</div>}
                {company.email && <div><strong>Email:</strong> {company.email}</div>}
                
                <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                    <h4>Otváracie hodiny</h4>
                    <OpeningHoursList hours={company.company_business_hours} />
                </div>
            </div>
            {/* Placeholder for map */}
            <div style={{marginTop: "14px"}}>
                <iframe className="map-embed" src="https://www.google.com/maps?q=Ko%C5%A1ice%2C%20Slovakia&output=embed" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Mapa – Košice, Slovensko"></iframe>
            </div>
        </section>
      </main>
    </>
  );
}
