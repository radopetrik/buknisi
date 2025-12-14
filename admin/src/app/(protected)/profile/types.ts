export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type CompanyProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  contact_phone: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
  address_text: string | null;
  city_id: string | null;
  category_id: string | null;
  is_mobile: boolean;
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type CityOption = {
  id: string;
  name: string;
};

export type AmenityOption = {
  id: string;
  name: string;
  icon: string | null;
};

export type BusinessHour = {
  id: string;
  day_in_week: DayOfWeek;
  from_time: string;
  to_time: string;
  break_from_time: string | null;
  break_to_time: string | null;
};

export type BusinessHourExtra = {
  id: string;
  date: string;
  message: string | null;
  from_hour: string | null;
  to_hour: string | null;
  break_from: string | null;
  break_to: string | null;
};

export type CompanyPhoto = {
  id: string;
  ordering: number;
  url: string;
};

export type CompanyProfileData = {
  company: CompanyProfile;
  categories: CategoryOption[];
  cities: CityOption[];
  amenities: AmenityOption[];
  selectedAmenityIds: string[];
  businessHours: BusinessHour[];
  businessHourExtras: BusinessHourExtra[];
  photos: CompanyPhoto[];
};
