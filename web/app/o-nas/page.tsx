import { createClient } from "@/utils/supabase/server";
import Header from "../components/Header";

export default async function AboutUs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      
      <main>
        <section className="hero" style={{ minHeight: "300px", paddingBottom: "40px" }}>
          <div className="hero-content">
            <h1>O nás</h1>
            <p>Spoznajte príbeh, ktorý stojí za Bukni Si.</p>
          </div>
        </section>

        <section className="section">
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="section-title">Náš príbeh</div>
            <div className="section-sub" style={{ marginBottom: "30px" }}>Od myšlienky k realite</div>
            
            <div style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "#4a4a4a" }}>
              <p style={{ marginBottom: "20px" }}>
                Všetko to začalo jednou jednoduchou myšlienkou pri šálke kávy. <strong>Jakub a Sofia</strong>, dvaja nadšenci do technológií a životného štýlu, si uvedomili, aké náročné môže byť nájsť a rezervovať kvalitné služby v oblasti krásy a wellness.
              </p>

              <p style={{ marginBottom: "20px" }}>
                Jakub, s jeho technickým pozadím, bol frustrovaný zo zastaraných rezervačných systémov a nekonečného telefonovania, keď si chcel len rýchlo upraviť bradu. Sofia, ktorá miluje objavovanie nových salónov a procedúr, zase narážala na problém s nedostatkom relevantných informácií, fotografií a dôveryhodných recenzií.
              </p>

              <p style={{ marginBottom: "20px" }}>
                <em>"Prečo to nemôže byť jednoduchšie?"</em> spýtali sa jedného dňa. A tak vzniklo <strong>Bukni Si</strong>.
              </p>

              <p style={{ marginBottom: "20px" }}>
                Nebolo to ľahké. Po nespočetných prebdených nociach, litroch kávy a stovkách rozhovorov so salónmi aj zákazníkmi, sa im podarilo vytvoriť platformu, ktorá spája to najlepšie z oboch svetov. Vyvinuli modernú, rýchlu a intuitívnu aplikáciu, ktorá šetrí čas zákazníkom a pomáha podnikom rásť a efektívnejšie manažovať svoj čas.
              </p>

              <p>
                Dnes sme rastúci startup tím, ktorý verí, že starostlivosť o seba by mala byť dostupná pre každého, kedykoľvek a kdekoľvek. Neustále pracujeme na vylepšeniach, počúvame vašu spätnú väzbu a sme tu pre vás, aby sme vám uľahčili život a pomohli vám cítiť sa skvele.
              </p>
            </div>
          </div>
        </section>
      </main>

    </>
  );
}
