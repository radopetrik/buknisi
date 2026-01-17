import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
} from "react-native";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { sk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { supabase } from "@/lib/supabase";

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
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
};

export type StaffOption = {
  id: string;
  full_name: string;
};

type BookingServiceAddonSelection = { addonId: string; count: number };

type BookingServiceSelection = {
  id: string;
  serviceId: string;
  addons: BookingServiceAddonSelection[];
};

function safeId() {
  const cryptoAny = (globalThis as any)?.crypto as any;

  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `${Date.now()}-${Math.random()}`;
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat("sk-SK", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} €`;
  }
}

function calculateTotals(selections: BookingServiceSelection[], services: ServiceOption[]) {
  let totalMinutes = 0;
  let totalPrice = 0;

  for (const selection of selections) {
    const service = services.find((s) => s.id === selection.serviceId);
    if (!service) continue;
    totalMinutes += service.duration;
    totalPrice += service.price;

    for (const addonSel of selection.addons) {
      const addon = service.addons.find((a) => a.id === addonSel.addonId);
      if (!addon) continue;
      const count = Math.max(1, addonSel.count);
      totalMinutes += addon.duration * count;
      totalPrice += addon.price * count;
    }
  }

  return { totalMinutes, totalPrice };
}

function dateToDateString(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function parseDateString(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function getRoundedNowTime() {
  const now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  minutes = Math.round(minutes / 15) * 15;
  if (minutes === 60) {
    minutes = 0;
    hour = (hour + 1) % 24;
  }
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function CreateBookingModal(props: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  userId: string | null;
  defaultDate: string;
  staff: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onCreated: () => void;
}) {
  const {
    open,
    onClose,
    companyId,
    userId,
    defaultDate,
    staff,
    services,
    clients,
    onCreated,
  } = props;

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createNewClient, setCreateNewClient] = useState(false);
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  const [staffId, setStaffId] = useState<string>(staff[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateCursor, setDateCursor] = useState(() => startOfMonth(new Date()));
  const [timeFrom, setTimeFrom] = useState("09:00");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [clientNote, setClientNote] = useState("");

  const [serviceSelections, setServiceSelections] = useState<BookingServiceSelection[]>(() => {
    const firstService = services[0];
    return firstService
      ? [{ id: safeId(), serviceId: firstService.id, addons: [] }]
      : [];
  });

  const [addonsOpen, setAddonsOpen] = useState<Record<string, boolean>>({});

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setDate(defaultDate);
    setDateCursor(startOfMonth(parseDateString(defaultDate) ?? new Date()));
    if (!staffId && staff[0]?.id) setStaffId(staff[0].id);
    if (serviceSelections.length === 0 && services[0]?.id) {
      setServiceSelections([{ id: safeId(), serviceId: services[0].id, addons: [] }]);
    }
  }, [defaultDate, open, services, staff, staffId, serviceSelections.length]);

  const filteredClients = useMemo(() => {
    const value = clientSearch.trim().toLowerCase();
    if (!value) return [] as ClientOption[];
    return clients.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      return (
        fullName.includes(value) ||
        (c.phone ?? "").includes(value) ||
        (c.email ?? "").toLowerCase().includes(value)
      );
    });
  }, [clientSearch, clients]);

  const totals = useMemo(() => {
    return calculateTotals(serviceSelections, services);
  }, [serviceSelections, services]);

  const timeTo = useMemo(() => {
    if (!isValidTime(timeFrom)) return "";
    return addMinutesToTime(timeFrom, totals.totalMinutes || 0);
  }, [timeFrom, totals.totalMinutes]);

  const resetForm = () => {
    setClientSearch("");
    setSelectedClientId(null);
    setCreateNewClient(false);
    setNewClientFirstName("");
    setNewClientLastName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setStaffId(staff[0]?.id ?? "");
    setDate(defaultDate);
    setDatePickerOpen(false);
    setDateCursor(startOfMonth(parseDateString(defaultDate) ?? new Date()));
    setTimeFrom("09:00");
    setInternalNote("");
    setClientNote("");
    const firstService = services[0];
    setServiceSelections(firstService ? [{ id: safeId(), serviceId: firstService.id, addons: [] }] : []);
    setFormError("");
  };

  const handleClose = () => {
    onClose();
    // reset after close so reopening is fresh
    setTimeout(resetForm, 0);
  };

  const handleAddService = () => {
    const firstService = services[0];
    if (!firstService) return;
    setServiceSelections((prev) => [...prev, { id: safeId(), serviceId: firstService.id, addons: [] }]);
  };

  const handleRemoveService = (selectionId: string) => {
    setServiceSelections((prev) => prev.filter((s) => s.id !== selectionId));
  };

  const handleSetService = (selectionId: string, serviceId: string) => {
    setServiceSelections((prev) =>
      prev.map((s) => (s.id === selectionId ? { ...s, serviceId, addons: [] } : s))
    );
    setAddonsOpen((prev) => ({ ...prev, [selectionId]: false }));
  };

  const handleToggleAddon = (selectionId: string, addonId: string) => {
    setServiceSelections((prev) =>
      prev.map((s) => {
        if (s.id !== selectionId) return s;
        const existing = s.addons.find((a) => a.addonId === addonId);
        if (existing) {
          return { ...s, addons: s.addons.filter((a) => a.addonId !== addonId) };
        }
        return { ...s, addons: [...s.addons, { addonId, count: 1 }] };
      })
    );
  };

  const handleAddonCount = (selectionId: string, addonId: string, delta: number) => {
    setServiceSelections((prev) =>
      prev.map((s) => {
        if (s.id !== selectionId) return s;
        return {
          ...s,
          addons: s.addons.map((a) =>
            a.addonId === addonId ? { ...a, count: Math.max(1, a.count + delta) } : a
          ),
        };
      })
    );
  };

  const handleSave = async () => {
    setFormError("");

    if (!companyId) {
      setFormError("Chýba companyId.");
      return;
    }

    if (!staffId) {
      setFormError("Vyberte pracovníka.");
      return;
    }

    if (!isValidDate(date)) {
      setFormError("Zadajte dátum vo formáte YYYY-MM-DD.");
      return;
    }

    if (!isValidTime(timeFrom)) {
      setFormError("Zadajte čas vo formáte HH:mm.");
      return;
    }

    if (!timeTo || timeFrom >= timeTo) {
      setFormError("Čas od musí byť menší ako čas do.");
      return;
    }

    if (serviceSelections.length === 0) {
      setFormError("Vyberte aspoň jednu službu.");
      return;
    }

    if (serviceSelections.some((s) => !s.serviceId)) {
      setFormError("Vyberte službu.");
      return;
    }

    setSaving(true);
    try {
      let clientId: string | null = selectedClientId;

      if (createNewClient) {
        const first = newClientFirstName.trim();
        const last = newClientLastName.trim();
        if (!first || !last) {
          setFormError("Pre nového klienta vyplňte meno aj priezvisko.");
          setSaving(false);
          return;
        }

        const { data: newClient, error: createClientError } = await supabase
          .from("clients")
          .insert({
            company_id: companyId,
            first_name: first,
            last_name: last,
            phone: newClientPhone.trim() || null,
            email: newClientEmail.trim() || null,
          })
          .select("id")
          .single();

        if (createClientError) throw createClientError;
        clientId = newClient?.id ?? null;
      }

      const firstServiceId = serviceSelections[0]?.serviceId;

      const { data: bookingRow, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          company_id: companyId,
          user_id: userId,
          client_id: clientId,
          staff_id: staffId,
          date,
          time_from: timeFrom,
          time_to: timeTo,
          service_id: firstServiceId,
          internal_note: internalNote.trim() || null,
          client_note: clientNote.trim() || null,
        })
        .select("id")
        .single();

      if (bookingError) throw bookingError;

      const bookingId = bookingRow.id as string;

      const { data: bookingServicesRows, error: bookingServicesError } = await supabase
        .from("booking_services")
        .insert(
          serviceSelections.map((s) => ({
            booking_id: bookingId,
            service_id: s.serviceId,
          }))
        )
        .select("id, service_id");

      if (bookingServicesError) throw bookingServicesError;

      const bookingServiceIdByService = new Map<string, string>();
      for (const row of bookingServicesRows ?? []) {
        bookingServiceIdByService.set(row.service_id as string, row.id as string);
      }

      const addonRows = serviceSelections.flatMap((selection) => {
        const bookingServiceId = bookingServiceIdByService.get(selection.serviceId);
        if (!bookingServiceId) return [];
        return selection.addons.map((a) => ({
          booking_service_id: bookingServiceId,
          addon_id: a.addonId,
          count: Math.max(1, a.count),
        }));
      });

      if (addonRows.length > 0) {
        const { error: addonError } = await supabase
          .from("booking_service_addons")
          .insert(addonRows);
        if (addonError) throw addonError;
      }

      onCreated();
      handleClose();
    } catch (e: any) {
      setFormError(e?.message ?? "Nepodarilo sa uložiť booking.");
    } finally {
      setSaving(false);
    }
  };

  const timeOptions = useMemo(() => {
    const items: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minutes = 0; minutes < 60; minutes += 15) {
        items.push(
          `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
        );
      }
    }
    return items;
  }, []);

  const monthGridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(dateCursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(dateCursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [dateCursor]);

  const selectedDateObj = parseDateString(date);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/40">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden">
            <Modal
              visible={datePickerOpen}
              animationType="fade"
              transparent
              onRequestClose={() => setDatePickerOpen(false)}
            >
              <View className="flex-1 bg-black/40 items-center justify-center px-6">
                <View className="w-full bg-white rounded-2xl overflow-hidden">
                  <HStack className="items-center justify-between px-4 py-3 border-b border-gray-200">
                    <Pressable onPress={() => setDateCursor((d) => subMonths(d, 1))}>
                      <ChevronLeft color="#111827" />
                    </Pressable>
                    <Text className="font-semibold text-gray-900">
                      {format(dateCursor, "MMMM yyyy", { locale: sk })}
                    </Text>
                    <Pressable onPress={() => setDateCursor((d) => addMonths(d, 1))}>
                      <ChevronRight color="#111827" />
                    </Pressable>
                  </HStack>

                  <HStack className="justify-around px-3 pt-3">
                    {"Po_Út_St_Št_Pi_So_Ne".split("_").map((d) => (
                      <Text
                        key={d}
                        className="text-xs font-semibold text-gray-500 w-[36px] text-center"
                      >
                        {d}
                      </Text>
                    ))}
                  </HStack>

                  <VStack className="px-3 pb-3">
                    {Array.from({ length: Math.ceil(monthGridDays.length / 7) }, (_, row) => {
                      const days = monthGridDays.slice(row * 7, row * 7 + 7);
                      return (
                        <HStack key={row} className="justify-around mt-2">
                          {days.map((day) => {
                            const inMonth = isSameMonth(day, dateCursor);
                            const selected = selectedDateObj ? isSameDay(day, selectedDateObj) : false;
                            return (
                              <Pressable
                                key={day.toISOString()}
                                onPress={() => {
                                  setDate(dateToDateString(day));
                                  setDatePickerOpen(false);
                                }}

                                className={`w-[36px] h-[36px] rounded-lg items-center justify-center ${
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
                              </Pressable>
                            );
                          })}
                        </HStack>
                      );
                    })}
                  </VStack>

                  <HStack className="gap-3 px-4 py-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      action="secondary"
                      className="flex-1"
                      onPress={() => setDatePickerOpen(false)}
                    >
                      <ButtonText>Zrušiť</ButtonText>
                    </Button>
                    <Button
                      className="flex-1"
                      onPress={() => {
                        setDate(dateToDateString(new Date()));
                        setDateCursor(startOfMonth(new Date()));
                        setDatePickerOpen(false);
                      }}
                    >
                      <ButtonText>Dnes</ButtonText>
                    </Button>
                  </HStack>
                </View>
              </View>
            </Modal>

            <Modal
              visible={timePickerOpen}
              animationType="fade"
              transparent
              onRequestClose={() => setTimePickerOpen(false)}
            >
              <View className="flex-1 bg-black/40 items-center justify-center px-6">
                <View className="w-full bg-white rounded-2xl overflow-hidden">
                  <HStack className="items-center justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="font-semibold text-gray-900">Vyber čas</Text>
                    <Pressable onPress={() => setTimePickerOpen(false)} className="p-1">
                      <X color="#111827" size={20} />
                    </Pressable>
                  </HStack>

                  <ScrollView className="max-h-[360px]" contentContainerStyle={{ padding: 12 }}>
                    <VStack className="gap-2">
                      {timeOptions.map((t) => {
                        const selected = t === timeFrom;
                        return (
                          <Pressable
                            key={t}
                            onPress={() => {
                              setTimeFrom(t);
                              setTimePickerOpen(false);
                            }}
                            className={`px-4 py-3 rounded-xl border ${
                              selected
                                ? "border-black bg-black"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <Text className={`font-semibold ${selected ? "text-white" : "text-gray-900"}`}>
                              {t}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </VStack>
                  </ScrollView>

                  <HStack className="gap-3 px-4 py-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      action="secondary"
                      className="flex-1"
                      onPress={() => setTimePickerOpen(false)}
                    >
                      <ButtonText>Zrušiť</ButtonText>
                    </Button>
                    <Button
                      className="flex-1"
                      onPress={() => {
                        setTimeFrom(getRoundedNowTime());
                        setTimePickerOpen(false);
                      }}
                    >
                      <ButtonText>Teraz</ButtonText>
                    </Button>
                  </HStack>
                </View>
              </View>
            </Modal>

            <HStack className="px-5 py-4 items-center justify-between border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">Nový booking</Text>
              <Pressable onPress={handleClose} className="p-2">
                <X color="#111827" />
              </Pressable>
            </HStack>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
              <VStack className="gap-6">
                <Box>
                  <HStack className="items-center justify-between mb-2">
                    <Text className="font-semibold text-gray-800">Klient (voliteľné)</Text>
                    <Pressable
                      onPress={() => setCreateNewClient((v) => !v)}
                      className="px-3 py-1.5 rounded-full border border-gray-200"
                    >
                      <Text className="text-sm font-semibold text-gray-700">
                        {createNewClient ? "Vybrať existujúceho" : "+ Nový klient"}
                      </Text>
                    </Pressable>
                  </HStack>

                  {createNewClient ? (
                    <VStack className="gap-3">
                      <Input>
                        <InputField
                          placeholder="Meno"
                          value={newClientFirstName}
                          onChangeText={setNewClientFirstName}
                        />
                      </Input>
                      <Input>
                        <InputField
                          placeholder="Priezvisko"
                          value={newClientLastName}
                          onChangeText={setNewClientLastName}
                        />
                      </Input>
                      <Input>
                        <InputField
                          placeholder="Telefón"
                          value={newClientPhone}
                          onChangeText={setNewClientPhone}
                          keyboardType="phone-pad"
                        />
                      </Input>
                      <Input>
                        <InputField
                          placeholder="Email"
                          value={newClientEmail}
                          onChangeText={setNewClientEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </Input>
                    </VStack>
                  ) : (
                    <VStack className="gap-3">
                      <Input className="bg-gray-100 rounded-lg h-10 border-0">
                        <InputField
                          className="text-base"
                          placeholder="Vyhľadať klienta"
                          value={clientSearch}
                          onChangeText={(value) => {
                            setClientSearch(value);
                            if (!value.trim()) setSelectedClientId(null);
                          }}
                        />
                      </Input>

                      {selectedClientId ? (
                        <Text className="text-xs text-gray-500">
                          Vybraný: {clients.find((c) => c.id === selectedClientId)?.first_name}{" "}
                          {clients.find((c) => c.id === selectedClientId)?.last_name}
                        </Text>
                      ) : null}

                      {clientSearch.trim() ? (
                        <VStack className="gap-2">
                          {filteredClients.length === 0 ? (
                            <Text className="text-sm text-gray-500">
                              Žiadny klient.
                            </Text>
                          ) : (
                            filteredClients.slice(0, 6).map((c) => {
                              const selected = c.id === selectedClientId;
                              return (
                                <Pressable
                                  key={c.id}
                                  onPress={() => setSelectedClientId(selected ? null : c.id)}
                                  className={`p-3 rounded-xl border ${
                                    selected
                                      ? "border-black bg-black"
                                      : "border-gray-200 bg-white"
                                  }`}
                                >
                                  <Text
                                    className={`font-semibold ${
                                      selected ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {c.first_name} {c.last_name}
                                  </Text>
                                  {(c.phone || c.email) && (
                                    <Text
                                      className={`text-xs ${
                                        selected ? "text-gray-200" : "text-gray-500"
                                      }`}
                                    >
                                      {[c.phone, c.email].filter(Boolean).join(" • ")}
                                    </Text>
                                  )}
                                </Pressable>
                              );
                            })
                          )}
                        </VStack>
                      ) : (
                        <Text className="text-sm text-gray-500">
                          Začnite písať pre vyhľadanie klienta.
                        </Text>
                      )}
                    </VStack>
                  )}
                </Box>

                <Box>
                  <Text className="font-semibold text-gray-800 mb-2">Pracovník</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack className="gap-2">
                      {staff.map((s) => {
                        const selected = staffId === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => setStaffId(s.id)}
                            className={`px-4 py-2 rounded-full border ${
                              selected ? "bg-black border-black" : "bg-white border-gray-200"
                            }`}
                          >
                            <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-700"}`}>
                              {s.full_name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </HStack>
                  </ScrollView>
                </Box>

                <Box>
                  <Text className="font-semibold text-gray-800 mb-2">Dátum</Text>
                  <Pressable
                    onPress={() => setDatePickerOpen(true)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-3"
                  >
                    <Text className="text-base text-gray-900">
                      {parseDateString(date)
                        ? format(parseDateString(date)!, "EEEE, d. MMMM yyyy", {
                            locale: sk,
                          })
                        : date || "Vyberte dátum"}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Tapnite pre výber dátumu
                    </Text>
                  </Pressable>
                </Box>

                <Box>
                  <Text className="font-semibold text-gray-800 mb-2">Čas</Text>
                  <HStack className="gap-3">
                    <Box className="flex-1">
                      <Pressable
                        onPress={() => setTimePickerOpen(true)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-3"
                      >
                        <Text className="text-base text-gray-900">{timeFrom}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          Vyber po 15 min
                        </Text>
                      </Pressable>
                    </Box>
                    <Box className="flex-1">
                      <View className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                        <Text className="text-base text-gray-900">{timeTo}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          Koniec sa ráta podľa trvania.
                        </Text>
                      </View>
                    </Box>
                  </HStack>
                </Box>

                <Box>
                  <HStack className="items-center justify-between mb-2">
                    <Text className="font-semibold text-gray-800">Služby a doplnky</Text>
                    <Pressable
                      onPress={handleAddService}
                      className="px-3 py-1.5 rounded-full border border-gray-200"
                    >
                      <Text className="text-sm font-semibold text-gray-700">+ Služba</Text>
                    </Pressable>
                  </HStack>

                  <VStack className="gap-4">
                    {serviceSelections.map((selection, index) => {
                      const service = services.find((s) => s.id === selection.serviceId);
                      return (
                        <Box
                          key={selection.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4"
                        >
                          <HStack className="items-center justify-between">
                            <Text className="font-semibold text-gray-900">
                              Služba {index + 1}
                            </Text>
                            {serviceSelections.length > 1 ? (
                              <Pressable onPress={() => handleRemoveService(selection.id)}>
                                <Text className="text-sm font-semibold text-red-600">Odstrániť</Text>
                              </Pressable>
                            ) : null}
                          </HStack>

                          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                            <HStack className="gap-2">
                              {services.map((s) => {
                                const selected = s.id === selection.serviceId;
                                return (
                                  <Pressable
                                    key={s.id}
                                    onPress={() => handleSetService(selection.id, s.id)}
                                    className={`px-4 py-2 rounded-full border ${
                                      selected ? "bg-black border-black" : "bg-white border-gray-200"
                                    }`}
                                  >
                                    <Text
                                      className={`text-sm font-semibold ${
                                        selected ? "text-white" : "text-gray-700"
                                      }`}
                                    >
                                      {s.name}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </HStack>
                          </ScrollView>

                          {service?.addons?.length ? (
                            <Box className="mt-4">
                              <HStack className="items-center justify-between mb-2">
                                <Text className="text-xs font-semibold text-gray-500">
                                  Doplnky
                                  {selection.addons.length > 0
                                    ? ` (${selection.addons.length})`
                                    : ""}
                                </Text>
                                <Pressable
                                  onPress={() =>
                                    setAddonsOpen((prev) => ({
                                      ...prev,
                                      [selection.id]: !prev[selection.id],
                                    }))
                                  }
                                >
                                  <Text className="text-xs font-semibold text-gray-700">
                                    {addonsOpen[selection.id] ? "Skryť" : "Rozbaliť"}
                                  </Text>
                                </Pressable>
                              </HStack>

                              {!addonsOpen[selection.id] ? (
                                selection.addons.length > 0 ? (
                                  <VStack className="gap-2">
                                    {selection.addons.slice(0, 3).map((addonSel) => {
                                      const addon = service.addons.find(
                                        (a) => a.id === addonSel.addonId
                                      );
                                      if (!addon) return null;
                                      return (
                                        <Text
                                          key={addon.id}
                                          className="text-xs text-gray-600"
                                        >
                                          {addon.name} ×{addonSel.count}
                                        </Text>
                                      );
                                    })}
                                    {selection.addons.length > 3 ? (
                                      <Text className="text-xs text-gray-500">
                                        +{selection.addons.length - 3} ďalšie
                                      </Text>
                                    ) : null}
                                  </VStack>
                                ) : (
                                  <Text className="text-xs text-gray-500">
                                    Žiadne doplnky
                                  </Text>
                                )
                              ) : (
                                <VStack className="gap-2">
                                  {service.addons.map((addon) => {
                                    const selectedAddon = selection.addons.find(
                                      (a) => a.addonId === addon.id
                                    );
                                    const selected = !!selectedAddon;
                                    return (
                                      <Box
                                        key={addon.id}
                                        className={`rounded-xl border p-3 ${
                                          selected
                                            ? "border-black bg-gray-50"
                                            : "border-gray-200 bg-white"
                                        }`}
                                      >
                                        <HStack className="items-center justify-between">
                                          <Pressable
                                            onPress={() =>
                                              handleToggleAddon(selection.id, addon.id)
                                            }
                                            className="flex-1"
                                          >
                                            <Text className="font-semibold text-gray-900">
                                              {addon.name}
                                            </Text>
                                            <Text className="text-xs text-gray-500">
                                              {addon.duration} min • {formatPrice(addon.price)}
                                            </Text>
                                          </Pressable>

                                          {selected ? (
                                            <HStack className="items-center gap-2">
                                              <Pressable
                                                onPress={() =>
                                                  handleAddonCount(
                                                    selection.id,
                                                    addon.id,
                                                    -1
                                                  )
                                                }
                                                className="w-9 h-9 rounded-full border border-gray-200 items-center justify-center"
                                              >
                                                <Minus size={16} color="#111827" />
                                              </Pressable>
                                              <Text className="w-6 text-center font-semibold">
                                                {selectedAddon?.count ?? 1}
                                              </Text>
                                              <Pressable
                                                onPress={() =>
                                                  handleAddonCount(
                                                    selection.id,
                                                    addon.id,
                                                    1
                                                  )
                                                }
                                                className="w-9 h-9 rounded-full border border-gray-200 items-center justify-center"
                                              >
                                                <Plus size={16} color="#111827" />
                                              </Pressable>
                                            </HStack>
                                          ) : null}
                                        </HStack>
                                      </Box>
                                    );
                                  })}
                                </VStack>
                              )}
                            </Box>
                          ) : null}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                <Box>
                  <Text className="font-semibold text-gray-800 mb-2">Interná poznámka</Text>
                  <Input>
                    <InputField
                      placeholder="Poznámky len interne"
                      value={internalNote}
                      onChangeText={setInternalNote}
                      multiline
                      className="min-h-[80px]"
                    />
                  </Input>
                </Box>

                <Box>
                  <Text className="font-semibold text-gray-800 mb-2">Poznámka klienta</Text>
                  <Input>
                    <InputField
                      placeholder="Preferencie / poznámka"
                      value={clientNote}
                      onChangeText={setClientNote}
                      multiline
                      className="min-h-[80px]"
                    />
                  </Input>
                </Box>

                {formError ? (
                  <Text className="text-sm font-semibold text-red-600">{formError}</Text>
                ) : null}

                <Box className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <HStack className="items-center justify-between">
                    <Text className="text-sm text-gray-500">Celkový čas</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {totals.totalMinutes} min
                    </Text>
                  </HStack>
                  <HStack className="items-center justify-between mt-2">
                    <Text className="text-sm text-gray-500">Cena spolu</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {formatPrice(totals.totalPrice)}
                    </Text>
                  </HStack>
                </Box>

                <HStack className="gap-3 pb-8">
                  <Button variant="outline" action="secondary" className="flex-1" onPress={handleClose}>
                    <ButtonText>Zrušiť</ButtonText>
                  </Button>
                  <Button className="flex-1" onPress={handleSave} isDisabled={saving}>
                    {saving ? <ButtonSpinner color="white" /> : null}
                    <ButtonText>Uložiť</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
