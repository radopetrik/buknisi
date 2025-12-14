import { redirect } from "next/navigation";

import { createClient, getUserWithCompany } from "@/lib/supabase/server";

import { StaffManager } from "./_components/staff-manager";
import type { ServiceSummary, Staff, StaffServiceLink } from "./types";

export default async function StaffPage() {
  const { company } = await getUserWithCompany();

  if (!company) {
    redirect("/login?error=no_company");
  }

  const supabase = await createClient();

  const [staff, services, staffServices] = await Promise.all([
    supabase
      .from("staff")
      .select("id, full_name, role, position, available_for_booking, description")
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

  if (staff.error) {
    throw staff.error;
  }
  if (services.error) {
    throw services.error;
  }
  if (staffServices.error) {
    throw staffServices.error;
  }

  const mappedStaffServices: StaffServiceLink[] =
    staffServices.data?.map(({ staff_id, service_id }) => ({ staff_id, service_id })) ?? [];

  return (
    <StaffManager
      initialData={{
        staff: (staff.data ?? []) as Staff[],
        services: (services.data ?? []) as ServiceSummary[],
        staffServices: mappedStaffServices,
      }}
    />
  );
}
