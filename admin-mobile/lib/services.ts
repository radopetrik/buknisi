import { supabase } from "@/lib/supabase";

export const priceTypes = ["fixed", "free", "dont_show", "starts_at"] as const;
export type PriceType = (typeof priceTypes)[number];

export type ServiceCategoryRow = {
  id: string;
  name: string;
};

export type AddonRow = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string | null;
};

export type ServiceRow = {
  id: string;
  name: string;
  price: number;
  price_type: PriceType;
  duration: number;
  is_mobile: boolean;
  service_category_id: string | null;
  sub_category_id: string | null;
};

export type SubCategoryOption = {
  id: string;
  label: string;
};

export type ServiceAddonLink = {
  service_id: string;
  addon_id: string;
};

export async function fetchServiceCategories(companyId: string) {
  const { data, error } = await supabase
    .from("service_categories")
    .select("id, name")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ServiceCategoryRow[];
}

export async function createServiceCategory(companyId: string, name: string) {
  const { data, error } = await supabase
    .from("service_categories")
    .insert({ company_id: companyId, name: name.trim() })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function updateServiceCategory(params: { companyId: string; id: string; name: string }) {
  const { companyId, id, name } = params;
  const { error } = await supabase
    .from("service_categories")
    .update({ name: name.trim() })
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteServiceCategory(params: { companyId: string; id: string }) {
  const { companyId, id } = params;
  const { error } = await supabase
    .from("service_categories")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function fetchCompanyExtraCategoryIds(companyId: string) {
  const { data, error } = await supabase
    .from("company_extra_categories")
    .select("category_id")
    .eq("company_id", companyId);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.category_id as string).filter(Boolean);
}

export async function fetchSubCategoriesForCategoryIds(categoryIds: string[]) {
  if (categoryIds.length === 0) return [] as SubCategoryOption[];

  const { data, error } = await supabase
    .from("sub_categories")
    .select("id, name, category:categories(name)")
    .in("category_id", categoryIds)
    .order("ordering", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const categoryValue = row.category;
    const categoryName = Array.isArray(categoryValue) ? categoryValue[0]?.name : categoryValue?.name;
    const label = categoryName ? `${categoryName} • ${row.name}` : row.name;

    return { id: row.id, label } satisfies SubCategoryOption;
  });
}

export async function fetchAddons(companyId: string) {
  const { data, error } = await supabase
    .from("addons")
    .select("id, name, price, duration, description")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    return {
      id: row.id,
      name: row.name,
      price: Number(row.price ?? 0),
      duration: Number(row.duration ?? 0),
      description: row.description ?? null,
    } satisfies AddonRow;
  });
}

export async function createAddon(companyId: string, payload: Omit<AddonRow, "id">) {
  const { data, error } = await supabase
    .from("addons")
    .insert({
      company_id: companyId,
      name: payload.name.trim(),
      price: payload.price,
      duration: payload.duration,
      description: payload.description ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function updateAddon(params: { companyId: string; id: string; patch: Partial<Omit<AddonRow, "id">> }) {
  const { companyId, id, patch } = params;
  const updatePayload: Record<string, unknown> = { ...patch };

  if (typeof updatePayload.name === "string") {
    updatePayload.name = updatePayload.name.trim();
  }

  const { error } = await supabase
    .from("addons")
    .update(updatePayload)
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteAddon(params: { companyId: string; id: string }) {
  const { companyId, id } = params;
  const { error } = await supabase
    .from("addons")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function fetchServices(companyId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, price, price_type, duration, is_mobile, service_category_id, sub_category_id")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    return {
      id: row.id,
      name: row.name,
      price: Number(row.price ?? 0),
      price_type: (row.price_type ?? "fixed") as PriceType,
      duration: Number(row.duration ?? 0),
      is_mobile: Boolean(row.is_mobile ?? false),
      service_category_id: row.service_category_id ?? null,
      sub_category_id: row.sub_category_id ?? null,
    } satisfies ServiceRow;
  });
}

export async function createService(companyId: string, payload: Omit<ServiceRow, "id">) {
  const { data, error } = await supabase
    .from("services")
    .insert({
      company_id: companyId,
      name: payload.name.trim(),
      price: payload.price,
      price_type: payload.price_type,
      duration: payload.duration,
      is_mobile: payload.is_mobile,
      service_category_id: payload.service_category_id,
      sub_category_id: payload.sub_category_id,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function updateService(params: { companyId: string; id: string; patch: Partial<Omit<ServiceRow, "id">> }) {
  const { companyId, id, patch } = params;
  const updatePayload: Record<string, unknown> = { ...patch };

  if (typeof updatePayload.name === "string") {
    updatePayload.name = updatePayload.name.trim();
  }

  const { error } = await supabase
    .from("services")
    .update(updatePayload)
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteService(params: { companyId: string; id: string }) {
  const { companyId, id } = params;
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("company_id", companyId)
    .eq("id", id);

  if (error) throw error;
}

export async function fetchServiceAddonLinks(serviceIds: string[]) {
  if (serviceIds.length === 0) return [] as ServiceAddonLink[];

  const { data, error } = await supabase
    .from("service_addons")
    .select("service_id, addon_id")
    .in("service_id", serviceIds);

  if (error) throw error;
  return (data ?? []) as ServiceAddonLink[];
}

export async function setServiceAddons(serviceId: string, addonIds: string[]) {
  const uniqueIds = Array.from(new Set(addonIds));

  const { error: deleteError } = await supabase
    .from("service_addons")
    .delete()
    .eq("service_id", serviceId);

  if (deleteError) throw deleteError;

  if (uniqueIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("service_addons")
    .insert(uniqueIds.map((addonId) => ({ service_id: serviceId, addon_id: addonId })));

  if (insertError) throw insertError;
}

export async function setAddonServices(addonId: string, serviceIds: string[]) {
  const uniqueIds = Array.from(new Set(serviceIds));

  const { error: deleteError } = await supabase
    .from("service_addons")
    .delete()
    .eq("addon_id", addonId);

  if (deleteError) throw deleteError;

  if (uniqueIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("service_addons")
    .insert(uniqueIds.map((serviceId) => ({ service_id: serviceId, addon_id: addonId })));

  if (insertError) throw insertError;
}
