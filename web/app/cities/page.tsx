import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Header from "../components/Header";

export default async function CitiesPage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from("cities").select().order('name');
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <div className="breadcrumbs-container" style={{paddingTop: '20px'}}>
            <div className="breadcrumbs">
                <Link href="/">🏠</Link> / <span>Mestá</span>
            </div>
        </div>

        <section className="section" style={{paddingTop: '10px'}}>
          <h1 className="section-title">Všetky mestá</h1>
          <div className="city-grid">
            {cities?.map((city) => (
              <Link key={city.id} className="city-link" href={`/${city.slug}/categories`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#d4a373' }}>➜</span> {city.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
