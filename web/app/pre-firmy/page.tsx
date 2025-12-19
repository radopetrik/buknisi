import Link from "next/link";
import styles from "./page.module.css";
import Footer from "../components/Footer";

export const metadata = {
  title: "Pre firmy | Bukni Si",
  description: "Kompletný rezervačný systém pre vaše podnikanie. Kalendár, klienti, notifikácie a viac.",
};

export default function ForCompaniesPage() {
  return (
    <div className={styles.container}>
      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          {/* Integrated Header within Hero */}
          <div className={styles.heroHeader}>
             <Link href="/" className="logo">
                 <img src="/logo_buknisi.png" alt="Bukni Si Logo" height={40} />
             </Link>
             <nav className={styles.nav}>
                <Link href="#funkcie" className={styles.navLink}>Funkcie</Link>
                <Link href="#pre-koho" className={styles.navLink}>Pre koho</Link>
                <Link href="#cennik" className={styles.navLink}>Cenník</Link>
             </nav>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
                <span className={styles.badge}>
                    <span>🚀</span> Pre Firmy & Podnikateľov
                </span>
                <h1 className={styles.title}>Viac času na to, čo milujete.</h1>
                <p className={styles.subtitle}>
                Automatizovaný rezervačný systém, ktorý vám pomôže získať nových klientov, 
                znížiť počet neuskutočnených návštev a mať podnikanie pod kontrolou 24/7.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    <Link href="/create_customer" className={styles.ctaButton}>
                    Začať zadarmo
                    </Link>
                    <Link href="#funkcie" className={styles.ctaButtonOutline}>
                    Zistiť viac
                    </Link>
                </div>
                <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '15px', color: '#666', fontSize: '13px' }}>
                    <div style={{ display: 'flex' }}>⭐⭐⭐⭐⭐</div>
                    <span>Dôveruje nám viac ako 100+ salónov</span>
                </div>
            </div>
            
            <div className={styles.heroRight}>
                {/* CSS Only Device Mockups */}
                <div className={styles.dashboardMockup}>
                    <div className={styles.dashHeader}>
                        <div className={styles.dot} style={{background: '#ff5f57'}}></div>
                        <div className={styles.dot} style={{background: '#febc2e'}}></div>
                        <div className={styles.dot} style={{background: '#28c840'}}></div>
                    </div>
                    <div className={styles.dashBody}>
                        <div className={styles.dashSidebar}></div>
                        <div className={styles.dashContent}>
                            <div style={{height: '30px', width: '40%', background: '#eee', marginBottom: '20px', borderRadius: '4px'}}></div>
                            <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                                <div style={{flex: 1, height: '80px', background: '#f5f5f5', borderRadius: '8px'}}></div>
                                <div style={{flex: 1, height: '80px', background: '#f5f5f5', borderRadius: '8px'}}></div>
                                <div style={{flex: 1, height: '80px', background: '#f5f5f5', borderRadius: '8px'}}></div>
                            </div>
                            <div style={{height: '150px', width: '100%', background: '#f9f9f9', borderRadius: '8px'}}></div>
                        </div>
                    </div>
                </div>

                <div className={styles.phoneMockup}>
                    <div className={styles.phoneScreen}>
                        <div className={styles.phoneHeader}></div>
                        <div className={styles.phoneBody}>
                            <div className={styles.uiCard} style={{display: 'flex', alignItems: 'center', padding: '10px'}}>
                                <div style={{width: '40px', height: '40px', background: '#eee', borderRadius: '50%', marginRight: '10px'}}></div>
                                <div>
                                    <div style={{width: '80px', height: '8px', background: '#333', marginBottom: '5px', borderRadius: '2px'}}></div>
                                    <div style={{width: '50px', height: '6px', background: '#ccc', borderRadius: '2px'}}></div>
                                </div>
                            </div>
                            <div className={`${styles.uiCard} ${styles.hero}`}></div>
                            <div className={styles.uiRow}></div>
                            <div className={styles.uiRow}></div>
                            <div className={styles.uiCard}></div>
                            <div className={styles.uiCard}></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>100+</span>
                    <span className={styles.statLabel}>Aktívnych salónov</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>50k+</span>
                    <span className={styles.statLabel}>Rezervácií mesačne</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>-30%</span>
                    <span className={styles.statLabel}>Menej telefonátov</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>24/7</span>
                    <span className={styles.statLabel}>Non-stop recepcia</span>
                </div>
            </div>
        </section>

        {/* Feature Highlights (Alternating Rows) */}
        <section id="funkcie" className={styles.section}>
            <div className={styles.highlightSection}>
                {/* Row 1 */}
                <div className={styles.highlightRow}>
                    <div className={styles.highlightContent}>
                        <h3>Kalendár, ktorý pracuje za vás</h3>
                        <p>
                            Prestaňte dvíhať telefóny počas práce. Náš inteligentný kalendár sa stará o rezervácie 24 hodín denne.
                            Klienti vidia len voľné termíny a okamžite dostanú potvrdenie.
                        </p>
                        <ul style={{listStyle: 'none', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <li style={{display: 'flex', gap: '10px', alignItems: 'center'}}><span style={{color: '#28c840'}}>✓</span> Synchronizácia s Google Kalendárom</li>
                            <li style={{display: 'flex', gap: '10px', alignItems: 'center'}}><span style={{color: '#28c840'}}>✓</span> Nastavenie prestávok a smeny</li>
                            <li style={{display: 'flex', gap: '10px', alignItems: 'center'}}><span style={{color: '#28c840'}}>✓</span> Rezervácie pre viacerých zamestnancov</li>
                        </ul>
                        <Link href="/create_customer" className={styles.highlightLink}>
                            Vyskúšať kalendár zadarmo →
                        </Link>
                    </div>
                    <div className={styles.imageWrapper}>
                         {/* Placeholder image - would be a real app screenshot */}
                         <div style={{width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '80px'}}>📅</div>
                    </div>
                </div>

                {/* Row 2 */}
                <div className={`${styles.highlightRow} ${styles.reversed}`}>
                    <div className={styles.highlightContent}>
                        <h3>Zabudnite na "neprišiel som"</h3>
                        <p>
                            Znížte počet zabudnutých termínov až o 70%. Automatické SMS a emailové pripomienky 
                            zabezpečia, že vaši klienti na termín nezabudnú.
                        </p>
                        <p>
                            Môžete tiež vyžadovať zálohu vopred alebo nastaviť storno podmienky, aby ste boli chránení.
                        </p>
                        <Link href="/create_customer" className={styles.highlightLink}>
                            Vyskúšať notifikácie →
                        </Link>
                    </div>
                    <div className={styles.imageWrapper}>
                         <div style={{width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '80px'}}>🔔</div>
                    </div>
                </div>
                 
                 {/* Row 3 */}
                <div className={styles.highlightRow}>
                    <div className={styles.highlightContent}>
                        <h3>Vlastná mobilná aplikácia a web</h3>
                        <p>
                            Získajte profesionálnu webovú stránku s vašou ponukou, cenníkom a galériou. 
                            Vaši klienti si môžu stiahnuť aplikáciu Bukni Si a mať vás vždy po ruke.
                        </p>
                        <Link href="/create_customer" className={styles.highlightLink}>
                            Pozrieť ukážkový profil →
                        </Link>
                    </div>
                    <div className={styles.imageWrapper}>
                         <div style={{width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '80px'}}>📱</div>
                    </div>
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="cennik" className={styles.pricingSection}>
            <div className={styles.sectionTitle} style={{textAlign: 'center', marginBottom: '60px'}}>
                Jednoduchý a transparentný cenník
            </div>

            <div className={styles.pricingContainer}>
                <div className={styles.pricingLeft}>
                     <div style={{opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '14px', fontWeight: '600'}}>Mesačný poplatok</div>
                     <div className={styles.priceTag}>9.90 €</div>
                     <div className={styles.priceMeta}>+ 3.90 € za každého zamestnanca</div>
                     <p style={{marginTop: '30px', opacity: 0.8, lineHeight: '1.6'}}>
                        Férová cena, ktorá sa vráti už pri jednej zachránenej rezervácii mesačne.
                     </p>
                     <Link href="/create_customer" className={styles.ctaButton} style={{marginTop: '40px', background: 'white', color: 'black', width: '100%'}}>
                        Začať 14 dní zadarmo
                     </Link>
                     <div style={{textAlign: 'center', marginTop: '15px', fontSize: '12px', opacity: 0.6}}>Bez nutnosti karty</div>
                </div>

                <div className={styles.pricingRight}>
                    <h3 style={{fontSize: '24px', fontFamily: 'var(--font-heading)', marginBottom: '30px'}}>Čo všetko je v cene?</h3>
                    <ul className={styles.benefitList}>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> Online rezervácie 24/7</li>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> Neobmedzený počet klientov</li>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> SMS pripomienky (kredity navyše)</li>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> Vlastná webová stránka</li>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> Mobilná aplikácia pre klientov</li>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> Štatistiky a prehľady</li>
                        <li className={styles.benefitItem}><span className={styles.checkCircle}>✓</span> Zákaznícka podpora</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* Target Audience */}
        <section id="pre-koho" className={styles.audienceSection}>
          <h2 className={styles.sectionTitle}>Pre koho je Bukni Si?</h2>
          <p className={styles.sectionSubtitle}>
             Navrhnuté pre profesionálov, ktorí si vážia svoj čas.
          </p>
          
          <div className={styles.audienceGrid}>
            <AudienceItem title="Kaderníctva" icon="✂️" />
            <AudienceItem title="Barber shopy" icon="💈" />
            <AudienceItem title="Kozmetika" icon="💄" />
            <AudienceItem title="Masáže" icon="💆‍♀️" />
            <AudienceItem title="Nechty" icon="💅" />
            <AudienceItem title="Tréneri" icon="💪" />
            <AudienceItem title="Fyzio" icon="⚕️" />
            <AudienceItem title="Vzdelávanie" icon="🎓" />
            <AudienceItem title="Tetovanie" icon="🖊️" />
            <AudienceItem title="Salóny pre psov" icon="🐕" />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className={styles.ctaBottom}>
          <h2>Posuňte svoje podnikanie <br/> na vyšší level</h2>
          <p>Pridajte sa k moderným salónom, ktoré šetria čas a zarábajú viac.</p>
          <div style={{marginTop: '40px'}}>
            <Link href="/create_customer" className={styles.ctaButton} style={{background: 'white', color: 'black'}}>
                Vytvoriť účet zadarmo
            </Link>
          </div>
        </section>
      </main>

      {/* Footer is provided by layout */}
    </div>
  );
}

function AudienceItem({ title, icon }: { title: string, icon: string }) {
    return (
        <div className={styles.audienceItem}>
            <div className={styles.audienceItemImage}></div>
            <div className={styles.audienceContent}>
                <span className={styles.audienceIcon}>{icon}</span>
                <div className={styles.audienceTitle}>{title}</div>
                <div className={styles.audienceLink}>Viac informácií →</div>
            </div>
        </div>
    )
}
