import { supabase } from "@/lib/supabase";

export const staffRoles = ["basic", "staffer", "reception", "manager"] as const;
export type StaffRole = (typeof staffRoles)[number];

export type StaffRow = {
  id: string;
  company_id: string;
  full_name: string;
  photo: string | null;
  role: StaffRole;
  position: string | null;
  email: string | null;
  phone: string | null;
  available_for_booking: boolean;
  description: string | null;
};

export type ServiceRow = {
  id: string;
  name: string;
  duration: number;
};

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Pondelok" },
  { value: "tuesday", label: "Utorok" },
  { value: "wednesday", label: "Streda" },
  { value: "thursday", label: "Štvrtok" },
  { value: "friday", label: "Piatok" },
  { value: "saturday", label: "Sobota" },
  { value: "sunday", label: "Nedeľa" },
];

export type StaffWorkingHourRow = {
  id: string;
  staff_id: string;
  day_in_week: DayOfWeek;
  from_time: string;
  to_time: string;
  break_from_time: string | null;
  break_to_time: string | null;
};

export const timeOffReasons = ["vacation", "sick_day", "training"] as const;
export type TimeOffReason = (typeof timeOffReasons)[number];

export type StaffTimeOffRow = {
  id: string;
  staff_id: string;
  all_day: boolean;
  day: string; // YYYY-MM-DD
  from_time: string | null;
  to_time: string | null;
  reason: TimeOffReason;
};

export function staffRoleLabel(role: StaffRole) {
  if (role === "manager") return "Manažér";
  if (role === "reception") return "Recepcia";
  if (role === "staffer") return "Personál";
  return "Základný";
}

export function timeOffReasonLabel(reason: TimeOffReason) {
  if (reason === "sick_day") return "PN";
  if (reason === "training") return "Školenie";
  return "Dovolenka";
}

export async function fetchStaffList(companyId: string) {
  const { data, error } = await supabase
    .from("staff")
    .select(
      "id, company_id, full_name, photo, role, position, email, phone, available_for_booking, description"
    )
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function fetchStaffDetail(companyId: string, staffId: string) {
  const { data, error } = await supabase
    .from("staff")
    .select(
      "id, company_id, full_name, photo, role, position, email, phone, available_for_booking, description"
    )
    .eq("company_id", companyId)
    .eq("id", staffId)
    .single();

  if (error) throw error;
  return data as StaffRow;
}

export async function createStaff(params: {
  company_id: string;
  full_name: string;
  role: StaffRole;
  position: string | null;
  email: string | null;
  phone: string | null;
  available_for_booking: boolean;
  description: string | null;
}) {
  const { data, error } = await supabase
    .from("staff")
    .insert(params)
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function updateStaff(params: {
  companyId: string;
  staffId: string;
  patch: Partial<
    Pick<
      StaffRow,
      | "full_name"
      | "role"
      | "position"
      | "email"
      | "phone"
      | "available_for_booking"
      | "description"
      | "photo"
    >
  >;
}) {
  const { companyId, staffId, patch } = params;
  const { error } = await supabase
    .from("staff")
    .update(patch)
    .eq("company_id", companyId)
    .eq("id", staffId);

  if (error) throw error;
}

export async function deleteStaff(companyId: string, staffId: string) {
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("company_id", companyId)
    .eq("id", staffId);

  if (error) throw error;
}

export async function fetchServices(companyId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}

export async function fetchStaffServiceIds(staffId: string) {
  const { data, error } = await supabase
    .from("staff_services")
    .select("service_id")
    .eq("staff_id", staffId);

  if (error) throw error;
  return (data ?? []).map((row: any) => row.service_id as string);
}

export async function saveStaffServices(staffId: string, serviceIds: string[]) {
  const { error: deleteError } = await supabase
    .from("staff_services")
    .delete()
    .eq("staff_id", staffId);

  if (deleteError) throw deleteError;

  if (serviceIds.length === 0) return;

  const rows = serviceIds.map((serviceId) => ({ staff_id: staffId, service_id: serviceId }));
  const { error: insertError } = await supabase.from("staff_services").insert(rows);

  if (insertError) throw insertError;
}

export async function fetchStaffWorkingHours(staffId: string) {
  const { data, error } = await supabase
    .from("staff_working_hours")
    .select("id, staff_id, day_in_week, from_time, to_time, break_from_time, break_to_time")
    .eq("staff_id", staffId);

  if (error) throw error;
  return (data ?? []) as StaffWorkingHourRow[];
}

export async function saveStaffWorkingHours(params: {
  staffId: string;
  enabledDays: {
    day_in_week: DayOfWeek;
    from_time: string;
    to_time: string;
    break_from_time: string | null;
    break_to_time: string | null;
  }[];
  disabledDays: DayOfWeek[];
}) {
  const { staffId, enabledDays, disabledDays } = params;

  if (enabledDays.length > 0) {
    const { error: upsertError } = await supabase
      .from("staff_working_hours")
      .upsert(
        enabledDays.map((row) => ({ staff_id: staffId, ...row })),
        { onConflict: "staff_id,day_in_week" }
      );

    if (upsertError) throw upsertError;
  }

  if (disabledDays.length > 0) {
    const { error: deleteError } = await supabase
      .from("staff_working_hours")
      .delete()
      .eq("staff_id", staffId)
      .in("day_in_week", disabledDays);

    if (deleteError) throw deleteError;
  }
}

export async function fetchStaffTimeOffs(staffId: string) {
  const { data, error } = await supabase
    .from("staff_time_offs")
    .select("id, staff_id, all_day, day, from_time, to_time, reason")
    .eq("staff_id", staffId)
    .order("day", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StaffTimeOffRow[];
}

export async function createStaffTimeOff(payload: {
  staff_id: string;
  all_day: boolean;
  day: string;
  from_time: string | null;
  to_time: string | null;
  reason: TimeOffReason;
}) {
  const { error } = await supabase.from("staff_time_offs").insert(payload);
  if (error) throw error;
}

export async function deleteStaffTimeOff(id: string) {
  const { error } = await supabase.from("staff_time_offs").delete().eq("id", id);
  if (error) throw error;
}
