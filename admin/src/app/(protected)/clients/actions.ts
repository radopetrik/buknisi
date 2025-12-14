"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { PostgrestError } from "@supabase/supabase-js";

import { createClient as createSupabaseClient, getUserWithCompany } from "@/lib/supabase/server";

const MIGRATION_MESSAGE =
  "Chýba stĺpec clients.company_id. Spustite migráciu db/002_add_company_to_clients.sql a znova načítajte stránku.";

const clientSchema = z.object({
  first_name: z.string().min(1, "Meno je povinné").max(120, "Maximálne 120 znakov"),
  last_name: z.string().min(1, "Priezvisko je povinné").max(160, "Maximálne 160 znakov"),
  phone: z
    .string()
    .max(40, "Telefón je príliš dlhý")
    .optional()
    .nullable(),
  email: z
    .string()
    .email("Zadajte platný email")
    .max(320, "Email je príliš dlhý")
    .optional()
    .nullable(),
});

const updateClientSchema = clientSchema.extend({
  id: z.string().uuid(),
});

type ScopedClient = Awaited<ReturnType<typeof createSupabaseClient>>;

type ClientPayload = z.infer<typeof clientSchema>;

async function getScopedClient() {
  const { company } = await getUserWithCompany();
  if (!company) {
    throw new Error("Chýba kontext spoločnosti");
  }
  const supabase = await createSupabaseClient();
  return { supabase, companyId: company.id } as const;
}

function normalizeValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function mapPostgrestError(error: PostgrestError) {
  if (error.code === "42703") {
    return { success: false, message: MIGRATION_MESSAGE } as const;
  }

  return { success: false, message: error.message } as const;
}

async function ensureClientOwnership(id: string, companyId: string, supabase: ScopedClient) {
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    return mapPostgrestError(error);
  }

  if (!data) {
    return { success: false, message: "Klient nebol nájdený" } as const;
  }

  return { success: true } as const;
}

function handleActionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Neočakávaná chyba";
  return { success: false, message };
}

function buildPayload(input: ClientPayload, companyId: string) {
  return {
    company_id: companyId,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    phone: normalizeValue(input.phone),
    email: normalizeValue(input.email?.toLowerCase()),
  } as const;
}

export async function createClient(input: unknown) {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();
    const payload = buildPayload(parsed.data, companyId);

    const { error } = await supabase.from("clients").insert(payload);

    if (error) {
      return mapPostgrestError(error);
    }

    revalidatePath("/clients");
    return { success: true, message: "Klient bol pridaný" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateClient(input: unknown) {
  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();

    const ownership = await ensureClientOwnership(parsed.data.id, companyId, supabase);
    if (!ownership.success) {
      return ownership;
    }

    const payload = buildPayload(parsed.data, companyId);

    const { error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("company_id", companyId);

    if (error) {
      return mapPostgrestError(error);
    }

    revalidatePath("/clients");
    return { success: true, message: "Klient bol aktualizovaný" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteClient(input: unknown) {
  const schema = z.object({ id: z.string().uuid() });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Neplatné údaje" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();

    const ownership = await ensureClientOwnership(parsed.data.id, companyId, supabase);
    if (!ownership.success) {
      return ownership;
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", parsed.data.id)
      .eq("company_id", companyId);

    if (error) {
      return mapPostgrestError(error);
    }

    revalidatePath("/clients");
    return { success: true, message: "Klient bol odstránený" };
  } catch (error) {
    return handleActionError(error);
  }
}
