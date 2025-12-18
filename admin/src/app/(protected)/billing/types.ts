export type AddonOption = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

export type ServiceOption = {
  id: string;
  name: string;
  price: number;
  duration: number;
  addons: AddonOption[];
};

export type ClientOption = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

export type PaymentMethod = "cash" | "card";

export type InvoiceItem = {
  type: "service" | "addon";
  id?: string;
  name: string;
  price: number;
  count: number;
  serviceName?: string; // For grouping addons under services
};

export type Invoice = {
  id: string;
  companyId: string;
  clientId?: string | null;
  clientName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  createdAt: string;
  bookingId?: string | null;
};

export type BookingServiceAddonSelection = {
  addonId: string;
  count: number;
  price?: number;
};

export type BookingServiceSelection = {
  id: string;
  serviceId: string;
  addons: BookingServiceAddonSelection[];
};

export type UnpaidBooking = {
  id: string;
  clientId?: string | null;
  clientName?: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  serviceSelections: BookingServiceSelection[];
  totalPrice: number;
};

export type CompanyDetails = {
  name: string;
  addressText?: string | null;
  phone?: string | null;
  email?: string | null;
  ico?: string | null;
  dic?: string | null;
  ic_dph?: string | null;
  city?: string | null;
};
