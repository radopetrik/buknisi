import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  city_slug: string;
  category_slug: string;
  slug: string;
};

type DetailPageProps = {
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
  id: string;
  name: string;
  price: number | string | null;
  duration: number;
  price_type: "fixed" | "free" | "dont_show" | "starts_at";
  description: string | null;
};

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address_text: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  contact_phone: string | null;
  review_rank: number | null;
  city: CityRecord | null;
  category: CategoryRecord | null;
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

async function fetchCompany(params: RouteParams) {
  const supabase = await createClient();

  const { data: companyData, error } = await supabase
    .from("companies")
    .select(
      `id,
       name,
       slug,
       description,
       address_text,
       website,
       facebook,
       instagram,
       contact_phone,
       review_rank,
       city:cities(id, name, slug),
       category:categories(id, name, slug),
       services(id, name, price, duration, price_type, description)
      `,
    )
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const company = companyData as CompanyRecord | null;

  if (!company || !company.city || !company.category) {
    return null;
  }

  if (company.city.slug !== params.city_slug || company.category.slug !== params.category_slug) {
    return null;
  }

  return company;
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const company = await fetchCompany(params);

  if (!company) {
    return {
      title: "Detail podniku",
    };
  }

  return {
    title: `${company.name} · ${company.city?.name ?? "Katalóg"}`,
    description: company.description ?? "Objavte služby a rezervujte si termín online.",
  };
}

export default async function CompanyDetailPage({ params }: DetailPageProps) {
  const company = await fetchCompany(params);

  if (!company) {
    notFound();
  }

  const city = company.city!;
  const category = company.category!;

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
              aria-label="Procedúra"
              className="flex-1 bg-transparent px-4 text-base font-medium tracking-[0.02em] text-[var(--color-foreground)] outline-none placeholder:text-[var(--color-muted)]"
              defaultValue={category.name}
              placeholder="Procedúra"
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
            <button
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold uppercase tracking-[0.16em] text-white"
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
          <Link className="transition hover:text-[var(--color-primary)]" href={`/${city.slug}/${category.slug}/`}>
            {city.name}
          </Link>{" "}
          /{" "}
          <span className="font-semibold text-[var(--color-foreground)]">{company.name}</span>
        </div>

        <section className="mt-6 grid gap-8 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm md:grid-cols-[1.2fr,1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-[#f3f3f3]">
            <div className="flex h-80 items-center justify-center text-body text-[var(--color-muted)] md:h-full">
              Galéria pripravujeme
            </div>
            {company.review_rank ? (
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1 text-sm font-semibold text-[var(--color-foreground)] shadow">
                <span className="text-[#f1c40f]">★</span>
                {company.review_rank.toFixed(1)}
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="heading-page text-[var(--color-foreground)]">
                {company.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-3 text-body-muted">
                <span>
                  {category.name} • {company.address_text ?? city.name}
                </span>
                {company.contact_phone ? <span>{company.contact_phone}</span> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a66]">
                {category.name}
              </span>
              {company.website ? (
                <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a66]">
                  Online rezervácia
                </span>
              ) : null}
              {company.contact_phone ? (
                <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a66]">
                  Telefonická objednávka
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold tracking-[0.08em]">
              {company.website ? (
                <a
                  className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-[#c18b5c]"
                  href={company.website}
                  rel="noreferrer"
                  target="_blank"
                >
                  Rezervovať online
                </a>
              ) : null}
              {company.contact_phone ? (
                <a
                  className="rounded-full border border-[var(--color-border)] px-5 py-2 text-sm font-semibold tracking-[0.08em] text-[var(--color-foreground)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  href={`tel:${company.contact_phone}`}
                >
                  Zavolať
                </a>
              ) : null}
            </div>
            <p className="text-body-muted">
              {company.description ?? "Podnik čoskoro doplní podrobný popis služieb."}
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold tracking-[0.08em]">
              {company.facebook ? (
                <a className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]" href={company.facebook} rel="noreferrer" target="_blank">
                  Facebook
                </a>
              ) : null}
              {company.instagram ? (
                <a className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]" href={company.instagram} rel="noreferrer" target="_blank">
                  Instagram
                </a>
              ) : null}
              {company.website ? (
                <a className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]" href={company.website} rel="noreferrer" target="_blank">
                  Webstránka
                </a>
              ) : null}
            </div>

          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
            <h2 className="heading-section text-[var(--color-foreground)]">
              Služby & cenník
            </h2>
            <div className="space-y-0">
              {company.services?.length ? (
                company.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between border-t border-dashed border-[#eeeeee] py-3"
                  >
                    <div className="pr-4">
                      <div className="text-base font-semibold tracking-[0.02em] text-[var(--color-foreground)]">
                        {service.name}
                      </div>
                      <div className="text-subtle text-[#999999]">
                        {service.duration} min
                      </div>
                      {service.description ? (
                        <p className="mt-2 text-subtle text-[var(--color-muted)]">{service.description}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[var(--color-primary)]">
                        {formatPrice(service)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[#fafafa] px-4 py-8 text-center text-body text-[var(--color-muted)]">
                  Cenník bude čoskoro dostupný.
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
            <h2 className="heading-section text-[var(--color-foreground)]">
              Kontakt & poloha
            </h2>
            <div className="space-y-3 text-body text-[var(--color-muted)]">
              <div>
                <span className="font-semibold tracking-[0.02em] text-[var(--color-foreground)]">Adresa:</span>
                <p>{company.address_text ?? city.name}</p>
              </div>
              {company.contact_phone ? (
                <div>
                  <span className="font-semibold tracking-[0.02em] text-[var(--color-foreground)]">Telefón:</span>
                  <p>{company.contact_phone}</p>
                </div>
              ) : null}
              {company.website ? (
                <div>
                  <span className="font-semibold tracking-[0.02em] text-[var(--color-foreground)]">Web:</span>
                  <p>{company.website}</p>
                </div>
              ) : null}
            </div>
            <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[#fafafa] text-body text-[var(--color-muted)]">
              Mapa bude čoskoro dostupná
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
