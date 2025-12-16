export type StaffOption = { id: string; name: string };

export type AddonOption = { id: string; name: string; price: number; duration: number };

export type ServiceOption = { id: string; name: string; price: number; duration: number; addons: AddonOption[] };

export type ClientOption = { id: string; firstName: string; lastName: string; phone?: string | null; email?: string | null };

export type BookingServiceAddonSelection = { addonId: string; count: number };

export type BookingServiceSelection = { id: string; serviceId: string; addons: BookingServiceAddonSelection[] };

export type ViewMode = "month" | "week" | "day" | "agenda";

export type Booking = {
  id: string;
  serviceSelections: BookingServiceSelection[];
  staffId: string;
  clientId?: string | null;
  date: string; // yyyy-mm-dd
  timeFrom: string;
  timeTo: string;
  internalNote?: string;
  clientNote?: string;
};
