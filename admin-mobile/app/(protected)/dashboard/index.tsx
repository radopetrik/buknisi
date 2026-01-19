import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { CreditCard, Eye, Wallet } from "lucide-react-native";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/lib/supabase";

type AddonOption = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

type ServiceOption = {
  id: string;
  name: string;
  price: number;
  duration: number;
  addons: AddonOption[];
};

type ClientOption = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
};

type PaymentMethod = "cash" | "card";

type InvoiceItem = {
  type: "service" | "addon";
  id?: string;
  name: string;
  price: number;
  count: number;
  serviceName?: string;
};

type Invoice = {
  id: string;
  companyId: string;
  clientId?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  createdAt: string;
};

type BookingServiceAddonSelection = {
  addonId: string;
  count: number;
};

type BookingServiceSelection = {
  id: string;
  serviceId: string;
  addons: BookingServiceAddonSelection[];
};

type UnpaidBooking = {
  id: string;
  clientId?: string | null;
  clientName?: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  serviceSelections: BookingServiceSelection[];
  totalPrice: number;
};

type CompanyDetails = {
  name: string;
  addressText?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
};

function safeId() {
  const cryptoAny = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  if (cryptoAny?.crypto?.randomUUID) return cryptoAny.crypto.randomUUID();
  return `${Date.now()}-${Math.random()}`;
}

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat("sk-SK", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  } catch {
    return `€${value.toFixed(2)}`;
  }
}

function calculateTotal(selections: BookingServiceSelection[], services: ServiceOption[]) {
  let total = 0;
  for (const sel of selections) {
    const service = services.find((s) => s.id === sel.serviceId);
    if (!service) continue;

    total += service.price;
    for (const addonSel of sel.addons) {
      const addon = service.addons.find((a) => a.id === addonSel.addonId);
      if (!addon) continue;
      total += addon.price * addonSel.count;
    }
  }
  return total;
}

function buildInvoiceItems(selections: BookingServiceSelection[], services: ServiceOption[]): InvoiceItem[] {
  const items: InvoiceItem[] = [];

  for (const sel of selections) {
    const service = services.find((s) => s.id === sel.serviceId);
    if (!service) continue;

    items.push({
      type: "service",
      id: service.id,
      name: service.name,
      price: service.price,
      count: 1,
    });

    for (const addonSel of sel.addons) {
      const addon = service.addons.find((a) => a.id === addonSel.addonId);
      if (!addon) continue;
      items.push({
        type: "addon",
        id: addon.id,
        name: addon.name,
        price: addon.price,
        count: addonSel.count,
        serviceName: service.name,
      });
    }
  }

  return items;
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
      } satisfies AddonOption,
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
    };
  });

  return mapped;
}

async function fetchCompanyDetails(companyId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("name, address_text, phone, email, cities(name)")
    .eq("id", companyId)
    .single();

  if (error) throw error;

  return {
    name: data.name,
    addressText: data.address_text,
    phone: data.phone,
    email: data.email,
    city: (data.cities as any)?.[0]?.name ?? (data.cities as any)?.name,
  } satisfies CompanyDetails;
}

async function fetchUnpaidBookings(companyId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id, client_id, date, time_from, time_to,
      clients(first_name, last_name),
      booking_services(
        service_id,
        services(name, price),
        booking_service_addons(addon_id, count, addons(name, price))
      )
      `
    )
    .eq("company_id", companyId)
    .is("invoice_id", null)
    .order("date", { ascending: false })
    .order("time_from", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((booking: any) => {
    let totalPrice = 0;

    const serviceSelections: BookingServiceSelection[] = (booking.booking_services ?? []).map(
      (bs: any) => {
        totalPrice += Number(bs.services?.price ?? 0);

        const addons: BookingServiceAddonSelection[] = (bs.booking_service_addons ?? []).map(
          (bsa: any) => {
            totalPrice += Number(bsa.addons?.price ?? 0) * (bsa.count ?? 1);
            return { addonId: bsa.addon_id, count: bsa.count ?? 1 };
          }
        );

        return {
          id: safeId(),
          serviceId: bs.service_id,
          addons,
        };
      }
    );

    const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;

    return {
      id: booking.id,
      clientId: booking.client_id,
      clientName: client ? `${client.first_name} ${client.last_name}` : undefined,
      date: booking.date,
      timeFrom: booking.time_from,
      timeTo: booking.time_to,
      serviceSelections,
      totalPrice,
    } satisfies UnpaidBooking;
  }) as UnpaidBooking[];
}

async function fetchInvoices(companyId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, company_id, client_id, amount, payment_method, services_and_addons, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    return {
      id: row.id,
      companyId: row.company_id,
      clientId: row.client_id,
      amount: Number(row.amount ?? 0),
      paymentMethod: row.payment_method,
      items: (row.services_and_addons ?? []) as InvoiceItem[],
      createdAt: row.created_at,
    } satisfies Invoice;
  });
}

async function createInvoice(params: {
  companyId: string;
  clientId: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  items: InvoiceItem[];
  bookingId?: string;
}) {
  const { companyId, clientId, amount, paymentMethod, items, bookingId } = params;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      client_id: clientId,
      amount,
      payment_method: paymentMethod,
      services_and_addons: items,
    })
    .select("id")
    .single();

  if (invoiceError) throw invoiceError;

  if (bookingId) {
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({ invoice_id: invoice.id })
      .eq("id", bookingId)
      .eq("company_id", companyId);

    if (bookingError) throw bookingError;
  }

  return invoice;
}

async function updateBookingAndPay(params: {
  companyId: string;
  bookingId: string;
  selections: BookingServiceSelection[];
  clientId: string | undefined;
  paymentMethod: PaymentMethod;
  services: ServiceOption[];
}) {
  const { companyId, bookingId, selections, clientId, paymentMethod, services } = params;

  const totalAmount = calculateTotal(selections, services);
  const invoiceItems = buildInvoiceItems(selections, services);

  const deleteRes = await supabase
    .from("booking_services")
    .delete()
    .eq("booking_id", bookingId);

  if (deleteRes.error) throw deleteRes.error;

  for (const sel of selections) {
    const { data: bs, error: bsError } = await supabase
      .from("booking_services")
      .insert({ booking_id: bookingId, service_id: sel.serviceId })
      .select("id")
      .single();

    if (bsError) throw bsError;

    if (sel.addons.length > 0) {
      const addonInserts = sel.addons.map((a) => ({
        booking_service_id: bs.id,
        addon_id: a.addonId,
        count: a.count,
      }));

      const addonRes = await supabase.from("booking_service_addons").insert(addonInserts);
      if (addonRes.error) throw addonRes.error;
    }
  }

  if (clientId) {
    const updateClientRes = await supabase
      .from("bookings")
      .update({ client_id: clientId })
      .eq("id", bookingId)
      .eq("company_id", companyId);

    if (updateClientRes.error) throw updateClientRes.error;
  }

  await createInvoice({
    companyId,
    clientId: clientId ?? null,
    amount: totalAmount,
    paymentMethod,
    items: invoiceItems,
    bookingId,
  });
}

type CheckoutMode = "new" | "booking";

function CheckoutModal(props: {
  open: boolean;
  onClose: () => void;
  mode: CheckoutMode;
  initialBooking: UnpaidBooking | null;
  services: ServiceOption[];
  clients: ClientOption[];
  onPay: (params: {
    selections: BookingServiceSelection[];
    clientId: string | undefined;
    paymentMethod: PaymentMethod;
  }) => void;
  processing?: boolean;
}) {
  const { open, onClose, mode, initialBooking, services, clients, onPay, processing } = props;

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [serviceSelections, setServiceSelections] = useState<BookingServiceSelection[]>([]);
  const [addonsOpen, setAddonsOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;

    if (mode === "booking" && initialBooking) {
      setServiceSelections(
        initialBooking.serviceSelections.length
          ? initialBooking.serviceSelections
          : services[0]
            ? [{ id: safeId(), serviceId: services[0].id, addons: [] }]
            : []
      );
      setSelectedClientId(initialBooking.clientId ?? null);
      setClientSearch(initialBooking.clientName ?? "");
    } else {
      setServiceSelections(services[0] ? [{ id: safeId(), serviceId: services[0].id, addons: [] }] : []);
      setSelectedClientId(null);
      setClientSearch("");
    }

    setPaymentMethod("cash");
    setAddonsOpen({});
  }, [open, mode, initialBooking, services]);

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return [];
    return clients.filter((c) => {
      const label = `${c.first_name} ${c.last_name}`.toLowerCase();
      return (
        label.includes(query) ||
        (c.email?.toLowerCase().includes(query) ?? false) ||
        (c.phone?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [clientSearch, clients]);

  const totals = useMemo(() => {
    return calculateTotal(serviceSelections, services);
  }, [serviceSelections, services]);

  const handleAddService = useCallback(() => {
    if (!services[0]) return;
    setServiceSelections((prev) => [...prev, { id: safeId(), serviceId: services[0].id, addons: [] }]);
  }, [services]);

  const handleRemoveService = useCallback((selectionId: string) => {
    setServiceSelections((prev) => prev.filter((s) => s.id !== selectionId));
  }, []);

  const handleSetService = useCallback((selectionId: string, serviceId: string) => {
    setServiceSelections((prev) =>
      prev.map((s) => (s.id === selectionId ? { ...s, serviceId, addons: [] } : s))
    );
  }, []);

  const handleToggleAddon = useCallback((selectionId: string, addonId: string) => {
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
  }, []);

  const handleAddonCount = useCallback((selectionId: string, addonId: string, delta: number) => {
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
  }, []);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40">
        <View className="flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden">
          <HStack className="px-5 py-4 items-center justify-between border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">
              {mode === "new" ? "Nová platba" : "Platba rezervácie"}
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-base font-bold">×</Text>
            </Pressable>
          </HStack>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
            <VStack className="gap-6">
              <Box>
                <Text className="font-semibold text-gray-800 mb-2">Klient (voliteľné)</Text>
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
                  <Text className="text-xs text-gray-500 mt-2">
                    Vybraný: {clients.find((c) => c.id === selectedClientId)?.first_name} {" "}
                    {clients.find((c) => c.id === selectedClientId)?.last_name}
                  </Text>
                ) : null}

                {clientSearch.trim() ? (
                  <VStack className="gap-2 mt-3">
                    {filteredClients.length === 0 ? (
                      <Text className="text-sm text-gray-500">Žiadny klient.</Text>
                    ) : (
                      filteredClients.slice(0, 6).map((c) => {
                        const selected = c.id === selectedClientId;
                        return (
                          <Pressable
                            key={c.id}
                            onPress={() => {
                              setSelectedClientId(selected ? null : c.id);
                              setClientSearch(selected ? "" : `${c.first_name} ${c.last_name}`);
                            }}
                            className={`p-3 rounded-xl border ${
                              selected ? "border-black bg-black" : "border-gray-200 bg-white"
                            }`}
                          >
                            <Text className={`font-semibold ${selected ? "text-white" : "text-gray-900"}`}>
                              {c.first_name} {c.last_name}
                            </Text>
                            {(c.phone || c.email) && (
                              <Text className={`text-xs ${selected ? "text-gray-200" : "text-gray-500"}`}>
                                {[c.phone, c.email].filter(Boolean).join(" • ")}
                              </Text>
                            )}
                          </Pressable>
                        );
                      })
                    )}
                  </VStack>
                ) : (
                  <Text className="text-sm text-gray-500 mt-2">Začnite písať pre vyhľadanie klienta.</Text>
                )}
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

                {services.length === 0 ? (
                  <Text className="text-sm text-gray-500">Najprv si pridajte služby.</Text>
                ) : (
                  <VStack className="gap-4">
                    {serviceSelections.map((selection, index) => {
                      const service = services.find((s) => s.id === selection.serviceId);
                      return (
                        <Box key={selection.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                          <HStack className="items-center justify-between">
                            <Text className="font-semibold text-gray-900">Služba {index + 1}</Text>
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
                                    <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-700"}`}>
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
                                  Doplnky{selection.addons.length > 0 ? ` (${selection.addons.length})` : ""}
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

                              {addonsOpen[selection.id] ? (
                                <VStack className="gap-2">
                                  {service.addons.map((addon) => {
                                    const selectedAddon = selection.addons.find((a) => a.addonId === addon.id);
                                    const selected = !!selectedAddon;
                                    return (
                                      <Box
                                        key={addon.id}
                                        className={`rounded-xl border p-3 ${
                                          selected ? "border-black bg-gray-50" : "border-gray-200 bg-white"
                                        }`}
                                      >
                                        <HStack className="items-center justify-between">
                                          <Pressable
                                            onPress={() => handleToggleAddon(selection.id, addon.id)}
                                            className="flex-1"
                                          >
                                            <Text className="font-semibold text-gray-900">{addon.name}</Text>
                                            <Text className="text-xs text-gray-500">
                                              {formatPrice(addon.price)}
                                            </Text>
                                          </Pressable>

                                          {selected ? (
                                            <HStack className="items-center gap-2">
                                              <Pressable
                                                onPress={() => handleAddonCount(selection.id, addon.id, -1)}
                                                className="w-9 h-9 rounded-full border border-gray-200 items-center justify-center"
                                              >
                                                <Text className="text-lg font-bold">-</Text>
                                              </Pressable>
                                              <Text className="w-6 text-center font-semibold">
                                                {selectedAddon?.count ?? 1}
                                              </Text>
                                              <Pressable
                                                onPress={() => handleAddonCount(selection.id, addon.id, 1)}
                                                className="w-9 h-9 rounded-full border border-gray-200 items-center justify-center"
                                              >
                                                <Text className="text-lg font-bold">+</Text>
                                              </Pressable>
                                            </HStack>
                                          ) : null}
                                        </HStack>
                                      </Box>
                                    );
                                  })}
                                </VStack>
                              ) : selection.addons.length > 0 ? (
                                <VStack className="gap-1">
                                  {selection.addons.slice(0, 3).map((addonSel) => {
                                    const addon = service.addons.find((a) => a.id === addonSel.addonId);
                                    if (!addon) return null;
                                    return (
                                      <Text key={addon.id} className="text-xs text-gray-600">
                                        {addon.name} ×{addonSel.count}
                                      </Text>
                                    );
                                  })}
                                  {selection.addons.length > 3 ? (
                                    <Text className="text-xs text-gray-500">+{selection.addons.length - 3} ďalšie</Text>
                                  ) : null}
                                </VStack>
                              ) : (
                                <Text className="text-xs text-gray-500">Žiadne doplnky</Text>
                              )}
                            </Box>
                          ) : null}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>

              <Box>
                <Text className="font-semibold text-gray-800 mb-2">Spôsob platby</Text>
                <HStack className="gap-3">
                  <Pressable
                    onPress={() => setPaymentMethod("cash")}
                    className={`flex-1 rounded-2xl border p-4 ${
                      paymentMethod === "cash" ? "border-black bg-gray-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <HStack className="items-center gap-2">
                      <Wallet size={18} color="#111827" />
                      <Text className="font-semibold text-gray-900">Hotovosť</Text>
                    </HStack>
                  </Pressable>
                  <Pressable
                    onPress={() => setPaymentMethod("card")}
                    className={`flex-1 rounded-2xl border p-4 ${
                      paymentMethod === "card" ? "border-black bg-gray-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <HStack className="items-center gap-2">
                      <CreditCard size={18} color="#111827" />
                      <Text className="font-semibold text-gray-900">Karta</Text>
                    </HStack>
                  </Pressable>
                </HStack>
              </Box>

              <Box className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <HStack className="items-center justify-between">
                  <Text className="text-gray-600 font-semibold">Spolu</Text>
                  <Text className="text-gray-900 font-bold text-lg">{formatPrice(totals)}</Text>
                </HStack>
              </Box>
            </VStack>
          </ScrollView>

          <HStack className="gap-3 px-5 py-4 border-t border-gray-200">
            <Button
              variant="outline"
              action="secondary"
              className="flex-1"
              onPress={onClose}
              isDisabled={!!processing}
            >
              <ButtonText>Zrušiť</ButtonText>
            </Button>
            <Button
              className="flex-1"
              onPress={() =>
                onPay({
                  selections: serviceSelections,
                  clientId: selectedClientId ?? undefined,
                  paymentMethod,
                })
              }
              isDisabled={!!processing || serviceSelections.length === 0}
            >
              <ButtonText>{processing ? "Spracovávam..." : `Zaplatiť ${formatPrice(totals)}`}</ButtonText>
            </Button>
          </HStack>
        </View>
      </View>
    </Modal>
  );
}

function InvoiceDetailModal(props: {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  clients: ClientOption[];
  company: CompanyDetails;
}) {
  const { invoice, open, onClose, clients, company } = props;

  const client = useMemo(() => {
    if (!invoice?.clientId) return null;
    return clients.find((c) => c.id === invoice.clientId) ?? null;
  }, [clients, invoice?.clientId]);

  if (!invoice) return null;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40">
        <View className="flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden">
          <HStack className="px-5 py-4 items-center justify-between border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Detail faktúry</Text>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-base font-bold">×</Text>
            </Pressable>
          </HStack>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
            <VStack className="gap-4">
              <Box className="rounded-2xl border border-gray-200 bg-white p-4">
                <Text className="text-base font-bold text-gray-900">{company.name}</Text>
                {company.addressText ? <Text className="text-sm text-gray-600">{company.addressText}</Text> : null}
                {company.city ? <Text className="text-sm text-gray-600">{company.city}</Text> : null}
                {company.email ? <Text className="text-sm text-gray-600">Email: {company.email}</Text> : null}
                {company.phone ? <Text className="text-sm text-gray-600">Tel: {company.phone}</Text> : null}
              </Box>

              <Box className="rounded-2xl border border-gray-200 bg-white p-4">
                <Text className="text-sm text-gray-500">Dátum</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {format(new Date(invoice.createdAt), "d. MMM yyyy HH:mm", { locale: sk })}
                </Text>
                <Text className="text-sm text-gray-500 mt-2">Metóda</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {invoice.paymentMethod === "card" ? "Karta" : "Hotovosť"}
                </Text>
              </Box>

              {(client || invoice.clientId) && (
                <Box className="rounded-2xl border border-gray-200 bg-white p-4">
                  <Text className="text-sm text-gray-500">Klient</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {client ? `${client.first_name} ${client.last_name}` : invoice.clientId}
                  </Text>
                  {client?.email ? <Text className="text-sm text-gray-600">{client.email}</Text> : null}
                  {client?.phone ? <Text className="text-sm text-gray-600">{client.phone}</Text> : null}
                </Box>
              )}

              <Box className="rounded-2xl border border-gray-200 bg-white p-4">
                <Text className="text-sm text-gray-500 mb-2">Položky</Text>
                <VStack className="gap-2">
                  {invoice.items.map((item, idx) => (
                    <HStack key={`${item.name}-${idx}`} className="items-start justify-between">
                      <Box className="flex-1 pr-4">
                        <Text className="font-semibold text-gray-900">{item.name}</Text>
                        {item.type === "addon" && item.serviceName ? (
                          <Text className="text-xs text-gray-500">K službe: {item.serviceName}</Text>
                        ) : null}
                        <Text className="text-xs text-gray-500">
                          {item.count} × {formatPrice(item.price)}
                        </Text>
                      </Box>
                      <Text className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.count)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>

                <HStack className="items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <Text className="font-semibold text-gray-700">Spolu</Text>
                  <Text className="font-bold text-gray-900 text-lg">{formatPrice(invoice.amount)}</Text>
                </HStack>
              </Box>
            </VStack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function BillingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: company } = useCompany();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ createPayment?: string; bookingId?: string }>();

  const [activeTab, setActiveTab] = useState<"unpaid" | "history">("unpaid");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("new");
  const [selectedBooking, setSelectedBooking] = useState<UnpaidBooking | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const billingQuery = useQuery({
    queryKey: ["billing-data", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const companyId = company!.id as string;
      const [services, clients, unpaidBookings, invoices, companyDetails] = await Promise.all([
        fetchServicesWithAddons(companyId),
        fetchClients(companyId),
        fetchUnpaidBookings(companyId),
        fetchInvoices(companyId),
        fetchCompanyDetails(companyId),
      ]);

      return { services, clients, unpaidBookings, invoices, companyDetails };
    },
  });

  const { data, isLoading } = billingQuery;

  const unpaidCount = data?.unpaidBookings.length ?? 0;

  const createParam = Array.isArray(params.createPayment) ? params.createPayment[0] : params.createPayment;
  const bookingParam = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;

  const openNewPayment = useCallback(() => {
    if (!data) return;
    setCheckoutMode("new");
    setSelectedBooking(null);
    setCheckoutOpen(true);
  }, [data]);

  const openPayBooking = useCallback((booking: UnpaidBooking) => {
    setCheckoutMode("booking");
    setSelectedBooking(booking);
    setCheckoutOpen(true);
  }, []);

  useEffect(() => {
    if (createParam !== "1") return;
    if (!data) return;

    openNewPayment();
    router.setParams({ createPayment: "" });
  }, [createParam, data, openNewPayment, router]);

  useEffect(() => {
    if (!bookingParam) return;
    if (!data) return;

    const booking = data.unpaidBookings.find((item) => item.id === bookingParam);
    if (booking) {
      openPayBooking(booking);
    } else {
      alert("Booking je už zaplatený alebo neexistuje.");
    }

    router.setParams({ bookingId: "" });
  }, [bookingParam, data, openPayBooking, router]);

  const handlePay = useCallback(
    async (payload: { selections: BookingServiceSelection[]; clientId: string | undefined; paymentMethod: PaymentMethod }) => {
      if (!company?.id || !data) return;

      setProcessingPayment(true);
      try {
        if (checkoutMode === "booking" && selectedBooking) {
          await updateBookingAndPay({
            companyId: company.id,
            bookingId: selectedBooking.id,
            selections: payload.selections,
            clientId: payload.clientId,
            paymentMethod: payload.paymentMethod,
            services: data.services,
          });
        } else {
          const amount = calculateTotal(payload.selections, data.services);
          const items = buildInvoiceItems(payload.selections, data.services);
          await createInvoice({
            companyId: company.id,
            clientId: payload.clientId ?? null,
            amount,
            paymentMethod: payload.paymentMethod,
            items,
          });
        }

        await queryClient.invalidateQueries({ queryKey: ["billing-data", company.id] });
        setCheckoutOpen(false);
      } catch (e: any) {
        alert(e?.message ?? "Nastala chyba pri platbe");
      } finally {
        setProcessingPayment(false);
      }
    },
    [checkoutMode, company?.id, data, queryClient, selectedBooking]
  );

  const getClientNameForInvoice = useCallback(
    (invoice: Invoice) => {
      if (!invoice.clientId) return "-";
      const client = data?.clients.find((c) => c.id === invoice.clientId);
      return client ? `${client.first_name} ${client.last_name}` : "Neznámy";
    },
    [data?.clients]
  );

  if (isLoading || !data) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}
      refreshControl={<RefreshControl refreshing={billingQuery.isFetching} onRefresh={billingQuery.refetch} />}
    >
      <Stack.Screen options={{ headerTitle: "Pokladňa", headerShadowVisible: false }} />

      <Box className="mb-4">
        <Heading size="xl" className="font-bold text-gray-900">Pokladňa</Heading>
        <Text className="text-gray-500 mt-1">Správa platieb a faktúr</Text>
      </Box>

      <HStack className="mb-4 gap-2">
        <Pressable
          onPress={() => setActiveTab("unpaid")}
          className={`flex-1 rounded-full px-4 py-2 border ${
            activeTab === "unpaid" ? "bg-black border-black" : "bg-white border-gray-200"
          }`}
        >
          <Text className={`text-center font-semibold ${activeTab === "unpaid" ? "text-white" : "text-gray-700"}`}>
            Nezaplatené ({unpaidCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("history")}
          className={`flex-1 rounded-full px-4 py-2 border ${
            activeTab === "history" ? "bg-black border-black" : "bg-white border-gray-200"
          }`}
        >
          <Text className={`text-center font-semibold ${activeTab === "history" ? "text-white" : "text-gray-700"}`}>
            História faktúr
          </Text>
        </Pressable>
      </HStack>

      {activeTab === "unpaid" ? (
        <Box className="mb-8">
          {data.unpaidBookings.length === 0 ? (
            <Box className="bg-white p-6 rounded-2xl border border-dashed border-gray-300">
              <Text className="text-gray-500 text-center">Žiadne nezaplatené rezervácie.</Text>
              <Text className="text-gray-400 text-center mt-1">Novú platbu vytvoríte cez + v spodnom menu.</Text>
            </Box>
          ) : (
            <VStack className="gap-3">
              {data.unpaidBookings.map((booking) => (
                <Box key={booking.id} className="bg-white p-4 rounded-2xl border border-gray-100">
                  <HStack className="items-start justify-between">
                    <Box className="flex-1 pr-3">
                      <Text className="font-bold text-gray-900">
                        {booking.clientName || "Neznámy klient"}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {format(new Date(booking.date), "d. MMM yyyy", { locale: sk })} • {booking.timeFrom.slice(0, 5)}–{booking.timeTo.slice(0, 5)}
                      </Text>
                    </Box>
                    <Text className="font-bold text-gray-900">{formatPrice(booking.totalPrice)}</Text>
                  </HStack>

                  <HStack className="mt-3">
                    <Button className="flex-1" onPress={() => openPayBooking(booking)}>
                      <ButtonText>Zaplatiť</ButtonText>
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      ) : (
        <Box className="mb-8">
          {data.invoices.length === 0 ? (
            <Box className="bg-white p-6 rounded-2xl border border-dashed border-gray-300">
              <Text className="text-gray-500 text-center">Žiadne faktúry v histórii.</Text>
            </Box>
          ) : (
            <VStack className="gap-3">
              {data.invoices.map((invoice) => (
                <Box key={invoice.id} className="bg-white p-4 rounded-2xl border border-gray-100">
                  <HStack className="items-start justify-between">
                    <Box className="flex-1 pr-3">
                      <Text className="font-bold text-gray-900">
                        {getClientNameForInvoice(invoice)}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {format(new Date(invoice.createdAt), "d. MMM yyyy HH:mm", { locale: sk })} • {invoice.paymentMethod === "card" ? "Karta" : "Hotovosť"}
                      </Text>
                      {invoice.items.length ? (
                        <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>
                          {invoice.items.map((i) => `${i.name} (x${i.count})`).join(", ")}
                        </Text>
                      ) : null}
                    </Box>

                    <VStack className="items-end gap-2">
                      <Text className="font-bold text-gray-900">{formatPrice(invoice.amount)}</Text>
                      <Pressable
                        onPress={() => setSelectedInvoice(invoice)}
                        className="px-3 py-2 rounded-full border border-gray-200"
                      >
                        <HStack className="items-center gap-2">
                          <Eye size={16} color="#111827" />
                          <Text className="text-sm font-semibold text-gray-700">Detail</Text>
                        </HStack>
                      </Pressable>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      )}

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        mode={checkoutMode}
        initialBooking={selectedBooking}
        services={data.services}
        clients={data.clients}
        onPay={handlePay}
        processing={processingPayment}
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        clients={data.clients}
        company={data.companyDetails}
      />
    </ScrollView>
  );
}
