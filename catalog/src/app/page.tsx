import Link from "next/link";

const recommendedSalons = [
  {
    name: "Mitruk Barber Shop",
    location: "ul. Andrzeja Struga 14, Stuttgart",
    rating: "4.9",
    reviews: 320,
    tags: ["Barber", "Premium"],
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Baber Skawina Barber",
    location: "ul. Krakowská 19A, Skawina",
    rating: "4.9",
    reviews: 180,
    tags: ["Barber", "Rýchla rezervácia"],
    image:
      "https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Ciach&Style Barbershop",
    location: "Książnicka 34, Lubin",
    rating: "5.0",
    reviews: 150,
    tags: ["Mužské strihy", "Študentská zľava"],
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Barber SHOP & Tattoo",
    location: "Topoľová 14, Prievidza",
    rating: "4.8",
    reviews: 290,
    tags: ["Barber", "Tattoo"],
    image:
      "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=800&q=80",
  },
];

const quickCategories = [
  "Nechtové salóny",
  "Barberi",
  "Kozmetika",
  "Masáže",
  "Obočie & mihalnice",
  "Fyzioterapia",
];

const cityLinks = [
  "Bratislava",
  "Trnava",
  "Nitra",
  "Žilina",
  "Banská Bystrica",
  "Košice",
  "Praha",
  "Brno",
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col"> 
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-header)] shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4">
          <Link className="inline-flex items-center" href="/">
            <img
              src="/logo_buknisi.png"
              alt="Bukni Si"
              className="h-[52px] w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-5 text-xs font-bold uppercase tracking-wide text-[var(--color-foreground)] md:flex">
            <Link className="transition-colors hover:text-[var(--color-primary)]" href="/bratislava/barber/">
              Preskúmať salóny
            </Link>
            <a className="transition-colors hover:text-[var(--color-primary)]" href="#appky">
              Stiahnuť appku
            </a>
            <Link className="transition-colors hover:text-[var(--color-primary)]" href="/pre-firmy">
              Pre firmy
            </Link>
            <Link
              className="rounded-full border border-[#dddddd] px-3 py-2 font-bold transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              href="/login"
            >
              Prihlásiť sa
            </Link>
            <Link
              className="rounded-full bg-[var(--color-primary)] px-4 py-2 font-bold text-white transition-colors hover:bg-[#c18b5c]"
              href="/registracia"
            >
              Registrácia
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-[var(--color-background)]">
        <section className="relative isolate flex min-h-[70vh] items-center justify-center overflow-hidden text-white">
          <div className="absolute inset-0 -z-10">
            <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center brightness-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/35" />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
            <h1 className="font-display text-4xl font-semibold md:text-6xl">
              Buď sebavedomá
            </h1>
            <p className="mt-3 text-lg text-gray-100 md:text-xl">
              Objavujte a rezervujte krásu & wellness pri vás doma či v meste.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex w-full max-w-3xl flex-col items-stretch gap-2 rounded-full border border-white/20 bg-white/95 p-2 text-left text-sm shadow-2xl shadow-black/20 md:flex-row md:items-center">
                <label className="flex flex-1 items-center gap-3 border-b border-white/20 px-3 py-2 text-sm text-[var(--color-foreground)] md:border-b-0 md:border-r md:px-5">
                  <span className="font-semibold text-[var(--color-muted)]">Čo</span>
                  <input
                    className="w-full bg-transparent text-base font-medium text-[var(--color-foreground)] outline-none"
                    placeholder="Hľadať služby alebo podniky"
                    type="text"
                  />
                </label>
                <label className="flex flex-1 items-center gap-3 border-b border-white/20 px-3 py-2 text-sm text-[var(--color-foreground)] md:border-b-0 md:border-r md:px-5">
                  <span className="font-semibold text-[var(--color-muted)]">Kde</span>
                  <input
                    className="w-full bg-transparent text-base font-medium text-[var(--color-foreground)] outline-none"
                    placeholder="Lokalita"
                    type="text"
                  />
                </label>
                <label className="flex flex-1 items-center gap-3 px-3 py-2 text-sm text-[var(--color-foreground)] md:px-5">
                  <span className="font-semibold text-[var(--color-muted)]">Kedy</span>
                  <input
                    className="w-full bg-transparent text-base font-medium text-[var(--color-foreground)] outline-none"
                    placeholder="Vyberte dátum"
                    type="text"
                  />
                </label>
                <Link
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-base font-bold md:w-12 md:rounded-full"
                  href="/bratislava/barber/"
                >
                  🔍
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {quickCategories.map((label) => (
                  <Link
                    key={label}
                    className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:border-white/40 hover:bg-white/25"
                    href="/bratislava/barber/"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">
                Odporúčané miesta
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Vybrali sme obľúbené podniky s výborným hodnotením.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              href="/bratislava/barber/"
            >
              Zobraziť všetky
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {recommendedSalons.map((salon) => (
              <Link
                key={salon.name}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#e7d8cb]"
                href="/bratislava/barber/c/mitruk-barber-shop"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    alt={salon.name}
                    className="h-full w-full object-cover"
                    src={salon.image}
                  />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1 text-sm font-semibold text-[var(--color-foreground)] shadow">
                    <span className="text-[#f1c40f]">★</span>
                    {salon.rating} · {salon.reviews}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-4 py-5">
                  <h3 className="font-display text-lg font-semibold">
                    {salon.name}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)]">{salon.location}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {salon.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[#8a5a66]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold">
                Termíny vybavené lepšie
              </h2>
              <p className="text-base leading-relaxed text-[var(--color-muted)]">
                Hľadáte najbližší termín u barbera, kaderníčky, fyzioterapeuta alebo
                nail artistky? Rezervácia brady, farbenia obočia či masáže je otázkou pár klikov.
              </p>
              <p className="text-base leading-relaxed text-[var(--color-muted)]">
                <span className="font-semibold text-[var(--color-foreground)]">Bukni Si</span> je aplikácia na
                rezervácie krásy a wellness. Zarezervujete sa za sekundy, bez telefonovania – kedykoľvek,
                odkiaľkoľvek.
              </p>
              <p className="text-base font-semibold text-[var(--color-foreground)]">
                Objavte top podniky vo svojom okolí a rezervujte okamžite.
              </p>
            </div>
            <div className="mx-auto max-w-lg">
              <svg
                aria-label="Ilustrácia rezervácie"
                className="h-auto w-full"
                viewBox="0 0 420 320"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="landing-g1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffe9df" />
                    <stop offset="100%" stopColor="#fff7f2" />
                  </linearGradient>
                </defs>
                <rect fill="#f9fbfc" height="320" width="420" x="0" y="0" />
                <circle cx="120" cy="110" fill="#fff0f3" r="90" />
                <circle cx="310" cy="140" fill="#e9f4ff" r="70" />
                <rect fill="url(#landing-g1)" height="110" rx="12" stroke="#e9d8cb" width="240" x="90" y="140" />
                <rect fill="#d4a373" height="90" opacity="0.9" rx="8" width="60" x="120" y="160" />
                <rect fill="#fff" height="70" rx="10" stroke="#e5d4c5" width="100" x="200" y="160" />
                <rect fill="#f3ebe4" height="10" rx="5" width="80" x="210" y="175" />
                <rect fill="#f3ebe4" height="10" rx="5" width="80" x="210" y="195" />
                <rect fill="#f3ebe4" height="10" rx="5" width="60" x="210" y="215" />
                <path d="M320 130c0 28-36 66-36 66s-36-38-36-66a36 36 0 0 1 72 0z" fill="#d4a373" opacity="0.9" />
                <circle cx="284" cy="130" fill="#fff" r="14" />
                <path d="M284 118c6 0 11 5 11 11s-5 11-11 11-11-5-11-11 5-11 11-11z" fill="#f6efe9" />
                <path d="M284 126c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4z" fill="#d4a373" />
                <line stroke="#f6efe9" strokeWidth="6" x1="120" x2="120" y1="160" y2="250" />
                <line stroke="#f6efe9" strokeWidth="6" x1="150" x2="150" y1="160" y2="250" />
                <rect fill="#f3ebe4" height="10" rx="4" width="80" x="108" y="150" />
              </svg>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:items-center">
          <div className="mx-auto max-w-lg">
            <svg
              aria-label="Pripomienky v mobile"
              className="h-auto w-full"
              viewBox="0 0 420 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="landing-g2" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#e8f5ff" />
                  <stop offset="100%" stopColor="#f6fafe" />
                </linearGradient>
              </defs>
              <rect fill="#f9fbfc" height="320" width="420" />
              <circle cx="300" cy="110" fill="#e9f4ff" r="80" />
              <circle cx="140" cy="170" fill="#fff6ef" r="95" />
              <rect fill="url(#landing-g2)" height="220" rx="26" stroke="#d8e5f2" width="140" x="140" y="60" />
              <rect fill="#fff" height="160" rx="16" stroke="#e6eef5" width="104" x="158" y="90" />
              <rect fill="#d4a373" height="6" opacity="0.9" rx="3" width="44" x="190" y="72" />
              <circle cx="210" cy="270" fill="#d4a373" r="12" />
              <rect fill="#f3ebe4" height="12" rx="6" width="68" x="176" y="110" />
              <rect fill="#f3ebe4" height="10" rx="5" width="88" x="176" y="134" />
              <rect fill="#f3ebe4" height="10" rx="5" width="60" x="176" y="154" />
              <rect fill="#e9f4ff" height="12" rx="6" width="88" x="176" y="182" />
              <rect fill="#e9f4ff" height="10" rx="5" width="72" x="176" y="206" />
              <g transform="translate(275 92)">
                <circle cx="0" cy="0" fill="#d4a373" r="28" />
                <rect fill="#fff" height="22" rx="6" width="12" x="-6" y="-16" />
                <circle cx="0" cy="10" fill="#fff" r="10" />
                <circle cx="-18" cy="-22" fill="#fff0f3" r="6" />
                <circle cx="18" cy="-22" fill="#fff0f3" r="6" />
              </g>
            </svg>
          </div>
          <div className="space-y-4">
            <h2 className="font-display text-3xl font-semibold">
              Niečo vám do toho vošlo? Máme vás.
            </h2>
            <p className="text-base leading-relaxed text-[var(--color-muted)]">
              Stiahnite si Bukni Si, online rezervačnú appku, a spravujte termíny odkiaľkoľvek. Preplánujte alebo
              zrušte bez telefonovania.
            </p>
            <p className="text-base leading-relaxed text-[var(--color-muted)]">
              Keďže vieme, že život je hektický, pošleme vám pripomienky. Už nikdy nezabudnete na ďalší termín.
            </p>
            <div className="flex flex-wrap gap-4" id="appky">
              <a
                className="inline-flex items-center gap-3 rounded-lg border border-black bg-black px-4 py-3 text-white transition hover:border-[var(--color-primary)]"
                href="#"
              >
                <span className="text-2xl"></span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-white/70">Stiahnuť v</span>
                  <span className="text-sm font-semibold">App Store</span>
                </span>
              </a>
              <a
                className="inline-flex items-center gap-3 rounded-lg border border-black bg-black px-4 py-3 text-white transition hover:border-[var(--color-primary)]"
                href="#"
              >
                <span className="text-xl">▶</span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] text-white/70">Získať v</span>
                  <span className="text-sm font-semibold">Google Play</span>
                </span>
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold">
                Objednajte sa k najlepším
              </h2>
              <p className="text-base leading-relaxed text-[var(--color-muted)]">
                Prezrite si vibe podniku, recenzie a portfólio práce. Vyberte si miesto, ktoré vám sedí – od
                prémiových barberov až po najmilšie nechtové štúdio.
              </p>
              <p className="text-base leading-relaxed text-[var(--color-muted)]">
                Ušetrite čas a vybavte ďalší termín online. S Bukni Si je plánovanie krásy jednoduché a bez stresu.
              </p>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c18b5c]"
                href="/bratislava/barber/"
              >
                Nájsť podnik
              </Link>
            </div>
            <div className="mx-auto max-w-lg">
              <svg
                aria-label="Hodnotenia v aplikácii"
                className="h-auto w-full"
                viewBox="0 0 420 320"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="landing-g3" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef4ec" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
                <rect fill="#f9fbfc" height="320" width="420" />
                <circle cx="120" cy="110" fill="#fff6ef" r="90" />
                <circle cx="310" cy="140" fill="#e9f4ff" r="70" />
                <rect fill="url(#landing-g3)" height="200" rx="18" stroke="#e8d6c7" width="160" x="130" y="60" />
                <rect fill="#fff" height="160" rx="12" stroke="#eaded0" width="120" x="150" y="90" />
                <rect fill="#d4a373" height="12" opacity="0.9" rx="6" width="80" x="170" y="110" />
                <rect fill="#f3ebe4" height="10" rx="5" width="96" x="170" y="138" />
                <rect fill="#f3ebe4" height="10" rx="5" width="76" x="170" y="158" />
                <rect fill="#f3ebe4" height="10" rx="5" width="88" x="170" y="178" />
                <rect fill="#f3ebe4" height="10" rx="5" width="72" x="170" y="198" />
                <rect fill="#d4a373" height="24" opacity="0.9" rx="12" width="60" x="190" y="226" />
              </svg>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <h2 className="font-display text-3xl font-semibold">
            Populárne mestá
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Rezervujte si miesto vo vašom meste alebo objavte nové.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cityLinks.map((city) => (
              <Link
                key={city}
                className="text-sm font-semibold text-[var(--color-foreground)] transition hover:text-[var(--color-primary)]"
                href="/bratislava/barber/"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto bg-[#231f20] text-sm text-[#b0b0b0]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col gap-8 border-b border-[#3a3a3a] pb-10 md:flex-row md:items-start md:justify-between">
            <Link className="inline-flex items-center" href="/">
              <img
                alt="Bukni Si"
                className="h-12 w-auto"
                src="/logo_buknisi.png"
              />
            </Link>
            <div className="flex flex-wrap gap-6 text-sm font-semibold text-[#e0e0e0]">
              <Link className="transition hover:text-[var(--color-primary)]" href="/bratislava/barber/">
                Vyhľadať podnik
              </Link>
              <Link className="transition hover:text-[var(--color-primary)]" href="/pre-firmy">
                Pridajte sa ako firma
              </Link>
              <Link className="transition hover:text-[var(--color-primary)]" href="/o-nas">
                O nás
              </Link>
              <Link className="transition hover:text-[var(--color-primary)]" href="/kontakt">
                Kontakt
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3a3a] text-xs font-bold text-white transition hover:bg-[var(--color-primary)]"
                href="#"
              >
                FB
              </a>
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3a3a] text-xs font-bold text-white transition hover:bg-[var(--color-primary)]"
                href="#"
              >
                IG
              </a>
              <a
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a3a3a] text-xs font-bold text-white transition hover:bg-[var(--color-primary)]"
                href="#"
              >
                TT
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
            <span className="text-xs text-[#777777]">
              © {new Date().getFullYear()} Bukni Si. Všetky práva vyhradené.
            </span>
            <div className="flex flex-wrap gap-5 text-xs text-[#777777]">
              <Link className="transition hover:text-white" href="/gdpr">
                Ochrana súkromia
              </Link>
              <Link className="transition hover:text-white" href="/obchodne-podmienky">
                Obchodné podmienky
              </Link>
              <Link className="transition hover:text-white" href="/cookies">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
