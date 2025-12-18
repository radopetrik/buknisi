"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient, getUserWithCompany } from "@/lib/supabase/server";

import { staffRoles } from "./types";

const staffSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(160, "Keep it under 160 characters"),
  role: z.enum(staffRoles),
  position: z.string().max(160, "Keep position concise").optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().max(20, "Phone number too long").optional().nullable().or(z.literal("")),
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
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
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
      email: parsed.data.email?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
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

const workingHoursSchema = z.array(
  z.object({
    day_in_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
    from_time: z.string(),
    to_time: z.string(),
    break_from_time: z.string().nullable().optional(),
    break_to_time: z.string().nullable().optional(),
  })
);

export async function updateStaffWorkingHours(staffId: string, hours: unknown) {
  const parsed = workingHoursSchema.safeParse(hours);
  if (!parsed.success) {
    return { success: false, message: "Invalid working hours data" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();

    // Verify staff belongs to company
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .eq("company_id", companyId)
      .single();

    if (staffError || !staff) {
      return { success: false, message: "Staff member not found" };
    }

    // Replace working hours
    const { error: deleteError } = await supabase
      .from("staff_working_hours")
      .delete()
      .eq("staff_id", staffId);

    if (deleteError) {
      return { success: false, message: deleteError.message };
    }

    if (parsed.data.length > 0) {
      const { error: insertError } = await supabase.from("staff_working_hours").insert(
        parsed.data.map((h) => ({
          staff_id: staffId,
          ...h,
        }))
      );

      if (insertError) {
        return { success: false, message: insertError.message };
      }
    }

    revalidatePath("/staff");
    return { success: true, message: "Working hours updated" };
  } catch (error) {
    return handleActionError(error);
  }
}

const timeOffSchema = z.object({
  staff_id: z.string().uuid(),
  all_day: z.boolean(),
  day: z.string(),
  from_time: z.string().nullable().optional(),
  to_time: z.string().nullable().optional(),
  reason: z.enum(["sick_day", "vacation", "training"]),
});

export async function createStaffTimeOff(input: unknown) {
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid time off data" };
  }

  try {
    const { supabase, companyId } = await getScopedClient();

    // Verify staff belongs to company
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", parsed.data.staff_id)
      .eq("company_id", companyId)
      .single();

    if (staffError || !staff) {
      return { success: false, message: "Staff member not found" };
    }

    const { error: insertError } = await supabase.from("staff_time_offs").insert({
      staff_id: parsed.data.staff_id,
      all_day: parsed.data.all_day,
      day: parsed.data.day,
      from_time: parsed.data.from_time || null,
      to_time: parsed.data.to_time || null,
      reason: parsed.data.reason,
    });

    if (insertError) {
      return { success: false, message: insertError.message };
    }

    revalidatePath("/staff");
    return { success: true, message: "Time off added" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteStaffTimeOff(timeOffId: string) {
  try {
    const { supabase, companyId } = await getScopedClient();

    // Verify time off belongs to a staff member of the company
    // We can do this by joining staff
    const { data: timeOff, error: fetchError } = await supabase
      .from("staff_time_offs")
      .select("id, staff!inner(company_id)")
      .eq("id", timeOffId)
      .eq("staff.company_id", companyId)
      .single();

    if (fetchError || !timeOff) {
      return { success: false, message: "Time off entry not found or access denied" };
    }

    const { error: deleteError } = await supabase
      .from("staff_time_offs")
      .delete()
      .eq("id", timeOffId);

    if (deleteError) {
      return { success: false, message: deleteError.message };
    }

    revalidatePath("/staff");
    return { success: true, message: "Time off removed" };
  } catch (error) {
    return handleActionError(error);
  }
}
