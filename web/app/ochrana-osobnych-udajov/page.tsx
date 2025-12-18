import Header from "../components/Header";
import { createClient } from "@/utils/supabase/server";

export default async function OchranaOsobnychUdajov() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      <main>
        <section className="section">
          <h1 className="section-title">Zásady ochrany osobných údajov</h1>
          <div style={{ maxWidth: '800px', lineHeight: '1.6', color: 'var(--text-main)' }}>
            <p style={{ marginBottom: '1rem' }}>
              Ochrana vašich osobných údajov je pre nás prioritou. Tieto zásady vysvetľujú, ako zhromažďujeme, používame a chránime vaše údaje.
            </p>
            
            <h3>1. Prevádzkovateľ</h3>
            <p style={{ marginBottom: '1rem' }}>
              Prevádzkovateľom vašich osobných údajov je spoločnosť Bukni Si s.r.o.
            </p>

            <h3>2. Aké údaje zbierame</h3>
            <p style={{ marginBottom: '1rem' }}>
              Zbierame údaje, ktoré nám poskytnete pri registrácii, rezervácii alebo pri komunikácii s nami. Ide najmä o meno, email, telefónne číslo a históriu rezervácií.
            </p>

            <h3>3. Účel spracúvania</h3>
            <p style={{ marginBottom: '1rem' }}>
              Údaje spracúvame za účelom:<br/>
              - Poskytovania našich služieb a sprostredkovania rezervácií<br/>
              - Komunikácie ohľadom vašich rezervácií<br/>
              - Zlepšovania našich služieb
            </p>

            <h3>4. Vaše práva</h3>
            <p style={{ marginBottom: '1rem' }}>
              Máte právo na prístup k svojim údajom, ich opravu, vymazanie alebo obmedzenie spracúvania.
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
