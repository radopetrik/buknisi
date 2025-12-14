export const staffRoles = ["basic", "staffer", "reception", "manager"] as const;

export type StaffRole = (typeof staffRoles)[number];

export type Staff = {
  id: string;
  full_name: string;
  role: StaffRole;
  position: string | null;
  available_for_booking: boolean;
  description: string | null;
};

export type ServiceSummary = {
  id: string;
  name: string;
  duration: number;
};

export type StaffServiceLink = { staff_id: string; service_id: string };
