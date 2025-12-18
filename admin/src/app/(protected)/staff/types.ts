export const staffRoles = ["basic", "staffer", "reception", "manager"] as const;

export type StaffRole = (typeof staffRoles)[number];

export type Staff = {
  id: string;
  company_id: string;
  full_name: string;
  role: StaffRole;
  position: string | null;
  available_for_booking: boolean;
  description: string | null;
  email: string | null;
  phone: string | null;
  photo: string | null;
};

export type ServiceSummary = {
  id: string;
  name: string;
  duration: number;
};

export type StaffServiceLink = { staff_id: string; service_id: string };

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type StaffWorkingHour = {
  id: string;
  staff_id: string;
  day_in_week: DayOfWeek;
  from_time: string;
  to_time: string;
  break_from_time: string | null;
  break_to_time: string | null;
};

export const timeOffReasons = ["sick_day", "vacation", "training"] as const;
export type TimeOffReason = (typeof timeOffReasons)[number];

export type StaffTimeOff = {
  id: string;
  staff_id: string;
  all_day: boolean;
  day: string; // date string YYYY-MM-DD
  from_time: string | null;
  to_time: string | null;
  reason: TimeOffReason;
};
