"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const getStartOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateKey = (value: Date) => value.toISOString().split("T")[0];

const safeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const sampleStaff = [
  { id: "s1", name: "Andrea K." },
  { id: "s2", name: "Marek P." },
  { id: "s3", name: "Zuzana L." },
];

const sampleServices = [
  { id: "svc1", name: "Konzultácia" },
  { id: "svc2", name: "Ošetrenie" },
  { id: "svc3", name: "Kontrola" },
];

const sampleClients = [
  { id: "c1", firstName: "Jana", lastName: "Nováková" },
  { id: "c2", firstName: "Peter", lastName: "Hruška" },
];

const sampleBookings = [
  {
    id: "b1",
    serviceId: "svc1",
    staffId: "s1",
    clientId: "c1",
    date: formatDateKey(new Date()),
    timeFrom: "09:00",
    timeTo: "10:00",
    internalNote: "VIP klient",
    clientNote: "",
  },
  {
    id: "b2",
    serviceId: "svc2",
    staffId: "s2",
    clientId: "c2",
    date: formatDateKey(new Date()),
    timeFrom: "11:00",
    timeTo: "12:00",
    internalNote: "",
    clientNote: "Prísť skôr",
  },
];

type ViewMode = "month" | "week" | "day" | "agenda";

type Booking = {
  id: string;
  serviceId: string;
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

const createEmptyBooking = (date: string, timeFrom = "09:00", timeTo = "10:00"): Booking => ({
  id: safeId(),
  serviceId: sampleServices[0]?.id ?? "",
  staffId: sampleStaff[0]?.id ?? "",
  clientId: null,
  date,
  timeFrom,
  timeTo,
  internalNote: "",
  clientNote: "",
});

const getDateLabel = (date: Date) =>
  date.toLocaleDateString("sk-SK", { day: "numeric", month: "short", year: "numeric" });

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings);
  const [staffMembers] = useState(sampleStaff);
  const [services] = useState(sampleServices);
  const [clients, setClients] = useState(sampleClients);
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
  const clientModalRef = useRef<HTMLDivElement | null>(null);
  const clientModalFirstInputRef = useRef<HTMLInputElement | null>(null);

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
    const draft = createEmptyBooking(formatDateKey(focusedDate));
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
    if (!booking.serviceId || !booking.staffId || !booking.date || !booking.timeFrom || !booking.timeTo) {
      setFormError("Vyplňte službu, pracovníka, dátum a čas.");
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
    const serviceName = services.find((s) => s.id === booking.serviceId)?.name ?? "Služba";
    const clientName = booking.clientId
      ? `${clients.find((c) => c.id === booking.clientId)?.firstName ?? "Klient"}`
      : "Bez klienta";
    return (
      <button
        key={booking.id}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
        onClick={() => openBooking(booking, "view")}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{booking.timeFrom} – {booking.timeTo}</span>
          <span className="font-medium text-foreground">{staffName}</span>
        </div>
        <p className="text-sm font-semibold text-foreground">{serviceName}</p>
        <p className="text-xs text-muted-foreground">{clientName}</p>
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
                  className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-purple-50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`${isSameDay(day, new Date()) ? "text-purple-700" : "text-muted-foreground"}`}>
                      {day.getDate()}
                    </span>
                    {hasBookings && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        {dayBookings.length} objednávok
                      </span>
                    )}
                  </div>
                  {isSameDay(day, new Date()) && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Dnes</span>
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
                          className="w-full rounded-md border border-dashed border-slate-200 bg-white px-3 py-1 text-left text-[11px] font-semibold text-purple-700 transition hover:border-purple-200 hover:bg-purple-50"
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
                {isSameDay(day, new Date()) && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Dnes</span>}
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

  useEffect(() => {
    if (!sheetState.booking) return;
    const client = clients.find((c) => c.id === sheetState.booking?.clientId);
    setClientSearch(client ? `${client.firstName} ${client.lastName}`.trim() : "");
  }, [sheetState.booking?.id, sheetState.booking?.clientId, clients]);

  useEffect(() => {
    if (clientModalOpen) {
      setClientModalError("");
      clientModalFirstInputRef.current?.focus();
    }
  }, [clientModalOpen]);

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
                      active ? "bg-purple-600 text-white" : "text-slate-700 hover:bg-purple-50"
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
              className="h-10 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <option value="">Všetci pracovníci</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>
            <Button onClick={handleCreateClick}>Pridať booking</Button>
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
                  bookingTab === "booking" ? "bg-purple-600 text-white shadow" : "text-slate-700 hover:bg-purple-50"
                }`}
              >
                Booking
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("notes")}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  bookingTab === "notes" ? "bg-purple-600 text-white shadow" : "text-slate-700 hover:bg-purple-50"
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
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-purple-700 hover:bg-purple-50"
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
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-purple-50"
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
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="service">Služba</Label>
                    <select
                      id="service"
                      disabled={sheetState.mode === "view"}
                      value={sheetState.booking.serviceId}
                      onChange={(event) => handleBookingField("serviceId", event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="staff">Pracovník</Label>
                    <select
                      id="staff"
                      disabled={sheetState.mode === "view"}
                      value={sheetState.booking.staffId}
                      onChange={(event) => handleBookingField("staffId", event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

                  <div className="grid grid-cols-2 gap-3">
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
                        disabled={sheetState.mode === "view"}
                        value={sheetState.booking.timeTo}
                        onChange={(event) => handleBookingField("timeTo", event.target.value)}
                      />
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
                      className="min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Poznámka od klienta / preferencie"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 mt-4 border-t pt-4 bg-background">
              <div className="flex items-center justify-between">
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
                  const draft = createEmptyBooking(formatDateKey(dayDetail.date));
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
                  className="flex w-full items-start justify-between gap-3 px-1 py-4 text-left transition hover:bg-purple-50"
                  onClick={() => {
                    openBooking(booking, "view");
                    closeDayDetailSheet();
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{booking.timeFrom} – {booking.timeTo}</p>
                    <p className="text-xs text-muted-foreground">
                      {services.find((s) => s.id === booking.serviceId)?.name ?? "Služba"}
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


