import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarKitHandle,
  type EventItem,
  type ResourceItem,
} from "@howljs/calendar-kit";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { sk } from "date-fns/locale";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, ScrollView, SectionList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/lib/supabase";

import {
  CreateBookingModal,
  type ClientOption,
  type ServiceOption,
} from "@/components/calendar/create-booking-modal";

type ViewMode = "agenda" | "day" | "week" | "month";

type BookingsFilter =
  | { type: "mine" }
  | { type: "all" }
  | { type: "unassigned" }
  | { type: "staff"; staffId: string };

type StaffRow = { id: string; full_name: string };

type BookingRow = {
  id: string;
  date: string;
  time_from: string;
  time_to: string;
  staff_id: string | null;
  clients:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null;
  staff: { full_name: string } | null;
  booking_services:
    | {
        services: { name: string; duration: number } | null;
      }[]
    | null;
};

type AgendaSection = { title: string; date: string; data: BookingRow[] };

const AGENDA_PAGE_DAYS = 14;
const AGENDA_MAX_PAGES = 8;

function dateToDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toEventDateTime(date: string, time: string) {
  return { dateTime: `${date}T${time}` } as const;
}

function getClient(booking: BookingRow) {
  if (!booking.clients) return null;
  return Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
}

function getService(booking: BookingRow) {
  return booking.booking_services?.[0]?.services ?? null;
}

function isFilterActive(filter: BookingsFilter, option: BookingsFilter) {
  if (filter.type !== option.type) return false;
  if (filter.type === "staff" && option.type === "staff") {
    return filter.staffId === option.staffId;
  }
  return true;
}

async function fetchStaff(companyId: string) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, full_name")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

async function fetchClients(companyId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, phone, email")
    .eq("company_id", companyId)
    .order("last_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ClientOption[];
}

async function fetchServicesWithAddons(companyId: string) {
  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, name, price, duration")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (servicesError) throw servicesError;

  const serviceIds = (servicesData ?? []).map((s) => s.id);

  const [addonsRes, serviceAddonsRes] = await Promise.all([
    supabase
      .from("addons")
      .select("id, name, price, duration, company_id")
      .eq("company_id", companyId)
      .order("name", { ascending: true }),
    serviceIds.length
      ? supabase.from("service_addons").select("service_id, addon_id").in("service_id", serviceIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (addonsRes.error) throw addonsRes.error;
  if (serviceAddonsRes.error) throw serviceAddonsRes.error;

  const addonsMap = new Map(
    (addonsRes.data ?? []).map((addon: any) => [
      addon.id,
      {
        id: addon.id,
        name: addon.name,
        price: Number(addon.price ?? 0),
        duration: addon.duration ?? 0,
      },
    ])
  );

  const serviceAddonMap = new Map<string, string[]>();
  (serviceAddonsRes.data ?? []).forEach((row: any) => {
    const arr = serviceAddonMap.get(row.service_id) ?? [];
    arr.push(row.addon_id);
    serviceAddonMap.set(row.service_id, arr);
  });

  const mapped: ServiceOption[] = (servicesData ?? []).map((service: any) => {
    const addonIds = serviceAddonMap.get(service.id) ?? [];
    const addons = addonIds
      .map((addonId) => addonsMap.get(addonId) ?? null)
      .filter(Boolean) as ServiceOption["addons"];

    return {
      id: service.id,
      name: service.name,
      price: Number(service.price ?? 0),
      duration: service.duration ?? 0,
      addons,
    } satisfies ServiceOption;
  });

  return mapped;
}

async function fetchBookingsRange(params: {
  companyId: string;
  userId: string | null;
  fromDate: string;
  toDateExclusive: string;
  filter: BookingsFilter;
}) {
  const { companyId, userId, fromDate, toDateExclusive, filter } = params;

  let query = supabase
    .from("bookings")
    .select(
      `
      id, date, time_from, time_to, staff_id,
      clients(first_name, last_name),
      staff(full_name),
      booking_services(services(name, duration))
      `
    )
    .eq("company_id", companyId)
    .gte("date", fromDate)
    .lt("date", toDateExclusive)
    .order("date", { ascending: true })
    .order("time_from", { ascending: true });

  if (filter.type === "mine") {
    if (!userId) return [] as BookingRow[];
    query = query.eq("user_id", userId);
  }

  if (filter.type === "unassigned") {
    query = query.is("staff_id", null);
  }

  if (filter.type === "staff") {
    query = query.eq("staff_id", filter.staffId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as BookingRow[];
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const client = getClient(booking);
  const service = getService(booking);

  return (
    <Box className="bg-white rounded-xl p-4 mb-3 border-l-4 border-l-blue-500 shadow-sm flex-row">
      <Box className="mr-4 items-center justify-center">
        <Text className="font-bold text-gray-900 text-lg">
          {booking.time_from.slice(0, 5)}
        </Text>
        <Text className="text-xs text-gray-400">
          {booking.time_to.slice(0, 5)}
        </Text>
      </Box>
      <Box className="flex-1 border-l border-gray-100 pl-4">
        <Text className="text-base font-bold text-gray-900 mb-1">
          {client?.first_name} {client?.last_name}
        </Text>
        <Text className="text-blue-600 font-medium text-sm">
          {service?.name || "Služba"}
        </Text>
        <HStack className="items-center mt-1">
          {service?.duration ? (
            <>
              <Clock size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400 ml-1">
                {service.duration} min
              </Text>
            </>
          ) : null}
          {booking.staff?.full_name ? (
            <Text className="text-xs text-gray-400 ml-3">
              {booking.staff.full_name}
            </Text>
          ) : (
            <Text className="text-xs text-gray-400 ml-3">Nepriradené</Text>
          )}
        </HStack>
      </Box>
    </Box>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-2 border ${
        active ? "bg-black border-black" : "bg-white border-gray-200"
      }`}
    >
      <Text
        className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ViewModeTabs({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const tabs: { key: ViewMode; label: string }[] = [
    { key: "agenda", label: "Agenda" },
    { key: "day", label: "Deň" },
    { key: "week", label: "Týždeň" },
    { key: "month", label: "Mesiac" },
  ];

  return (
    <HStack className="bg-white rounded-xl p-1 border border-gray-200">
      {tabs.map((tab) => {
        const active = tab.key === viewMode;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            className={`flex-1 items-center py-2 rounded-lg ${
              active ? "bg-black" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? "text-white" : "text-gray-700"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
}

function buildAgendaSections(bookings: BookingRow[]) {
  const map = new Map<string, BookingRow[]>();
  for (const booking of bookings) {
    const list = map.get(booking.date);
    if (list) list.push(booking);
    else map.set(booking.date, [booking]);
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    title: date,
    data,
    date,
  }));
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string }>();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<BookingsFilter>({ type: "mine" });

  const agendaInitialFromDate = useMemo(() => dateToDateString(new Date()), []);

  const calendarRef = useRef<CalendarKitHandle>(null);

  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });

  const { data: staff, isLoading: isStaffLoading } = useQuery({
    queryKey: ["staff", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchStaff(company!.id),
  });

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["services", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchServicesWithAddons(company!.id),
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchClients(company!.id),
  });

  const canCreateBooking =
    !!company?.id &&
    (staff?.length ?? 0) > 0 &&
    (services?.length ?? 0) > 0 &&
    !isStaffLoading &&
    !isServicesLoading &&
    !isClientsLoading;

  const openCreateBooking = useCallback(() => {
    if (!canCreateBooking) return;
    setCreateModalOpen(true);
  }, [canCreateBooking]);

  const createParam = Array.isArray(params.create)
    ? params.create[0]
    : params.create;

  useEffect(() => {
    if (createParam !== "1") return;
    if (!canCreateBooking) return;

    openCreateBooking();
    // Clear the param so it doesn't reopen later.
    router.setParams({ create: "" });
  }, [canCreateBooking, createParam, openCreateBooking, router]);

  const agendaQuery = useInfiniteQuery({
    queryKey: ["agenda", company?.id, authUser?.id, filter],
    enabled: !!company?.id && viewMode === "agenda",
    initialPageParam: agendaInitialFromDate,
    queryFn: async ({ pageParam }) => {
      const fromDate = pageParam;
      const toDateExclusive = dateToDateString(
        addDays(new Date(fromDate), AGENDA_PAGE_DAYS)
      );

      const bookings = await fetchBookingsRange({
        companyId: company!.id,
        userId: authUser?.id ?? null,
        fromDate,
        toDateExclusive,
        filter,
      });

      return {
        bookings,
        nextFromDate: toDateExclusive,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (allPages.length >= AGENDA_MAX_PAGES) return undefined;
      return lastPage.nextFromDate;
    },
  });

  const agendaBookings = useMemo(() => {
    return agendaQuery.data?.pages.flatMap((p) => p.bookings) ?? [];
  }, [agendaQuery.data]);

  const agendaSections: AgendaSection[] = useMemo(() => {
    return buildAgendaSections(agendaBookings);
  }, [agendaBookings]);

  const timelineRange = useMemo(() => {
    if (viewMode === "day") {
      const fromDate = dateToDateString(selectedDate);
      const toDateExclusive = dateToDateString(addDays(selectedDate, 1));
      return { fromDate, toDateExclusive };
    }

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const fromDate = dateToDateString(weekStart);
    const toDateExclusive = dateToDateString(addDays(weekStart, 7));
    return { fromDate, toDateExclusive };
  }, [selectedDate, viewMode]);

  const timelineBookingsQuery = useQuery({
    queryKey: [
      "timelineBookings",
      company?.id,
      authUser?.id,
      filter,
      timelineRange.fromDate,
      timelineRange.toDateExclusive,
      viewMode,
    ],
    enabled: !!company?.id && (viewMode === "day" || viewMode === "week"),
    queryFn: () =>
      fetchBookingsRange({
        companyId: company!.id,
        userId: authUser?.id ?? null,
        fromDate: timelineRange.fromDate,
        toDateExclusive: timelineRange.toDateExclusive,
        filter,
      }),
  });

  const resources: ResourceItem[] = useMemo(() => {
    if (filter.type === "staff") {
      const staffMember = staff?.find((s) => s.id === filter.staffId);
      return staffMember ? [{ id: staffMember.id, title: staffMember.full_name }] : [];
    }

    if (filter.type === "unassigned") {
      return [{ id: "unassigned", title: "Nepriradené" }];
    }

    const staffResources = (staff ?? []).map((s) => ({
      id: s.id,
      title: s.full_name,
    }));

    return [...staffResources, { id: "unassigned", title: "Nepriradené" }];
  }, [filter, staff]);

  const timelineEvents: EventItem[] = useMemo(() => {
    const bookings = timelineBookingsQuery.data ?? [];
    return bookings.map((b) => {
      const client = getClient(b);
      const service = getService(b);
      const titleParts = [
        client ? `${client.first_name} ${client.last_name}` : "Klient",
        service?.name,
      ].filter(Boolean);

      return {
        id: b.id,
        title: titleParts.join(" • "),
        start: toEventDateTime(b.date, b.time_from),
        end: toEventDateTime(b.date, b.time_to),
        resourceId: b.staff_id ?? "unassigned",
        color: "#3b82f6",
      } satisfies EventItem;
    });
  }, [timelineBookingsQuery.data]);

  const monthRange = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const end = endOfMonth(monthCursor);
    return {
      fromDate: dateToDateString(start),
      toDateExclusive: dateToDateString(addDays(end, 1)),
      start,
      end,
    };
  }, [monthCursor]);

  const monthDaysWithBookingsQuery = useQuery({
    queryKey: [
      "monthDaysWithBookings",
      company?.id,
      authUser?.id,
      filter,
      monthRange.fromDate,
      monthRange.toDateExclusive,
    ],
    enabled: !!company?.id && viewMode === "month",
    queryFn: async () => {
      const bookings = await fetchBookingsRange({
        companyId: company!.id,
        userId: authUser?.id ?? null,
        fromDate: monthRange.fromDate,
        toDateExclusive: monthRange.toDateExclusive,
        filter,
      });

      return new Set(bookings.map((b) => b.date));
    },
  });

  const monthGridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const filterChips = useMemo(() => {
    const base: { label: string; option: BookingsFilter }[] = [
      { label: "Moje", option: { type: "mine" } },
      { label: "Všetko", option: { type: "all" } },
      { label: "Nepriradené", option: { type: "unassigned" } },
    ];

    const staffChips = (staff ?? []).map((s) => ({
      label: s.full_name,
      option: { type: "staff", staffId: s.id } as const,
    }));

    return [...base, ...staffChips];
  }, [staff]);


  const renderAgendaHeader = (section: AgendaSection) => {
    const date = new Date(section.date);
    return (
      <Box className="pt-4 pb-2">
        <Text className="text-gray-500 font-semibold">
          {format(date, "EEEE, d. MMMM", { locale: sk })}
        </Text>
      </Box>
    );
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerTitle: "Kalendár" }} />

      <Box className="px-4 pt-3 pb-2 bg-gray-50">
        <ViewModeTabs viewMode={viewMode} onChange={setViewMode} />

        <Box className="mt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterChips.map(({ label, option }) => (
              <ToggleChip
                key={`${option.type}${
                  option.type === "staff" ? `-${option.staffId}` : ""
                }`}
                label={label}
                active={isFilterActive(filter, option)}
                onPress={() => setFilter(option)}
              />
            ))}
            {isStaffLoading ? (
              <HStack className="items-center">
                <Spinner className="text-gray-400" />
              </HStack>
            ) : null}
          </ScrollView>
        </Box>
      </Box>

      {viewMode === "agenda" ? (
        <SectionList
          className="flex-1 px-4"
          sections={agendaSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => renderAgendaHeader(section)}
          renderItem={({ item }) => <BookingCard booking={item} />}
          refreshControl={
            <RefreshControl
              refreshing={agendaQuery.isFetching && !agendaQuery.isFetchingNextPage}
              onRefresh={() => agendaQuery.refetch()}
            />
          }
          onEndReached={() => {
            if (agendaQuery.hasNextPage && !agendaQuery.isFetchingNextPage) {
              agendaQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Box className="items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-300 mt-4">
              <Text className="text-gray-400">Žiadne bookings</Text>
            </Box>
          }
          ListFooterComponent={
            agendaQuery.isFetchingNextPage ? (
              <Box className="py-4 items-center">
                <Spinner className="text-gray-400" />
              </Box>
            ) : (
              <Box className="h-6" />
            )
          }
        />
      ) : null}

      {viewMode === "month" ? (
        <Box className="flex-1 px-4">
          <HStack className="justify-between items-center mt-2 mb-3">
            <Pressable onPress={() => setMonthCursor((d) => subMonths(d, 1))}>
              <ChevronLeft color="black" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-900">
              {format(monthCursor, "MMMM yyyy", { locale: sk })}
            </Text>
            <Pressable onPress={() => setMonthCursor((d) => addMonths(d, 1))}>
              <ChevronRight color="black" />
            </Pressable>
          </HStack>

          <HStack className="justify-around mb-2">
            {"Po_Út_St_Št_Pi_So_Ne".split("_").map((d) => (
              <Text key={d} className="text-xs font-semibold text-gray-400 w-[40px] text-center">
                {d}
              </Text>
            ))}
          </HStack>

          <VStack className="bg-white rounded-xl border border-gray-200 p-2">
            {Array.from({ length: Math.ceil(monthGridDays.length / 7) }, (_, row) => {
              const days = monthGridDays.slice(row * 7, row * 7 + 7);
              return (
                <HStack key={row} className="justify-around">
                  {days.map((day) => {
                    const inMonth = isSameMonth(day, monthCursor);
                    const selected = isSameDay(day, selectedDate);
                    const hasBooking =
                      monthDaysWithBookingsQuery.data?.has(dateToDateString(day)) ??
                      false;

                    return (
                      <Pressable
                        key={day.toISOString()}
                        onPress={() => setSelectedDate(day)}
                        className={`w-[40px] h-[40px] items-center justify-center rounded-lg ${
                          selected ? "bg-black" : "bg-transparent"
                        }`}
                      >
                        <Text
                          className={`font-semibold ${
                            selected
                              ? "text-white"
                              : inMonth
                                ? "text-gray-900"
                                : "text-gray-300"
                          }`}
                        >
                          {format(day, "d")}
                        </Text>
                        {hasBooking ? (
                          <View
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              selected ? "bg-white" : "bg-blue-500"
                            }`}
                          />
                        ) : isToday(day) ? (
                          <View className="w-1.5 h-1.5 rounded-full mt-0.5 bg-gray-300" />
                        ) : (
                          <View className="h-2" />
                        )}
                      </Pressable>
                    );
                  })}
                </HStack>
              );
            })}
          </VStack>

          <Box className="mt-4">
            <Text className="text-gray-500 font-medium mb-2">
              Vybraný deň: {format(selectedDate, "EEEE, d. MMMM", { locale: sk })}
            </Text>
            <Text className="text-gray-400 text-sm">
              Tip: prepni na Deň pre detailný timeline.
            </Text>
          </Box>
        </Box>
      ) : null}

      {viewMode === "day" || viewMode === "week" ? (
        <Box className="flex-1">
          <Box className="bg-white py-3 px-4 shadow-sm z-10">
            <HStack className="justify-between items-center">
              <Pressable onPress={() => calendarRef.current?.goToPrevPage(true)}>
                <ChevronLeft color="black" />
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900">
                {viewMode === "day"
                  ? format(selectedDate, "EEEE, d. MMMM", { locale: sk })
                  : format(selectedDate, "MMMM yyyy", { locale: sk })}
              </Text>
              <Pressable onPress={() => calendarRef.current?.goToNextPage(true)}>
                <ChevronRight color="black" />
              </Pressable>
            </HStack>
          </Box>

          <CalendarContainer
            ref={calendarRef}
            key={`${viewMode}-${dateToDateString(selectedDate)}`}
            firstDay={1}
            numberOfDays={viewMode === "day" ? 1 : 7}
            initialDate={dateToDateString(selectedDate)}
            events={timelineEvents}
            resources={resources}
            enableResourceScroll={resources.length > 1}
            resourcePerPage={2}
            isLoading={timelineBookingsQuery.isLoading}
            onDateChanged={(date) => setSelectedDate(new Date(date))}
            theme={{
              colors: {
                primary: "#000000",
                onPrimary: "#ffffff",
                background: "#ffffff",
                onBackground: "#111827",
                border: "#e5e7eb",
                text: "#111827",
                surface: "#f9fafb",
                onSurface: "#6b7280",
              },
            }}
          >
            <CalendarHeader />
            <CalendarBody />
          </CalendarContainer>
        </Box>
      ) : null}

      <CreateBookingModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        companyId={company?.id ?? ""}
        userId={authUser?.id ?? null}
        defaultDate={dateToDateString(selectedDate)}
        staff={staff ?? []}
        services={services ?? []}
        clients={clients ?? []}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["agenda"] });
          queryClient.invalidateQueries({ queryKey: ["timelineBookings"] });
          queryClient.invalidateQueries({ queryKey: ["monthDaysWithBookings"] });
        }}
      />
    </Box>
  );
}
