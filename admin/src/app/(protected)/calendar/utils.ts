import { Booking, ServiceOption, StaffOption } from "./types";

export const getStartOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const formatDateKey = (value: Date) => value.toISOString().split("T")[0];

export const safeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const getMonthMatrix = (focus: Date) => {
  const startOfMonth = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const endOfMonth = new Date(focus.getFullYear(), focus.getMonth() + 1, 0);
  const start = getStartOfWeek(startOfMonth);
  const end = getStartOfWeek(endOfMonth);
  end.setDate(end.getDate() + 6);

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor <= end || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks.slice(0, 6);
};

export const createEmptyBooking = (
  date: string,
  servicesList: ServiceOption[],
  staffList: StaffOption[],
  timeFrom = "09:00",
  timeTo = "10:00",
): Booking => ({
  id: safeId(),
  serviceSelections: servicesList[0]
    ? [{ id: safeId(), serviceId: servicesList[0].id, addons: [] }]
    : [],
  staffId: staffList[0]?.id ?? "",
  clientId: null,
  date,
  timeFrom,
  timeTo,
  internalNote: "",
  clientNote: "",
});

export const getDateLabel = (date: Date) =>
  date.toLocaleDateString("sk-SK", { day: "numeric", month: "short", year: "numeric" });

export const addMinutesToTime = (time: string, minutes: number) => {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export const normalizeTime = (value?: string | null) => (value ? value.slice(0, 5) : "");

export const formatPrice = (value: number) => new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(value);

export const calculateBookingTotals = (booking: Booking, services: ServiceOption[]) => {
  let totalMinutes = 0;
  let totalPrice = 0;

  booking.serviceSelections.forEach((selection) => {
    const service = services.find((item) => item.id === selection.serviceId);
    if (!service) return;
    totalMinutes += service.duration;
    totalPrice += service.price;

    selection.addons.forEach((addonSel) => {
      const addon = service.addons.find((item) => item.id === addonSel.addonId);
      if (!addon) return;
      const count = Math.max(1, addonSel.count);
      totalMinutes += addon.duration * count;
      totalPrice += Number(addon.price) * count;
    });
  });

  return { totalMinutes, totalPrice };
};

export const dayNames = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

export const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
