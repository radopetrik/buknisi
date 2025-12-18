import Header from "../components/Header";
import { createClient } from "@/utils/supabase/server";

export default async function ObchodnePodmienky() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <section className="section">
          <h1 className="section-title">Obchodné podmienky</h1>
          <div style={{ maxWidth: '800px', lineHeight: '1.6', color: 'var(--text-main)' }}>
            <p style={{ marginBottom: '1rem' }}>
              Tieto obchodné podmienky upravujú práva a povinnosti medzi prevádzkovateľom portálu Bukni Si a jeho používateľmi.
            </p>
            
            <h3>1. Úvodné ustanovenia</h3>
            <p style={{ marginBottom: '1rem' }}>
              1.1. Prevádzkovateľom portálu je spoločnosť Bukni Si s.r.o. so sídlom v Bratislave.<br/>
              1.2. Portál slúži na sprostredkovanie rezervácií v oblasti služieb krásy a wellness.
            </p>

            <h3>2. Registrácia a užívateľský účet</h3>
            <p style={{ marginBottom: '1rem' }}>
              2.1. Pre využívanie niektorých funkcií portálu je potrebná registrácia.<br/>
              2.2. Užívateľ je povinný uvádzať pravdivé údaje.
            </p>

            <h3>3. Rezervácia služieb</h3>
            <p style={{ marginBottom: '1rem' }}>
              3.1. Rezervácia je záväzná po jej potvrdení poskytovateľom služby.<br/>
              3.2. Zrušenie rezervácie podlieha storno podmienkam konkrétneho poskytovateľa.
            </p>

            <h3>4. Záverečné ustanovenia</h3>
            <p style={{ marginBottom: '1rem' }}>
              4.1. Tieto podmienky nadobúdajú platnosť dňom zverejnenia.<br/>
              4.2. Prevádzkovateľ si vyhradzuje právo na zmenu podmienok.
            </p>
            
            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Posledná aktualizácia: 16. decembra 2025
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
