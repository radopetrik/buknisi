"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient, getUserWithCompany } from "@/lib/supabase/server";
import { priceTypes } from "./types";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Keep it under 120 characters"),
});

const idSchema = z.object({
  id: z.string().uuid({ message: "Invalid identifier" }),
});

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(160, "Keep it under 160 characters"),
  price: z.number().nonnegative({ message: "Price must be zero or higher" }),
  price_type: z.enum(priceTypes),
  duration: z
    .number()
    .int()
    .min(5, { message: "Duration must be at least 5 minutes" })
    .max(55, { message: "Duration must be at most 55 minutes" })
    .refine((value) => value % 5 === 0, { message: "Duration must be in 5-minute steps" }),
  service_category_id: z.string().uuid().nullable().optional(),
  is_mobile: z.boolean().optional().default(false),
});

const addonSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(160, "Keep it under 160 characters"),
  price: z.number().nonnegative({ message: "Price must be zero or higher" }),
  duration: z
    .number()
    .int()
    .min(5, { message: "Duration must be at least 5 minutes" })
    .max(55, { message: "Duration must be at most 55 minutes" })
    .refine((value) => value % 5 === 0, { message: "Duration must be in 5-minute steps" }),
  description: z.string().max(500, "Keep description concise").optional().nullable(),
});

const serviceAddonsSchema = z.object({
  serviceId: z.string().uuid(),
  addonIds: z.array(z.string().uuid()),
});

async function getScopedClient() {
  const { company } = await getUserWithCompany();
  if (!company) {
    throw new Error("Missing company context");
  }
  const supabase = await createClient();
  return { supabase, companyId: company.id };
}

function handleActionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return { success: false, message };
}

export async function createCategory(input: unknown) {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const { error } = await supabase.from("service_categories").insert({
      name: parsed.data.name.trim(),
      company_id: companyId,
    });
    if (error) {
      return { success: false, message: error.message };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Category created" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCategory(input: unknown) {
  const parsed = categorySchema.merge(idSchema).safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const { error, data } = await supabase
      .from("service_categories")
      .update({ name: parsed.data.name.trim() })
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();
    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: "Category not found" };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Category updated" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCategory(input: unknown) {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const { error, data } = await supabase
      .from("service_categories")
      .delete()
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();
    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: "Category not found" };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Category deleted" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createService(input: unknown) {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const payload = {
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      price_type: parsed.data.price_type,
      duration: parsed.data.duration,
      service_category_id: parsed.data.service_category_id ?? null,
      is_mobile: parsed.data.is_mobile ?? false,
      company_id: companyId,
    };
    const { error } = await supabase.from("services").insert(payload);
    if (error) {
      return { success: false, message: error.message };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Service created" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateService(input: unknown) {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return { success: false, message: parsed.success ? "Missing service id" : parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const payload = {
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      price_type: parsed.data.price_type,
      duration: parsed.data.duration,
      service_category_id: parsed.data.service_category_id ?? null,
      is_mobile: parsed.data.is_mobile ?? false,
    };
    const { error, data } = await supabase
      .from("services")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();
    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: "Service not found" };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Service updated" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteService(input: unknown) {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const { error, data } = await supabase
      .from("services")
      .delete()
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();
    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: "Service not found" };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Service deleted" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createAddon(input: unknown) {
  const parsed = addonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const payload = {
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      duration: parsed.data.duration,
      description: parsed.data.description ?? null,
      company_id: companyId,
    };
    const { error } = await supabase.from("addons").insert(payload);
    if (error) {
      return { success: false, message: error.message };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Add-on created" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAddon(input: unknown) {
  const parsed = addonSchema.safeParse(input);
  if (!parsed.success || !parsed.data.id) {
    return { success: false, message: parsed.success ? "Missing add-on id" : parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const payload = {
      name: parsed.data.name.trim(),
      price: parsed.data.price,
      duration: parsed.data.duration,
      description: parsed.data.description ?? null,
    };
    const { error, data } = await supabase
      .from("addons")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();
    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: "Add-on not found" };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Add-on updated" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAddon(input: unknown) {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();
    const { error, data } = await supabase
      .from("addons")
      .delete()
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .select("id")
      .maybeSingle();
    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: "Add-on not found" };
    }
    revalidatePath("/settings/services");
    return { success: true, message: "Add-on deleted" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function setServiceAddons(input: unknown) {
  const parsed = serviceAddonsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }
  try {
    const { supabase, companyId } = await getScopedClient();

    const { data: serviceExists } = await supabase
      .from("services")
      .select("id")
      .eq("id", parsed.data.serviceId)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!serviceExists) {
      return { success: false, message: "Service not found" };
    }

    if (parsed.data.addonIds.length > 0) {
      const { data: validAddons } = await supabase
        .from("addons")
        .select("id")
        .eq("company_id", companyId)
        .in("id", parsed.data.addonIds);
      const validAddonIds = validAddons?.map((addon) => addon.id) ?? [];
      if (validAddonIds.length !== parsed.data.addonIds.length) {
        return { success: false, message: "Some add-ons are invalid for this company" };
      }
    }

    const { error: deleteError } = await supabase
      .from("service_addons")
      .delete()
      .eq("service_id", parsed.data.serviceId);
    if (deleteError) {
      return { success: false, message: deleteError.message };
    }

    if (parsed.data.addonIds.length > 0) {
      const { error: insertError } = await supabase.from("service_addons").insert(
        parsed.data.addonIds.map((addonId) => ({ service_id: parsed.data.serviceId, addon_id: addonId })),
      );
      if (insertError) {
        return { success: false, message: insertError.message };
      }
    }

    revalidatePath("/settings/services");
    return { success: true, message: "Service add-ons updated" };
  } catch (error) {
    return handleActionError(error);
  }
}
