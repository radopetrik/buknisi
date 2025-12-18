import { createClient } from "@/utils/supabase/server";
import Header from "../components/Header";
import Link from "next/link";

export default async function DownloadAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      
      <main>
        <section className="section" style={{ padding: "80px 20px", textAlign: "center", background: "#fcfcfc" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1>
                    Krása a wellness vo vašom vrecku
                </h1>
                <p style={{ fontSize: "1.25rem", color: "var(--text-muted)", marginBottom: "40px", lineHeight: "1.6" }}>
                    S aplikáciou Bukni Si máte prístup k tisíckam salónov a termínov kedykoľvek a kdekoľvek. 
                    Objavujte, rezervujte a spravujte svoje termíny jednoduchšie ako kedykoľvek predtým.
                </p>
                
                <div className="app-row" style={{ justifyContent: "center", marginBottom: "60px" }}>
                    <a href="#" className="store-btn" style={{ padding: "10px 20px" }}>
                        <span style={{fontSize: "28px"}}></span>
                        <div className="store-btn-text">
                        <span className="small-txt" style={{ fontSize: "11px" }}>Stiahnuť v</span>
                        <span className="big-txt" style={{ fontSize: "16px" }}>App Store</span>
                        </div>
                    </a>
                    <a href="#" className="store-btn" style={{ padding: "10px 20px" }}>
                        <span style={{fontSize: "28px"}}>▶</span>
                        <div className="store-btn-text">
                        <span className="small-txt" style={{ fontSize: "11px" }}>Získať v</span>
                        <span className="big-txt" style={{ fontSize: "16px" }}>Google Play</span>
                        </div>
                    </a>
                </div>
            </div>
            
            <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
                 {/* Placeholder for a hero phone mockup or similar */}
                 <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "auto", maxHeight: "400px" }}>
                    <defs>
                        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fff" />
                            <stop offset="100%" stopColor="#f8f9fa" />
                        </linearGradient>
                    </defs>
                    
                    {/* Left Phone - Search */}
                    <g transform="translate(150, 20) rotate(-5)">
                        <rect x="0" y="0" width="180" height="360" rx="24" fill="#333" />
                        <rect x="6" y="6" width="168" height="348" rx="20" fill="url(#screenGrad)" />
                        {/* Status bar */}
                        <rect x="50" y="14" width="80" height="12" rx="6" fill="#f0f0f0" />
                        {/* App Header */}
                        <rect x="16" y="40" width="100" height="14" rx="4" fill="#d4a373" />
                        {/* Search bar */}
                        <rect x="16" y="70" width="136" height="24" rx="8" fill="#f0f0f0" />
                        <circle cx="140" cy="82" r="6" fill="#ccc" />
                        {/* Categories */}
                        <circle cx="30" cy="120" r="14" fill="#fff0f3" />
                        <circle cx="70" cy="120" r="14" fill="#f0f0f0" />
                        <circle cx="110" cy="120" r="14" fill="#f0f0f0" />
                        <circle cx="150" cy="120" r="14" fill="#f0f0f0" />
                        {/* Listings */}
                        <rect x="16" y="150" width="136" height="80" rx="8" fill="#fff" stroke="#eee" />
                        <rect x="24" y="158" width="120" height="40" rx="4" fill="#f8f8f8" />
                        <rect x="24" y="206" width="60" height="8" rx="4" fill="#eee" />
                        
                        <rect x="16" y="240" width="136" height="80" rx="8" fill="#fff" stroke="#eee" />
                        <rect x="24" y="248" width="120" height="40" rx="4" fill="#f8f8f8" />
                        <rect x="24" y="296" width="60" height="8" rx="4" fill="#eee" />
                    </g>

                    {/* Middle Phone - Booking */}
                    <g transform="translate(310, 0)">
                        <rect x="0" y="0" width="180" height="360" rx="24" fill="#111" />
                        <rect x="6" y="6" width="168" height="348" rx="20" fill="#fff" />
                        {/* Content */}
                        <rect x="16" y="30" width="40" height="40" rx="8" fill="#d4a373" opacity="0.2" />
                        <rect x="64" y="36" width="80" height="12" rx="4" fill="#333" />
                        <rect x="64" y="54" width="50" height="8" rx="4" fill="#999" />
                        
                        <rect x="16" y="90" width="136" height="1" fill="#eee" />
                        
                        <rect x="16" y="110" width="80" height="10" rx="4" fill="#333" />
                        {/* Calendar grid */}
                        <g transform="translate(16, 130)">
                             <rect x="0" y="0" width="20" height="20" rx="4" fill="#f0f0f0" />
                             <rect x="25" y="0" width="20" height="20" rx="4" fill="#f0f0f0" />
                             <rect x="50" y="0" width="20" height="20" rx="4" fill="#d4a373" />
                             <rect x="75" y="0" width="20" height="20" rx="4" fill="#f0f0f0" />
                             <rect x="100" y="0" width="20" height="20" rx="4" fill="#f0f0f0" />
                             
                             <rect x="0" y="25" width="20" height="20" rx="4" fill="#f0f0f0" />
                             <rect x="25" y="25" width="20" height="20" rx="4" fill="#f0f0f0" />
                             <rect x="50" y="25" width="20" height="20" rx="4" fill="#f0f0f0" />
                             <rect x="75" y="25" width="20" height="20" rx="4" fill="#f0f0f0" />
                        </g>
                        
                        <rect x="16" y="200" width="136" height="40" rx="8" fill="#d4a373" />
                        <text x="84" y="225" textAnchor="middle" fill="white" fontSize="12" fontFamily="sans-serif" fontWeight="bold">Rezervovať</text>
                    </g>
                    
                    {/* Right Phone - Profile */}
                    <g transform="translate(470, 20) rotate(5)">
                        <rect x="0" y="0" width="180" height="360" rx="24" fill="#333" />
                        <rect x="6" y="6" width="168" height="348" rx="20" fill="#fcfcfc" />
                         {/* Profile Header */}
                        <circle cx="84" cy="60" r="24" fill="#e0e0e0" />
                        <rect x="54" y="94" width="60" height="10" rx="5" fill="#333" />
                        
                        <rect x="16" y="130" width="136" height="60" rx="8" fill="#fff" stroke="#eee" />
                        <rect x="24" y="138" width="80" height="10" rx="4" fill="#d4a373" />
                        <rect x="24" y="154" width="100" height="8" rx="4" fill="#eee" />
                        
                        <rect x="16" y="200" width="136" height="60" rx="8" fill="#fff" stroke="#eee" />
                        <rect x="24" y="208" width="80" height="10" rx="4" fill="#ccc" />
                        <rect x="24" y="224" width="100" height="8" rx="4" fill="#eee" />
                    </g>
                 </svg>
            </div>
        </section>

        <section className="section">
            <div className="split">
                <div>
                    <h2>Všetko, čo hľadáte</h2>
                    <p>Prehľadný zoznam salónov a služieb vo vašom meste. Filtrujte podľa kategórie, lokality alebo hodnotenia.</p>
                    <ul style={{ listStyle: "none", marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <li style={{display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)"}}>
                            <span style={{color: "var(--primary-color)", fontSize: "18px"}}>✓</span>
                            Kaderníctva a barber shopy
                        </li>
                        <li style={{display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)"}}>
                            <span style={{color: "var(--primary-color)", fontSize: "18px"}}>✓</span>
                            Manikúra a pedikúra
                        </li>
                        <li style={{display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)"}}>
                            <span style={{color: "var(--primary-color)", fontSize: "18px"}}>✓</span>
                            Masáže a fyzioterapia
                        </li>
                        <li style={{display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)"}}>
                            <span style={{color: "var(--primary-color)", fontSize: "18px"}}>✓</span>
                            Kozmetika a starostlivosť o pleť
                        </li>
                    </ul>
                </div>
                 <div className="illustration">
                    <svg viewBox="0 0 420 320" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                        <linearGradient id="gSearch" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff" />
                            <stop offset="100%" stopColor="#f0f8ff" />
                        </linearGradient>
                        </defs>
                        <rect width="420" height="320" fill="#f9fbfc" />
                        <circle cx="210" cy="160" r="100" fill="#e9f4ff" />
                        
                        <rect x="110" y="80" width="200" height="160" rx="12" fill="white" stroke="#e0e0e0" strokeWidth="2" />
                        
                        {/* Search Input */}
                        <rect x="130" y="100" width="160" height="24" rx="12" fill="#f5f5f5" />
                        <circle cx="275" cy="112" r="6" fill="#d4a373" />
                        
                        {/* List Items */}
                        <rect x="130" y="140" width="160" height="40" rx="6" fill="#fff" stroke="#eee" />
                        <rect x="140" y="150" width="20" height="20" rx="4" fill="#eee" />
                        <rect x="170" y="152" width="80" height="8" rx="4" fill="#333" opacity="0.8" />
                        <rect x="170" y="164" width="50" height="6" rx="3" fill="#999" opacity="0.6" />
                        
                        <rect x="130" y="190" width="160" height="40" rx="6" fill="#fff" stroke="#eee" />
                        <rect x="140" y="200" width="20" height="20" rx="4" fill="#eee" />
                        <rect x="170" y="202" width="80" height="8" rx="4" fill="#333" opacity="0.8" />
                        <rect x="170" y="214" width="50" height="6" rx="3" fill="#999" opacity="0.6" />
                        
                        {/* Floating elements */}
                        <g transform="translate(280 200)">
                             <circle cx="0" cy="0" r="30" fill="#fff0f3" />
                             <text x="0" y="5" textAnchor="middle" fontSize="16" fill="#d4a373">★</text>
                        </g>
                    </svg>
                </div>
            </div>
        </section>
        
        <section className="section" style={{ background: "#f8f9fa" }}>
            <div className="split">
                 <div className="illustration">
                    <svg viewBox="0 0 420 320" xmlns="http://www.w3.org/2000/svg">
                        <rect width="420" height="320" fill="#f8f9fa" />
                        <rect x="130" y="60" width="160" height="200" rx="16" fill="white" stroke="#e0e0e0" />
                        
                        {/* Calendar Header */}
                        <rect x="130" y="60" width="160" height="40" rx="16" fill="#d4a373" opacity="0.1" />
                        <rect x="150" y="75" width="80" height="10" rx="5" fill="#d4a373" />
                        
                        {/* Days */}
                        <g transform="translate(145 120)">
                            <circle cx="10" cy="10" r="12" fill="#f0f0f0" />
                            <circle cx="42" cy="10" r="12" fill="#d4a373" />
                            <circle cx="74" cy="10" r="12" fill="#f0f0f0" />
                            <circle cx="106" cy="10" r="12" fill="#f0f0f0" />
                        </g>
                        
                        {/* Slots */}
                        <rect x="145" y="160" width="130" height="30" rx="6" fill="#fff0f3" stroke="#e6cfd5" />
                        <rect x="145" y="200" width="130" height="30" rx="6" fill="#fff" stroke="#eee" />
                    </svg>
                </div>
                <div>
                    <h2>Rezervácia bez čakania</h2>
                    <p>Už žiadne telefonovanie a dohadovanie termínov. V aplikácii vidíte voľné kapacity v reálnom čase.</p>
                    <p>
                        Kliknite na vybraný čas, potvrďte a je to. O všetkom vás budeme informovať notifikáciou.
                        Potrebujete zmeniť termín? Žiadny problém, zvládnete to na pár klikov.
                    </p>
                </div>
            </div>
        </section>

        <section className="section">
            <div className="split">
                <div>
                    <h2>Vaše obľúbené miesta</h2>
                    <p>Uložte si salóny, kam sa radi vraciate. Prezrite si históriu svojich návštev a jednoducho sa objednajte znova.</p>
                    <p>
                        Hodnoťte služby, pridávajte recenzie a pomôžte ostatným objaviť kvalitu.
                    </p>
                </div>
                <div className="illustration">
                    <svg viewBox="0 0 420 320" xmlns="http://www.w3.org/2000/svg">
                         <rect width="420" height="320" fill="#f9fbfc" />
                         <path d="M210 60 L240 130 L320 130 L250 180 L280 260 L210 210 L140 260 L170 180 L100 130 L180 130 Z" fill="#fff" stroke="#d4a373" strokeWidth="2" />
                         <circle cx="210" cy="160" r="40" fill="#d4a373" opacity="0.1" />
                         <text x="210" y="170" textAnchor="middle" fontSize="32" fill="#d4a373">♥</text>
                    </svg>
                </div>
            </div>
        </section>
        
        <section className="section" style={{ textAlign: "center", padding: "80px 20px" }}>
            <h2>Stiahnite si Bukni Si ešte dnes</h2>
            <p style={{ maxWidth: "600px", margin: "0 auto 40px auto", color: "var(--text-muted)" }}>
                Pridajte sa k tisíckam spokojných používateľov a zažite nový štandard v objednávaní služieb.
            </p>
             <div className="app-row" style={{ justifyContent: "center" }}>
                <a href="#" className="store-btn" style={{ padding: "12px 24px" }}>
                    <span style={{fontSize: "32px"}}></span>
                    <div className="store-btn-text">
                    <span className="small-txt" style={{ fontSize: "12px" }}>Stiahnuť v</span>
                    <span className="big-txt" style={{ fontSize: "18px" }}>App Store</span>
                    </div>
                </a>
                <a href="#" className="store-btn" style={{ padding: "12px 24px" }}>
                    <span style={{fontSize: "32px"}}>▶</span>
                    <div className="store-btn-text">
                    <span className="small-txt" style={{ fontSize: "12px" }}>Získať v</span>
                    <span className="big-txt" style={{ fontSize: "18px" }}>Google Play</span>
                    </div>
                </a>
            </div>
        </section>

      </main>
    </>
  );
}
