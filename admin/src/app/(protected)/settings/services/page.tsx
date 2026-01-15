import { redirect } from "next/navigation";

import { getUserWithCompany, createClient } from "@/lib/supabase/server";

import { ServicesManager } from "./_components/services-manager";
import type { Addon, Service, ServiceAddonLink, ServiceCategory, SubCategoryOption } from "./types";

export default async function SettingsServicesPage() {
  const { company } = await getUserWithCompany();

  if (!company) {
    redirect("/login?error=no_company");
  }

  const supabase = await createClient();

  const [services, categories, addons, serviceAddons, companyRecord, companyExtraCategories] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, price, price_type, duration, is_mobile, service_category_id, sub_category_id")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("service_categories")
      .select("id, name")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("addons")
      .select("id, name, price, duration, description")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("service_addons")
      .select("service_id, addon_id, services!inner(company_id)")
      .eq("services.company_id", company.id),
    supabase.from("companies").select("category_id").eq("id", company.id).maybeSingle(),
    supabase.from("company_extra_categories").select("category_id").eq("company_id", company.id),
  ]);

  if (services.error) {
    throw services.error;
  }
  if (categories.error) {
    throw categories.error;
  }
  if (addons.error) {
    throw addons.error;
  }
  if (serviceAddons.error) {
    throw serviceAddons.error;
  }
  if (companyRecord.error) {
    throw companyRecord.error;
  }
  if (companyExtraCategories.error) {
    throw companyExtraCategories.error;
  }

  const mappedServiceAddons: ServiceAddonLink[] =
    serviceAddons.data?.map(({ service_id, addon_id }) => ({ service_id, addon_id })) ?? [];

  const allowedCategoryIds = Array.from(
    new Set(
      [
        companyRecord.data?.category_id ?? null,
        ...(companyExtraCategories.data?.map((row) => row.category_id) ?? []),
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  let mappedSubCategories: SubCategoryOption[] = [];

  if (allowedCategoryIds.length > 0) {
    const subCategories = await supabase
      .from("sub_categories")
      .select("id, name, category:categories(name)")
      .in("category_id", allowedCategoryIds)
      .order("ordering", { ascending: true });

    if (subCategories.error) {
      throw subCategories.error;
    }

    type SubCategoryRow = {
      id: string;
      name: string;
      category?: { name: string } | { name: string }[] | null;
    };

    mappedSubCategories =
      (subCategories.data as unknown as SubCategoryRow[] | null)?.map((row) => {
        const categoryValue = row.category;
        const categoryName = Array.isArray(categoryValue) ? categoryValue[0]?.name : categoryValue?.name;
        const label = categoryName ? `${categoryName} • ${row.name}` : row.name;
        return { id: row.id, label };
      }) ?? [];
  }

  return (
    <ServicesManager
      initialData={{
        services: (services.data ?? []) as Service[],
        categories: (categories.data ?? []) as ServiceCategory[],
        addons: (addons.data ?? []) as Addon[],
        serviceAddons: mappedServiceAddons,
        subCategories: mappedSubCategories,
      }}
    />
  );
}
