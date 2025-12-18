import { redirect } from "next/navigation";

import { createClient, getUserWithCompany } from "@/lib/supabase/server";

import { StaffManager } from "./_components/staff-manager";
import type { ServiceSummary, Staff, StaffServiceLink, StaffTimeOff, StaffWorkingHour } from "./types";

export default async function StaffPage() {
  const { company } = await getUserWithCompany();

  if (!company) {
    redirect("/login?error=no_company");
  }

  const supabase = await createClient();

  const [staffResult, servicesResult, staffServicesResult] = await Promise.all([
    supabase
      .from("staff")
      .select("id, company_id, full_name, role, position, available_for_booking, description, email, phone, photo")
      .eq("company_id", company.id)
      .order("full_name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, duration")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("staff_services")
      .select("staff_id, service_id, services!inner(company_id)")
      .eq("services.company_id", company.id),
  ]);

  if (staffResult.error) throw staffResult.error;
  if (servicesResult.error) throw servicesResult.error;
  if (staffServicesResult.error) throw staffServicesResult.error;

  const staff = staffResult.data ?? [];
  const staffIds = staff.map((s) => s.id);

  // Fetch related data only if we have staff members
  const [workingHoursResult, timeOffsResult] = staffIds.length > 0 ? await Promise.all([
    supabase
      .from("staff_working_hours")
      .select("*")
      .in("staff_id", staffIds),
    supabase
      .from("staff_time_offs")
      .select("*")
      .in("staff_id", staffIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];

  if (workingHoursResult.error) throw workingHoursResult.error;
  if (timeOffsResult.error) throw timeOffsResult.error;

  const mappedStaffServices: StaffServiceLink[] =
    staffServicesResult.data?.map(({ staff_id, service_id }) => ({ staff_id, service_id })) ?? [];

  return (
    <StaffManager
      initialData={{
        staff: (staff ?? []) as Staff[],
        services: (servicesResult.data ?? []) as ServiceSummary[],
        staffServices: mappedStaffServices,
        workingHours: (workingHoursResult.data ?? []) as StaffWorkingHour[],
        timeOffs: (timeOffsResult.data ?? []) as StaffTimeOff[],
      }}
    />
  );
}
