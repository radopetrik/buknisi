import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  city_slug: string;
  category_slug: string;
};

type ListingPageProps = {
  params: RouteParams;
};

type CityRecord = {
  id: string;
  name: string;
  slug: string;
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
};

type ServiceRecord = {
  name: string;
  price: number | string | null;
  duration: number;
  price_type: "fixed" | "free" | "dont_show" | "starts_at";
};

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
  address_text: string | null;
  review_rank: number | null;
  description: string | null;
  website: string | null;
  contact_phone: string | null;
  services: ServiceRecord[] | null;
};

function formatPrice(service: ServiceRecord) {
  if (service.price_type === "free") {
    return "Zdarma";
  }

  if (service.price_type === "dont_show") {
    return "Na vyžiadanie";
  }

  const numericPrice = Number(service.price ?? 0);

  const amount = new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);

  if (service.price_type === "starts_at") {
    return `Od ${amount}`;
  }

  return amount;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: cityData } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("slug", params.city_slug)
    .maybeSingle();

  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", params.category_slug)
    .maybeSingle();

  const city = cityData as CityRecord | null;
  const category = categoryData as CategoryRecord | null;

  if (!city || !category) {
    return {
      title: "Katalóg podnikov",
    };
  }

  return {
    title: `${category.name} v meste ${city.name}`,
    description: `Pozrite si salóny a služby kategórie ${category.name} v meste ${city.name}.`,
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const supabase = await createClient();

  const { data: cityData, error: cityError } = await supabase
    .from("cities")
    .select("id, name, slug")
    .eq("slug", params.city_slug)
    .maybeSingle();

  const city = cityData as CityRecord | null;

  if (cityError || !city) {
    notFound();
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", params.category_slug)
    .maybeSingle();

  const category = categoryData as CategoryRecord | null;

  if (categoryError || !category) {
    notFound();
  }

  const { data: companiesData, error: companiesError } = await supabase
    .from("companies")
    .select(
      `id,
       name,
       slug,
       address_text,
       review_rank,
       description,
       website,
       contact_phone,
       services(name, price, duration, price_type)
      `,
    )
    .eq("city_id", city.id)
    .eq("category_id", category.id)
    .order("review_rank", { ascending: false, nullsFirst: false });

  if (companiesError) {
    throw companiesError;
  }

  const companies = (companiesData ?? []) as CompanyRecord[];

  const cityCategoryPath = `/${city.slug}/${category.slug}` as const;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-header)] shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
          <Link className="inline-flex items-center" href="/">
            <img
              alt="Bukni Si"
              className="h-[56px] w-auto"
              src="/logo_buknisi.png"
            />
          </Link>
          <div className="hidden flex-grow items-center rounded-full border border-[#eeeeee] bg-[#f9f9f9] p-2 md:flex">
            <input
              aria-label="Hľadať"
              className="flex-1 bg-transparent px-4 text-base font-medium tracking-[0.02em] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)]"
              defaultValue={category.name}
              placeholder="Procedúra alebo podnik"
              type="text"
            />
            <span className="h-6 w-px bg-[#e5e5e5]" />
            <input
              aria-label="Mesto"
              className="flex-1 bg-transparent px-4 text-base font-medium tracking-[0.02em] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)]"
              defaultValue={city.name}
              placeholder="Lokalita"
              type="text"
            />
            <span className="h-6 w-px bg-[#e5e5e5]" />
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#c18b5c]"
              type="button"
            >
              🔍
            </button>
          </div>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              className="text-sm font-semibold tracking-[0.08em] text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
              href="/login"
            >
              Prihlásiť sa
            </Link>
            <Link
              className="text-sm font-semibold tracking-[0.08em] text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
              href="/pre-firmy"
            >
              Pre firmy
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-10 text-body">
        <div className="text-subtle text-[var(--color-muted)]">
          <Link className="transition hover:text-[var(--color-primary)]" href="/">
            🏠 Domov
          </Link>{" "}
          /{" "}
          <span>{city.name}</span>{" "}
          /{" "}
          <span className="font-semibold text-[var(--color-foreground)]">{category.name}</span>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="heading-page">
              {category.name} · {city.name}
            </h1>
            <p className="mt-1 text-body-muted">
              Výsledky filtrované podľa mesta a kategórie. Vyberte si podnik a rezervujte sa online.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold tracking-[0.08em] text-[var(--color-foreground)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              type="button"
            >
              Filtrovať služby
            </button>
            <button
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold tracking-[0.08em] text-[var(--color-foreground)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              type="button"
            >
              Zoradiť podľa hodnotenia
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a66]">
            {category.name}
          </span>
          <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a66]">
            {city.name}
          </span>
        </div>

        <div className="mt-10 space-y-6">
          {companies?.length ? (
            companies.map((company) => (
              <Link
                key={company.id}
                className="flex flex-col gap-6 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#e0d0d4] md:flex-row"
                href={`${cityCategoryPath}/c/${company.slug}`}
              >
                <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-[#f0f0f0] md:h-auto md:w-80">
                  <div className="flex h-full w-full items-center justify-center text-body text-[var(--color-muted)]">
                    Foto pripravujeme
                  </div>

                  {company.review_rank ? (

                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1 text-sm font-semibold text-[var(--color-foreground)] shadow">
                      <span className="text-[#f1c40f]">★</span>
                      {company.review_rank.toFixed(1)}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="border-b border-[#eeeeee] pb-4">
                    <h2 className="heading-card text-[var(--color-foreground)]">
                      {company.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-4 text-body-muted">
                      <span>{company.address_text ?? "Adresa bude doplnená"}</span>
                      {company.contact_phone ? <span>{company.contact_phone}</span> : null}
                      {company.website ? (
                        <span className="truncate">
                          {company.website.replace(/^https?:\/\//, "")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    <p className="text-body-muted">
                      {company.description ?? "Podnik čoskoro doplní popis svojich služieb."}
                    </p>
                    <div className="space-y-0">
                      {company.services?.slice(0, 4).map((service) => (
                        <div
                          key={`${company.id}-${service.name}`}
                          className="flex items-center justify-between border-t border-dashed border-[#eeeeee] py-3 text-sm"
                        >
                          <div>
                           <div className="font-semibold tracking-[0.02em] text-[var(--color-foreground)]">
                             {service.name}
                           </div>
                           <div className="text-subtle text-[#999999]">
                             {service.duration} min
                           </div>

                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-bold text-[var(--color-primary)]">
                              {formatPrice(service)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {!company.services?.length ? (
                        <div className="rounded-xl border border-dashed border-[#eeeeee] bg-[#fafafa] px-4 py-6 text-center text-body text-[var(--color-muted)]">
                          Služby budú čoskoro dostupné.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white p-10 text-center text-body text-[var(--color-muted)]">
              V tejto kombinácii mesta a kategórie zatiaľ nemáme žiadne podniky.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
