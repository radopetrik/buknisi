"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

import { AgendaView } from "./_components/agenda-view";
import { BookingSheet } from "./_components/booking-sheet";
import { CalendarHeader } from "./_components/calendar-header";
import { ClientModal } from "./_components/client-modal";
import { DayDetailSheet } from "./_components/day-detail-sheet";
import { DayView } from "./_components/day-view";
import { MonthView } from "./_components/month-view";
import { WeekView } from "./_components/week-view";
import { AddonOption, Booking, ClientOption, ServiceOption, StaffOption, ViewMode } from "./types";
import { createEmptyBooking, formatDateKey, normalizeTime, safeId } from "./utils";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  
  const [sheetState, setSheetState] = useState<{ mode: "view" | "edit" | "create"; booking: Booking | null }>({
    mode: "view",
    booking: null,
  });
  
  const [dayDetail, setDayDetail] = useState<{ date: Date; bookings: Booking[] } | null>(null);
  
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string>("");

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
      (addonsRes.data ?? []).map((addon: any) => [
        addon.id,
        {
          id: addon.id,
          name: addon.name,
          price: Number(addon.price ?? 0),
          duration: addon.duration ?? 0,
        } satisfies AddonOption,
      ]),
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

  const handleCreateClick = () => {
    if (services.length === 0 || staffMembers.length === 0) return;
    const draft = createEmptyBooking(formatDateKey(focusedDate), services, staffMembers);
    setSheetState({ mode: "create", booking: draft });
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

  const handleSaveBooking = (booking: Booking) => {
    setBookings((prev) => {
      const exists = prev.find((item) => item.id === booking.id);
      if (exists) {
        return prev.map((item) => (item.id === booking.id ? booking : item));
      }
      return [...prev, booking];
    });
    setSheetState({ mode: "view", booking: null });
  };

  const handleCreateClient = (clientData: { firstName: string; lastName: string; phone: string; email: string }) => {
    const newClientId = safeId();
    const created: ClientOption = {
      id: newClientId,
      firstName: clientData.firstName.trim() || "Nový",
      lastName: clientData.lastName.trim() || "Klient",
      phone: clientData.phone.trim() || undefined,
      email: clientData.email.trim() || undefined,
    };
    setClients((prev) => [...prev, created]);
    setSheetState((prev) => (prev && prev.booking ? { ...prev, booking: { ...prev.booking, clientId: newClientId } } : prev));
    setClientModalOpen(false);
  };

  if (loadingData) {
    return <div className="p-6 text-sm text-muted-foreground">Načítavam dáta...</div>;
  }

  if (dataError) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm font-semibold text-red-600">{dataError}</p>
        <Button onClick={loadData}>Skúsiť znova</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <CalendarHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          focusedDate={focusedDate}
          onDateNav={handleDateNav}
          staffFilter={staffFilter}
          setStaffFilter={setStaffFilter}
          staffMembers={staffMembers}
          onAddBooking={handleCreateClick}
          loadingData={loadingData}
          servicesCount={services.length}
        />
        
        <div className="space-y-2">
          <div className="mb-1 text-sm text-muted-foreground">Zamerané na: {formatDateKey(focusedDate)}</div>
          
          {viewMode === "month" && (
            <MonthView
              focusedDate={focusedDate}
              bookings={filteredBookings}
              staffMembers={staffMembers}
              services={services}
              clients={clients}
              onBookingClick={(booking) => setSheetState({ mode: "view", booking })}
              onDayClick={(date, dayBookings) => setDayDetail({ date, bookings: dayBookings })}
            />
          )}

          {viewMode === "week" && (
            <WeekView
              focusedDate={focusedDate}
              bookings={filteredBookings}
              staffMembers={staffMembers}
              services={services}
              clients={clients}
              onBookingClick={(booking) => setSheetState({ mode: "view", booking })}
            />
          )}

          {viewMode === "day" && (
            <DayView
              focusedDate={focusedDate}
              bookings={filteredBookings}
              staffMembers={staffMembers}
              services={services}
              clients={clients}
              onBookingClick={(booking) => setSheetState({ mode: "view", booking })}
            />
          )}

          {viewMode === "agenda" && (
            <AgendaView
              bookings={filteredBookings}
              staffMembers={staffMembers}
              services={services}
              clients={clients}
              onBookingClick={(booking) => setSheetState({ mode: "view", booking })}
            />
          )}
        </div>
      </div>

      <BookingSheet
        isOpen={!!sheetState.booking}
        mode={sheetState.mode}
        booking={sheetState.booking}
        onClose={() => setSheetState({ mode: "view", booking: null })}
        onSave={handleSaveBooking}
        onEdit={() => setSheetState((prev) => ({ ...prev, mode: "edit" }))}
        staffMembers={staffMembers}
        services={services}
        clients={clients}
        onCreateClientOpen={() => setClientModalOpen(true)}
      />

      <DayDetailSheet
        dayDetail={dayDetail}
        onClose={() => setDayDetail(null)}
        onBookingClick={(booking) => setSheetState({ mode: "view", booking })}
        onAddBooking={(date) => {
           setDayDetail(null);
           if (services.length === 0 || staffMembers.length === 0) return;
           const draft = createEmptyBooking(formatDateKey(date), services, staffMembers);
           setSheetState({ mode: "create", booking: draft });
        }}
        staffMembers={staffMembers}
        services={services}
      />

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreate={handleCreateClient}
      />
    </>
  );
}
