"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";

const getStartOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateKey = (value: Date) => value.toISOString().split("T")[0];

const safeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

type StaffOption = { id: string; name: string };

type AddonOption = { id: string; name: string; price: number; duration: number };

type ServiceOption = { id: string; name: string; price: number; duration: number; addons: AddonOption[] };

type ClientOption = { id: string; firstName: string; lastName: string; phone?: string | null; email?: string | null };

type BookingServiceAddonSelection = { addonId: string; count: number };

type BookingServiceSelection = { id: string; serviceId: string; addons: BookingServiceAddonSelection[] };

type ViewMode = "month" | "week" | "day" | "agenda";

type Booking = {
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

const viewLabels: Record<ViewMode, string> = {
  month: "Mesiač",
  week: "Týždeň",
  day: "Deň",
  agenda: "Agenda",
};

const getMonthMatrix = (focus: Date) => {
  const startOfMonth = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const endOfMonth = new Date(focus.getFullYear(), focus.getMonth() + 1, 0);
  const start = getStartOfWeek(startOfMonth);
  const end = getStartOfWeek(endOfMonth);
  end.setDate(end.getDate() + 6);

  const weeks: Date[][] = [];
  let cursor = new Date(start);
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

const dayNames = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const createEmptyBooking = (
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

const getDateLabel = (date: Date) =>
  date.toLocaleDateString("sk-SK", { day: "numeric", month: "short", year: "numeric" });

const addMinutesToTime = (time: string, minutes: number) => {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const normalizeTime = (value?: string | null) => (value ? value.slice(0, 5) : "");

const formatPrice = (value: number) => new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(value);

const calculateBookingTotals = (booking: Booking, services: ServiceOption[]) => {
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

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [sheetState, setSheetState] = useState<{ mode: "view" | "edit" | "create"; booking: Booking | null }>(
    { mode: "view", booking: null },
  );
  const [dayDetail, setDayDetail] = useState<{ date: Date; bookings: Booking[] } | null>(null);
  const [clientDraft, setClientDraft] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [formError, setFormError] = useState<string>("");
  const [bookingTab, setBookingTab] = useState<"booking" | "notes">("booking");
  const [clientSearch, setClientSearch] = useState("");
  const [clientOptionsOpen, setClientOptionsOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientModalError, setClientModalError] = useState<string>("");
  const [addonsOpen, setAddonsOpen] = useState<Record<string, boolean>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string>("");
  const clientModalRef = useRef<HTMLDivElement | null>(null);
  const clientModalFirstInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    setLoadingData(true);
    setDataError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setDataError("Nepodarilo sa načítať používateľa.");
      setLoadingData(false);
      return;
    }

    if (!user) {
      setDataError("Nie ste prihlásený.");
      setLoadingData(false);
      return;
    }

    const { data: companyRow, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError) {
      setDataError("Nepodarilo sa načítať firmu.");
      setLoadingData(false);
      return;
    }

    const companyId = companyRow?.company_id;
    if (!companyId) {
      setDataError("Firma nebola nájdená.");
      setLoadingData(false);
      return;
    }

    const [servicesRes, bookingsRes, staffRes, clientsRes] = await Promise.all([
      supabase
        .from("services")
        .select("id,name,price,duration")
        .eq("company_id", companyId)
        .order("name", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          "id, client_id, staff_id, date, time_from, time_to, internal_note, client_note, booking_services(id, service_id, booking_service_addons(addon_id, count))",
        )
        .eq("company_id", companyId),
      supabase
        .from("staff")
        .select("id, full_name")
        .eq("company_id", companyId)
        .order("full_name", { ascending: true }),
      supabase
        .from("clients")
        .select("id, first_name, last_name, phone, email")
        .order("first_name", { ascending: true }),
    ]);

    if (servicesRes.error || bookingsRes.error || staffRes.error || clientsRes.error) {
      setDataError("Nepodarilo sa načítať dáta.");
      setLoadingData(false);
      return;
    }

    const serviceIds = (servicesRes.data ?? []).map((s) => s.id);

    const [addonsRes, serviceAddonsRes] = await Promise.all([
      supabase
        .from("addons")
        .select("id,name,price,duration,company_id")
        .eq("company_id", companyId)
        .order("name", { ascending: true }),
      serviceIds.length
        ? supabase.from("service_addons").select("service_id, addon_id").in("service_id", serviceIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (addonsRes.error || serviceAddonsRes.error) {
      setDataError("Nepodarilo sa načítať doplnky.");
      setLoadingData(false);
      return;
    }

    const addonsMap = new Map<string, AddonOption>(
      (addonsRes.data ?? []).map((addon: any) => [addon.id, {
        id: addon.id,
        name: addon.name,
        price: Number(addon.price ?? 0),
        duration: addon.duration ?? 0,
      } satisfies AddonOption]),
    );

    const serviceAddonMap = new Map<string, string[]>();
    (serviceAddonsRes.data ?? []).forEach((row: any) => {
      const arr = serviceAddonMap.get(row.service_id) ?? [];
      arr.push(row.addon_id);
      serviceAddonMap.set(row.service_id, arr);
    });

    const servicesMapped: ServiceOption[] = (servicesRes.data ?? []).map((service) => {
      const addonIds = serviceAddonMap.get(service.id) ?? [];
      const addons = addonIds
        .map((addonId) => addonsMap.get(addonId) ?? null)
        .filter(Boolean) as AddonOption[];

      return {
        id: service.id,
        name: service.name,
        price: Number(service.price ?? 0),
        duration: service.duration ?? 0,
        addons,
      } satisfies ServiceOption;
    });

    const staffMapped: StaffOption[] = (staffRes.data ?? []).map((staff) => ({
      id: staff.id,
      name: staff.full_name,
    }));

    const clientsMapped: ClientOption[] = (clientsRes.data ?? []).map((client) => ({
      id: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
      phone: client.phone,
      email: client.email,
    }));

    const bookingsMapped: Booking[] = (bookingsRes.data ?? []).map((booking) => ({
      id: booking.id,
      staffId: booking.staff_id ?? "",
      clientId: booking.client_id,
      date: booking.date,
      timeFrom: normalizeTime(booking.time_from),
      timeTo: normalizeTime(booking.time_to),
      internalNote: booking.internal_note ?? "",
      clientNote: booking.client_note ?? "",
      serviceSelections: (booking.booking_services ?? []).map((bs: any) => ({
        id: bs.id ?? safeId(),
        serviceId: bs.service_id,
        addons: (bs.booking_service_addons ?? []).map((addonRow: any) => ({
          addonId: addonRow.addon_id,
          count: addonRow.count ?? 1,
        })),
      })),
    }));

    setServices(servicesMapped);
    setStaffMembers(staffMapped);
    setClients(clientsMapped);
    setBookings(bookingsMapped);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => (staffFilter ? booking.staffId === staffFilter : true));
  }, [bookings, staffFilter]);

  const openBooking = (booking: Booking, mode: "view" | "edit") => {
    setFormError("");
    setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
    setBookingTab("booking");
    setClientOptionsOpen(false);
    setClientSearch(() => {
      const client = clients.find((c) => c.id === booking.clientId);
      return client ? `${client.firstName} ${client.lastName}`.trim() : "";
    });
    setSheetState({ mode, booking });
  };

  const handleCreateClick = () => {
    if (services.length === 0) {
      setFormError("Nie sú dostupné žiadne služby.");
      return;
    }
    if (staffMembers.length === 0) {
      setFormError("Nie sú dostupní pracovníci.");
      return;
    }

    const draft = createEmptyBooking(formatDateKey(focusedDate), services, staffMembers);
    setSheetState({ mode: "create", booking: draft });
    setFormError("");
    setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
    setBookingTab("booking");
    setClientOptionsOpen(false);
    setClientSearch("");
  };

  const handleDateNav = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setFocusedDate(new Date());
      return;
    }
    const delta = viewMode === "month" ? 30 : viewMode === "week" ? 7 : 1;
    setFocusedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + (direction === "prev" ? -delta : delta));
      return next;
    });
  };

  const handleSave = () => {
    if (!sheetState.booking) return;
    const booking = sheetState.booking;
    const hasServices = booking.serviceSelections.length > 0 && booking.serviceSelections.every((item) => item.serviceId);
    if (!hasServices || !booking.staffId || !booking.date || !booking.timeFrom || !booking.timeTo) {
      setFormError("Vyplňte aspoň jednu službu, pracovníka, dátum a čas.");
      return;
    }
    if (booking.timeFrom >= booking.timeTo) {
      setFormError("Čas od musí byť menší ako čas do.");
      return;
    }

    setBookings((prev) => {
      const exists = prev.find((item) => item.id === booking.id);
      if (exists) {
        return prev.map((item) => (item.id === booking.id ? booking : item));
      }
      return [...prev, booking];
    });
    setSheetState({ mode: "view", booking: null });
  };

  const handleBookingField = (field: keyof Booking, value: string | null) => {
    if (!sheetState.booking) return;
    if (field === "clientId") {
      const client = clients.find((c) => c.id === value);
      setClientSearch(client ? `${client.firstName} ${client.lastName}`.trim() : "");
      setClientOptionsOpen(false);
    }
    const nextValue = field === "clientId" && value === "" ? null : value;
    setSheetState((prev) => (prev ? { ...prev, booking: { ...prev.booking!, [field]: nextValue as never } } : prev));
  };

  const handleAddService = () => {
    if (!sheetState.booking) return;
    const fallbackService = services[0];
    if (!fallbackService) return;
    const selection: BookingServiceSelection = { id: safeId(), serviceId: fallbackService.id, addons: [] };
    setSheetState((prev) => (prev ? { ...prev, booking: { ...prev.booking!, serviceSelections: [...prev.booking!.serviceSelections, selection] } } : prev));
  };

  const handleRemoveService = (selectionId: string) => {
    if (!sheetState.booking) return;
    setSheetState((prev) =>
      prev
        ? {
            ...prev,
            booking: {
              ...prev.booking!,
              serviceSelections: prev.booking!.serviceSelections.filter((item) => item.id !== selectionId),
            },
          }
        : prev,
    );
  };

  const handleServiceChange = (selectionId: string, serviceId: string) => {
    if (!sheetState.booking) return;
    setSheetState((prev) =>
      prev
        ? {
            ...prev,
            booking: {
              ...prev.booking!,
              serviceSelections: prev.booking!.serviceSelections.map((item) =>
                item.id === selectionId ? { ...item, serviceId, addons: [] } : item,
              ),
            },
          }
        : prev,
    );
  };

  const handleAddonToggle = (selectionId: string, addonId: string, checked: boolean) => {
    if (!sheetState.booking) return;
    setSheetState((prev) =>
      prev
        ? {
            ...prev,
            booking: {
              ...prev.booking!,
              serviceSelections: prev.booking!.serviceSelections.map((selection) => {
                if (selection.id !== selectionId) return selection;
                if (checked) {
                  const exists = selection.addons.find((addon) => addon.addonId === addonId);
                  if (exists) return selection;
                  return { ...selection, addons: [...selection.addons, { addonId, count: 1 }] };
                }
                return { ...selection, addons: selection.addons.filter((addon) => addon.addonId !== addonId) };
              }),
            },
          }
        : prev,
    );
  };

  const handleAddonPanelToggle = (selectionId: string) => {
    setAddonsOpen((prev) => ({ ...prev, [selectionId]: !prev[selectionId] }));
  };

  const handleAddonCountChange = (selectionId: string, addonId: string, count: number) => {
    if (!sheetState.booking) return;
    setSheetState((prev) =>
      prev
        ? {
            ...prev,
            booking: {
              ...prev.booking!,
              serviceSelections: prev.booking!.serviceSelections.map((selection) => {
                if (selection.id !== selectionId) return selection;
                return {
                  ...selection,
                  addons: selection.addons.map((addon) =>
                    addon.addonId === addonId ? { ...addon, count: Math.max(1, count) } : addon,
                  ),
                };
              }),
            },
          }
        : prev,
    );
  };

  const handleCreateClient = () => {
    if (!clientDraft.firstName.trim() && !clientDraft.lastName.trim()) {
      setClientModalError("Zadajte aspoň meno alebo priezvisko.");
      return;
    }

    const newClientId = safeId();
    const created = {
      id: newClientId,
      firstName: clientDraft.firstName.trim() || "Nový",
      lastName: clientDraft.lastName.trim() || "Klient",
      phone: clientDraft.phone.trim() || undefined,
      email: clientDraft.email.trim() || undefined,
    };
    setClients((prev) => [...prev, created]);
    setSheetState((prev) => (prev && prev.booking ? { ...prev, booking: { ...prev.booking, clientId: newClientId } } : prev));
    setClientSearch(`${created.firstName} ${created.lastName}`.trim());
    setClientModalOpen(false);
    setClientOptionsOpen(false);
    setClientModalError("");
  };

  const renderBookingChip = (booking: Booking) => {
    const staffName = staffMembers.find((s) => s.id === booking.staffId)?.name ?? "N/A";
    const primaryServiceId = booking.serviceSelections[0]?.serviceId;
    const primaryServiceName = services.find((s) => s.id === primaryServiceId)?.name ?? "Služba";
    const extraServicesCount = Math.max(booking.serviceSelections.length - 1, 0);
    const { totalPrice } = calculateBookingTotals(booking, services);
    const clientName = booking.clientId
      ? `${clients.find((c) => c.id === booking.clientId)?.firstName ?? "Klient"}`
      : "Bez klienta";
    return (
      <button
        key={booking.id}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary/50 hover:bg-secondary"
        onClick={() => openBooking(booking, "view")}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{booking.timeFrom} – {booking.timeTo}</span>
          <span className="font-medium text-foreground">{staffName}</span>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {primaryServiceName}
          {extraServicesCount > 0 && <span className="text-xs font-semibold text-muted-foreground"> +{extraServicesCount} služieb</span>}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{clientName}</span>
          <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
        </div>
      </button>
    );
  };

  const renderMonthView = () => {
    const weeks = getMonthMatrix(focusedDate);
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground">
          {dayNames.map((name) => (
            <div key={name} className="px-2 py-1 text-center">{name}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 auto-rows-[150px] md:auto-rows-[170px]">
          {weeks.flat().map((day, idx) => {
            const dayBookings = filteredBookings.filter((booking) => booking.date === formatDateKey(day));
            const isCurrentMonth = day.getMonth() === focusedDate.getMonth();
            const visibleBookings = dayBookings.slice(0, 2);
            const overflowCount = Math.max(dayBookings.length - visibleBookings.length, 0);
            const hasBookings = dayBookings.length > 0;

            const handleDayClick = () => {
              if (!hasBookings) return;
              setDayDetail({ date: day, bookings: dayBookings });
            };

            return (
              <div
                key={`${day.toISOString()}-${idx}`}
                className={`flex flex-col overflow-hidden rounded-lg border ${isCurrentMonth ? "bg-white" : "bg-slate-50"}`}
              >
                <button
                  type="button"
                  onClick={handleDayClick}
                  className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <span className={`${isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </span>
                    {hasBookings && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {dayBookings.length} objednávok
                      </span>
                    )}
                  </div>
                  {isSameDay(day, new Date()) && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">Dnes</span>
                  )}
                </button>

                <div className="flex-1 space-y-1 overflow-hidden px-2 pb-2">
                  {!hasBookings ? (
                    <p className="text-[11px] text-slate-400">Voľné</p>
                  ) : (
                    <>
                      {visibleBookings.map(renderBookingChip)}
                      {overflowCount > 0 && (
                        <button
                          type="button"
                          onClick={handleDayClick}
                          className="w-full rounded-md border border-dashed border-slate-200 bg-white px-3 py-1 text-left text-[11px] font-semibold text-primary transition hover:border-secondary hover:bg-secondary"
                        >
                          +{overflowCount} ďalšie
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const start = getStartOfWeek(focusedDate);
    const days = Array.from({ length: 7 }, (_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      return day;
    });
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayBookings = filteredBookings.filter((booking) => booking.date === formatDateKey(day));
          return (
            <div key={day.toISOString()} className="rounded-lg border bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>{dayNames[(day.getDay() + 6) % 7]} {day.getDate()}.</span>
                {isSameDay(day, new Date()) && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">Dnes</span>}
              </div>
              <div className="space-y-2">
                {dayBookings.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Voľné</p>
                ) : (
                  dayBookings.map(renderBookingChip)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = filteredBookings
      .filter((booking) => booking.date === formatDateKey(focusedDate))
      .sort((a, b) => a.timeFrom.localeCompare(b.timeFrom));
    return (
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{getDateLabel(focusedDate)}</p>
          <p className="text-xs text-muted-foreground">{dayBookings.length} rezervácie</p>
        </div>
        <div className="divide-y">
          {dayBookings.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">Žiadne rezervácie</p>
          ) : (
            dayBookings.map((booking) => (
              <div key={booking.id} className="px-4 py-3">
                {renderBookingChip(booking)}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const agenda = filteredBookings
      .map((booking) => ({ ...booking, dateObj: new Date(booking.date) }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return (
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Agenda</p>
          <p className="text-xs text-muted-foreground">Najbližšie rezervácie</p>
        </div>
        <div className="divide-y">
          {agenda.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">Zatiaľ nič naplánované</p>
          ) : (
            agenda.map((booking) => (
              <div key={booking.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{getDateLabel(new Date(booking.date))}</span>
                  <span>{booking.timeFrom} – {booking.timeTo}</span>
                </div>
                <div className="mt-1">{renderBookingChip(booking)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderBody = () => {
    switch (viewMode) {
      case "month":
        return renderMonthView();
      case "week":
        return renderWeekView();
      case "day":
        return renderDayView();
      case "agenda":
        return renderAgendaView();
      default:
        return null;
    }
  };

  const isBookingSheetOpen = !!sheetState.booking;
  const isDaySheetOpen = !!dayDetail;

  const closeBookingSheet = () => {
    setSheetState({ mode: "view", booking: null });
    setClientOptionsOpen(false);
    setBookingTab("booking");
  };
  const closeDayDetailSheet = () => setDayDetail(null);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => `${client.firstName} ${client.lastName}`.toLowerCase().includes(query));
  }, [clientSearch, clients]);

  const bookingTotals = useMemo(() => {
    if (!sheetState.booking) return { totalMinutes: 0, totalPrice: 0 };
    return calculateBookingTotals(sheetState.booking, services);
  }, [sheetState.booking, services]);

  useEffect(() => {
    if (!sheetState.booking) return;
    const client = clients.find((c) => c.id === sheetState.booking?.clientId);
    setClientSearch(client ? `${client.firstName} ${client.lastName}`.trim() : "");
  }, [sheetState.booking?.id, sheetState.booking?.clientId, clients]);

  useEffect(() => {
    if (!sheetState.booking) return;
    const nextTimeTo = addMinutesToTime(sheetState.booking.timeFrom, bookingTotals.totalMinutes);
    if (nextTimeTo !== sheetState.booking.timeTo) {
      setSheetState((prev) => (prev ? { ...prev, booking: { ...prev.booking!, timeTo: nextTimeTo } } : prev));
    }
  }, [sheetState.booking?.timeFrom, sheetState.booking?.serviceSelections, bookingTotals.totalMinutes]);

  useEffect(() => {
    if (clientModalOpen) {
      setClientModalError("");
      clientModalFirstInputRef.current?.focus();
    }
  }, [clientModalOpen]);

  if (loadingData) {
    return <div className="p-6 text-sm text-muted-foreground">Načítavam dáta...</div>;
  }

  if (dataError) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm font-semibold text-red-600">{dataError}</p>
        <Button onClick={loadData}>Skúsiť znova</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Kalendár</h2>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" onClick={() => handleDateNav("prev")} aria-label="Predošlé">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDateNav("today")}
                className="min-w-[160px] justify-between"
                aria-label="Dnešný dátum"
              >
                <span>{getDateLabel(focusedDate)}</span>
                <span className="text-xs text-muted-foreground">Dnes</span>
              </Button>
              <Button size="icon" variant="outline" onClick={() => handleDateNav("next")} aria-label="Ďalšie">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-input bg-white">
              {Object.entries(viewLabels).map(([key, label]) => {
                const active = viewMode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setViewMode(key as ViewMode)}
                    className={`px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-secondary"
                }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <select
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="">Všetci pracovníci</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
            <Button
              onClick={handleCreateClick}
              disabled={loadingData || services.length === 0 || staffMembers.length === 0}
            >
              Pridať booking
            </Button>
            {(services.length === 0 || staffMembers.length === 0) && !loadingData && (
              <span className="text-xs text-red-600">Pridajte služby a pracovníkov, aby ste mohli vytvárať bookingy.</span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="mb-1 text-sm text-muted-foreground">Zamerané na: {getDateLabel(focusedDate)}</div>
          {renderBody()}
        </div>
      </div>

      <Sheet open={isBookingSheetOpen} modal={!clientModalOpen} onOpenChange={(open) => {
        if (!open) closeBookingSheet();
      }}>
        {sheetState.booking && (
          <SheetContent
            side="right"
            className="flex h-full flex-col w-full sm:max-w-2xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <SheetHeader className="text-left">
                <SheetTitle>{sheetState.mode === "create" ? "Nový booking" : "Detail booking"}</SheetTitle>
                <SheetDescription>Client je voliteľný; môžete ho vytvoriť priamo v sheete.</SheetDescription>
              </SheetHeader>
              <div className="flex items-center gap-2">
                {sheetState.mode !== "create" && (
                  <Button variant="outline" onClick={() => setSheetState((prev) => (prev ? { ...prev, mode: "edit" } : prev))}>
                    Upraviť
                  </Button>
                )}
                <SheetClose asChild>
                  <Button variant="ghost" onClick={closeBookingSheet}>Zavrieť</Button>
                </SheetClose>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBookingTab("booking")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  bookingTab === "booking" ? "bg-primary text-primary-foreground shadow" : "text-slate-700 hover:bg-secondary"
                }`}
              >
                Booking
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("notes")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  bookingTab === "notes" ? "bg-primary text-primary-foreground shadow" : "text-slate-700 hover:bg-secondary"
                }`}
              >
                Notes & Info
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="mb-6 space-y-3">
                <Label htmlFor="client">Klient (voliteľné)</Label>
                <div className="relative">
                  <Input
                    id="client"
                    placeholder="Vyhľadajte klienta"
                    disabled={sheetState.mode === "view"}
                    value={clientSearch}
                    onChange={(event) => {
                      const value = event.target.value;
                      setClientSearch(value);
                      if (value.trim() === "") {
                        handleBookingField("clientId", "");
                      }
                      setClientOptionsOpen(true);
                    }}
                    onFocus={() => setClientOptionsOpen(true)}
                  />
                  {clientOptionsOpen && sheetState.mode !== "view" && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-secondary"
                        onClick={() => {
                          setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
                          setClientModalOpen(true);
                          setClientOptionsOpen(false);
                        }}
                      >
                        + Vytvoriť nového klienta
                      </button>
                      <div className="max-h-56 divide-y overflow-auto">
                        {filteredClients.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-slate-500">Žiadny klient</p>
                        ) : (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                              onClick={() => {
                                handleBookingField("clientId", client.id);
                                setClientSearch(`${client.firstName} ${client.lastName}`.trim());
                                setClientOptionsOpen(false);
                              }}
                            >
                              <span className="font-medium text-foreground">{client.firstName} {client.lastName}</span>
                              <span className="text-xs text-muted-foreground">{client.email ?? client.phone ?? ""}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {sheetState.booking.clientId && (
                  <p className="text-xs text-muted-foreground">Vybraný klient: {clientSearch || ""}</p>
                )}
              </div>

              {bookingTab === "booking" && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="staff">Pracovník</Label>
                      <select
                        id="staff"
                        disabled={sheetState.mode === "view"}
                        value={sheetState.booking.staffId}
                        onChange={(event) => handleBookingField("staffId", event.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {staffMembers.map((staff) => (
                          <option key={staff.id} value={staff.id}>{staff.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="date">Dátum</Label>
                      <Input
                        id="date"
                        type="date"
                        disabled={sheetState.mode === "view"}
                        value={sheetState.booking.date}
                        onChange={(event) => handleBookingField("date", event.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="timeFrom">Čas od</Label>
                      <Input
                        id="timeFrom"
                        type="time"
                        disabled={sheetState.mode === "view"}
                        value={sheetState.booking.timeFrom}
                        onChange={(event) => handleBookingField("timeFrom", event.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="timeTo">Čas do</Label>
                      <Input
                        id="timeTo"
                        type="time"
                        readOnly
                        disabled
                        value={sheetState.booking.timeTo}
                      />
                      <p className="text-xs text-muted-foreground">Koniec sa počíta podľa trvania služieb a doplnkov.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Servisy a doplnky</Label>
                      {sheetState.mode !== "view" && (
                        <Button size="sm" variant="outline" onClick={handleAddService}>
                          Pridať službu
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {sheetState.booking.serviceSelections.map((selection, index) => {
                        const service = services.find((item) => item.id === selection.serviceId);
                        const selectionTotals = calculateBookingTotals(
                          { ...sheetState.booking!, serviceSelections: [selection] },
                          services,
                        );
                        const selectedAddonDetails = service
                          ? selection.addons
                              .map((addonSel) => {
                                const addon = service.addons.find((item) => item.id === addonSel.addonId);
                                if (!addon) return null;
                                return { ...addon, count: addonSel.count };
                              })
                              .filter(Boolean) as { id: string; name: string; price: number; duration: number; count: number }[]
                          : [];
                        return (
                          <div key={selection.id} className="space-y-3 rounded-md border bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-foreground">Služba {index + 1}</div>
                              {sheetState.mode !== "view" && sheetState.booking && sheetState.booking.serviceSelections.length > 1 && (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-red-600 hover:underline"
                                  onClick={() => handleRemoveService(selection.id)}
                                >
                                  Odstrániť
                                </button>
                              )}
                            </div>

                            <select
                              disabled={sheetState.mode === "view"}
                              value={selection.serviceId}
                              onChange={(event) => handleServiceChange(selection.id, event.target.value)}
                              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {services.map((serviceItem) => (
                                <option key={serviceItem.id} value={serviceItem.id}>{serviceItem.name}</option>
                              ))}
                            </select>

                            {service && (
                              <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                                <span>{service.duration} min • {formatPrice(service.price)}</span>
                                <span className="font-semibold text-foreground">{formatPrice(selectionTotals.totalPrice)}</span>
                              </div>
                            )}

                            {service && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-muted-foreground">
                                    Doplnky {selectedAddonDetails.length > 0 ? `(${selectedAddonDetails.length})` : ""}
                                  </p>
                                  {service.addons.length > 0 && (
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-primary hover:underline"
                                      onClick={() => handleAddonPanelToggle(selection.id)}
                                    >
                                      {addonsOpen[selection.id] ? "Skryť" : "Spravovať"} doplnky
                                    </button>
                                  )}
                                </div>

                                {selectedAddonDetails.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {selectedAddonDetails.map((addon) => (
                                      <span
                                        key={addon.id}
                                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground"
                                      >
                                        {addon.name} ×{addon.count}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Žiadne doplnky</p>
                                )}

                                {service.addons.length > 0 && addonsOpen[selection.id] && (
                                  <div className="max-h-64 space-y-2 overflow-auto rounded-md border bg-slate-50 p-3">
                                    {service.addons.map((addon) => {
                                      const selectedAddon = selection.addons.find((item) => item.addonId === addon.id);
                                      const checked = !!selectedAddon;
                                      return (
                                        <div key={addon.id} className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
                                          <div className="flex flex-col text-sm">
                                            <span className="font-medium text-foreground">{addon.name}</span>
                                            <span className="text-xs text-muted-foreground">{addon.duration} min • {formatPrice(addon.price)}</span>
                                          </div>
                                          {sheetState.mode === "view" ? (
                                            <span className="text-xs font-semibold text-foreground">{checked ? `×${selectedAddon?.count ?? 1}` : "-"}</span>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) => handleAddonToggle(selection.id, addon.id, event.target.checked)}
                                                className="h-4 w-4"
                                              />
                                              <Input
                                                type="number"
                                                min={1}
                                                value={selectedAddon?.count ?? 1}
                                                disabled={!checked}
                                                onChange={(event) => handleAddonCountChange(selection.id, addon.id, Number(event.target.value))}
                                                className="h-9 w-20"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {bookingTab === "notes" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="internalNote">Interná poznámka</Label>
                    <textarea
                      id="internalNote"
                      disabled={sheetState.mode === "view"}
                      value={sheetState.booking.internalNote ?? ""}
                      onChange={(event) => handleBookingField("internalNote", event.target.value)}
                      className="min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Systémové poznámky viditeľné len interne"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="clientNote">Poznámka klienta</Label>
                    <textarea
                      id="clientNote"
                      disabled={sheetState.mode === "view"}
                      value={sheetState.booking.clientNote ?? ""}
                      onChange={(event) => handleBookingField("clientNote", event.target.value)}
                      className="min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Poznámka od klienta / preferencie"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 mt-4 border-t pt-4 bg-background">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Celkový čas</span>
                  <span className="font-semibold text-foreground">{bookingTotals.totalMinutes} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cena spolu</span>
                  <span className="font-semibold text-foreground">{formatPrice(bookingTotals.totalPrice)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-red-600">{formError}</div>
                {sheetState.mode !== "view" && (
                  <div className="flex gap-2">
                    <SheetClose asChild>
                      <Button variant="outline" onClick={closeBookingSheet}>
                        Zrušiť
                      </Button>
                    </SheetClose>
                    <Button onClick={handleSave}>Uložiť</Button>
                  </div>
                )}
                {sheetState.mode === "view" && (
                  <Button onClick={() => setSheetState((prev) => (prev ? { ...prev, mode: "edit" } : prev))}>
                    Upraviť booking
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Sheet open={isDaySheetOpen} onOpenChange={(open) => {
        if (!open) closeDayDetailSheet();
      }}>
        {dayDetail && (
          <SheetContent side="right" className="w-full sm:max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <SheetHeader className="text-left">
                <SheetTitle>{getDateLabel(dayDetail.date)}</SheetTitle>
                <SheetDescription>Vyberte booking alebo vytvorte nový.</SheetDescription>
              </SheetHeader>
              <div className="flex items-center gap-2">
                <SheetClose asChild>
                  <Button variant="outline" onClick={closeDayDetailSheet}>
                    Zavrieť
                  </Button>
                </SheetClose>
                <Button onClick={() => {
                  if (services.length === 0 || staffMembers.length === 0) {
                    closeDayDetailSheet();
                    setFormError("Chýbajú služby alebo pracovníci.");
                    return;
                  }
                  const draft = createEmptyBooking(formatDateKey(dayDetail.date), services, staffMembers);
                  setSheetState({ mode: "create", booking: draft });
                  closeDayDetailSheet();
                }}>
                  Pridať booking
                </Button>
              </div>
            </div>
            <div className="mt-4 divide-y">
              {dayDetail.bookings.map((booking) => (
                <button
                  key={booking.id}
                  className="flex w-full items-start justify-between gap-3 px-1 py-4 text-left transition hover:bg-secondary"
                  onClick={() => {
                    openBooking(booking, "view");
                    closeDayDetailSheet();
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{booking.timeFrom} – {booking.timeTo}</p>
                    <p className="text-xs text-muted-foreground">
                      {services.find((s) => s.id === booking.serviceSelections[0]?.serviceId)?.name ?? "Služba"}
                    </p>
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {staffMembers.find((s) => s.id === booking.staffId)?.name ?? "Pracovník"}
                  </div>
                </button>
              ))}
              {dayDetail.bookings.length === 0 && (
                <p className="px-1 py-6 text-sm text-slate-500">Žiadne rezervácie</p>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>

      {clientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div ref={clientModalRef} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">Nový klient</p>
                <p className="text-sm text-muted-foreground">Vyplňte údaje klienta pre booking.</p>
              </div>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setClientModalOpen(false);
                  setClientModalError("");
                }}
              >
                Zavrieť
              </button>
            </div>

            <div className="space-y-3">
                      <Input
                        ref={clientModalFirstInputRef}
                        placeholder="Meno"
                        value={clientDraft.firstName}
                        onChange={(event) => setClientDraft((prev) => ({ ...prev, firstName: event.target.value }))}
                      />

              <Input
                placeholder="Priezvisko"
                value={clientDraft.lastName}
                onChange={(event) => setClientDraft((prev) => ({ ...prev, lastName: event.target.value }))}
              />
              <Input
                placeholder="Telefón"
                value={clientDraft.phone}
                onChange={(event) => setClientDraft((prev) => ({ ...prev, phone: event.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={clientDraft.email}
                onChange={(event) => setClientDraft((prev) => ({ ...prev, email: event.target.value }))}
              />
              {clientModalError && <p className="text-sm text-red-600">{clientModalError}</p>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setClientModalOpen(false);
                setClientModalError("");
              }}>
                Zrušiť
              </Button>
              <Button onClick={handleCreateClient}>Vytvoriť klienta</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


