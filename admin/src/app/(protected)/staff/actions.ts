"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient, getUserWithCompany } from "@/lib/supabase/server";

import { staffRoles } from "./types";

const staffSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(160, "Keep it under 160 characters"),
  role: z.enum(staffRoles),
  position: z.string().max(160, "Keep position concise").optional().nullable(),
  available_for_booking: z.boolean().default(true),
  description: z.string().max(800, "Keep description concise").optional().nullable(),
  serviceIds: z.array(z.string().uuid()).optional().default([]),
});

const updateStaffSchema = staffSchema.extend({
  id: z.string().uuid(),
});

async function validateServiceIds(ids: string[], companyId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (ids.length === 0) {
    return { success: true } as const;
  }

  const { data: validServices, error: servicesError } = await supabase
    .from("services")
    .select("id")
    .eq("company_id", companyId)
    .in("id", ids);

  if (servicesError) {
    return { success: false, message: servicesError.message } as const;
  }

  const validIds = validServices?.map((service) => service.id) ?? [];
  if (validIds.length !== ids.length) {
    return { success: false, message: "Some services are invalid for this company" } as const;
  }

  return { success: true } as const;
}

async function replaceStaffServices(staffId: string, serviceIds: string[], supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error: deleteError } = await supabase.from("staff_services").delete().eq("staff_id", staffId);
  if (deleteError) {
    return { success: false, message: deleteError.message } as const;
  }

  if (serviceIds.length === 0) {
    return { success: true } as const;
  }

  const { error: insertError } = await supabase
    .from("staff_services")
    .insert(serviceIds.map((serviceId) => ({ staff_id: staffId, service_id: serviceId })));

  if (insertError) {
    return { success: false, message: insertError.message } as const;
  }

  return { success: true } as const;
}

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

export async function createStaff(input: unknown) {
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();

    const uniqueServiceIds = Array.from(new Set(parsed.data.serviceIds ?? []));
    const validation = await validateServiceIds(uniqueServiceIds, companyId, supabase);
    if (!validation.success) {
      return validation;
    }

    const payload = {
      company_id: companyId,
      full_name: parsed.data.full_name.trim(),
      role: parsed.data.role,
      position: parsed.data.position?.trim() || null,
      available_for_booking: parsed.data.available_for_booking,
      description: parsed.data.description?.trim() || null,
    };

    const { data: staffRecord, error: insertError } = await supabase
      .from("staff")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      return { success: false, message: insertError.message };
    }

    if (!staffRecord?.id) {
      return { success: false, message: "Failed to create staff" };
    }

    if (uniqueServiceIds.length > 0) {
      const servicesResult = await replaceStaffServices(staffRecord.id, uniqueServiceIds, supabase);
      if (!servicesResult.success) {
        await supabase.from("staff").delete().eq("id", staffRecord.id);
        return servicesResult;
      }
    }

    revalidatePath("/staff");
    return { success: true, message: "Staff created" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateStaff(input: unknown) {
  const parsed = updateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();

    const { data: staffRecord, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", parsed.data.id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (staffError) {
      return { success: false, message: staffError.message };
    }
    if (!staffRecord) {
      return { success: false, message: "Staff member not found" };
    }

    const uniqueServiceIds = Array.from(new Set(parsed.data.serviceIds ?? []));
    const validation = await validateServiceIds(uniqueServiceIds, companyId, supabase);
    if (!validation.success) {
      return validation;
    }

    const payload = {
      full_name: parsed.data.full_name.trim(),
      role: parsed.data.role,
      position: parsed.data.position?.trim() || null,
      available_for_booking: parsed.data.available_for_booking,
      description: parsed.data.description?.trim() || null,
    };

    const { error: updateError } = await supabase
      .from("staff")
      .update(payload)
      .eq("id", parsed.data.id)
      .eq("company_id", companyId);

    if (updateError) {
      return { success: false, message: updateError.message };
    }

    const servicesResult = await replaceStaffServices(parsed.data.id, uniqueServiceIds, supabase);
    if (!servicesResult.success) {
      return servicesResult;
    }

    revalidatePath("/staff");
    return { success: true, message: "Staff updated" };
  } catch (error) {
    return handleActionError(error);
  }
}
