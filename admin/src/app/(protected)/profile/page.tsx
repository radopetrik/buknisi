import { createClient, getUserWithCompany } from "@/lib/supabase/server";

import { ProfileManager } from "./_components/profile-manager";
import type { CompanyProfile, CompanyProfileData, DayOfWeek } from "./types";

export default async function ProfilePage() {
  const { company } = await getUserWithCompany();

  if (!company) {
    throw new Error("Missing company context");
  }

  const supabase = await createClient();

  const [companyResult, categoriesResult, citiesResult, amenitiesResult, companyAmenitiesResult, businessHoursResult, extrasResult, photosResult] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, slug, description, phone, contact_phone, email, facebook, instagram, website, address_text, city_id, category_id, is_mobile",
      )
      .eq("id", company.id)
      .single(),
    supabase.from("categories").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("cities").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("amenities").select("id, name, icon").order("name", { ascending: true }),
    supabase.from("company_amenities").select("amenity_id").eq("company_id", company.id),
    supabase
      .from("company_business_hours")
      .select("id, day_in_week, from_time, to_time, break_from_time, break_to_time")
      .eq("company_id", company.id),
    supabase
      .from("company_business_hours_extras")
      .select("id, date, message, from_hour, to_hour, break_from, break_to")
      .eq("company_id", company.id)
      .order("date", { ascending: true }),
    supabase.from("photos").select("id, ordering, url").eq("company_id", company.id).order("ordering", { ascending: true }),
  ]);

  if (companyResult.error) {
    throw companyResult.error;
  }
  if (categoriesResult.error) {
    throw categoriesResult.error;
  }
  if (citiesResult.error) {
    throw citiesResult.error;
  }
  if (amenitiesResult.error) {
    throw amenitiesResult.error;
  }
  if (companyAmenitiesResult.error) {
    throw companyAmenitiesResult.error;
  }
  if (businessHoursResult.error) {
    throw businessHoursResult.error;
  }
  if (extrasResult.error) {
    throw extrasResult.error;
  }
  if (photosResult.error) {
    throw photosResult.error;
  }

  const companyRow = companyResult.data;

  if (!companyRow) {
    throw new Error("Company not found");
  }

  const profile: CompanyProfile = {
    id: companyRow.id,
    name: companyRow.name,
    slug: companyRow.slug,
    description: companyRow.description ?? null,
    phone: companyRow.phone ?? null,
    contact_phone: companyRow.contact_phone ?? null,
    email: companyRow.email ?? null,
    facebook: companyRow.facebook ?? null,
    instagram: companyRow.instagram ?? null,
    website: companyRow.website ?? null,
    address_text: companyRow.address_text ?? null,
    city_id: companyRow.city_id ?? null,
    category_id: companyRow.category_id ?? null,
    is_mobile: companyRow.is_mobile ?? false,
  };

  const initialData: CompanyProfileData = {
    company: profile,
    categories: (categoriesResult.data ?? []).map((category) => ({ id: category.id, name: category.name, slug: category.slug })),
    cities: (citiesResult.data ?? []).map((city) => ({ id: city.id, name: city.name, slug: city.slug })),
    amenities: (amenitiesResult.data ?? []).map((amenity) => ({ id: amenity.id, name: amenity.name, icon: amenity.icon ?? null })),
    selectedAmenityIds: (companyAmenitiesResult.data ?? []).map((entry) => entry.amenity_id),
    businessHours: (businessHoursResult.data ?? []).map((hour) => ({
      id: hour.id,
      day_in_week: hour.day_in_week as DayOfWeek,
      from_time: hour.from_time ?? "09:00:00",
      to_time: hour.to_time ?? "17:00:00",
      break_from_time: hour.break_from_time ?? null,
      break_to_time: hour.break_to_time ?? null,
    })),
    businessHourExtras: (extrasResult.data ?? []).map((extra) => ({
      id: extra.id,
      date: extra.date,
      message: extra.message ?? null,
      from_hour: extra.from_hour ?? null,
      to_hour: extra.to_hour ?? null,
      break_from: extra.break_from ?? null,
      break_to: extra.break_to ?? null,
    })),
    photos: (photosResult.data ?? []).map((photo) => ({ id: photo.id, ordering: photo.ordering ?? 0, url: photo.url })),
  };

  return <ProfileManager initialData={initialData} />;
}
