import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-links">
            <Link href="/blog">Blog</Link>
            <Link href="/o-nas">O nás</Link>
            <Link href="/caste-otazky">Časté otázky</Link>
            <Link href="/ochrana-osobnych-udajov">Zásady ochrany osobných údajov</Link>
            <Link href="/obchodne-podmienky">Obchodné podmienky</Link>
            <Link href="/#">Kariéra</Link>
            <Link href="/pre-firmy">Pre firmy</Link>
            <Link href="/kontakt">Kontakt</Link>
          </div>
          <div className="app-row">
            <a href="#" className="store-btn">
              <span style={{ fontSize: "20px" }}></span>
              <div className="store-btn-text">
                <span className="small-txt">Stiahnuť v</span>
                <span className="big-txt">App Store</span>
              </div>
            </a>
            <a href="#" className="store-btn">
              <span style={{ fontSize: "20px" }}>▶</span>
              <div className="store-btn-text">
                <span className="small-txt">Získať v</span>
                <span className="big-txt">Google Play</span>
              </div>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <Link href="/" className="footer-logo">
              <img src="/logo_buknisi.png" alt="Bukni Si" />
            </Link>
            <span className="small-txt">© 2025 Bukni Si. Všetky práva vyhradené</span>
          </div>
          <div className="social-icons">
            <a href="#" className="social-circle">IG</a>
            <a href="#" className="social-circle">FB</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
