import { ScrollView } from "react-native";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, CreditCard, Pencil, Phone } from "lucide-react-native";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type ClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

type BookingRow = {
  id: string;
  date: string;
  time_from: string;
  time_to: string;
  invoice_id: string | null;
  services?: { name: string } | null;
  staff?: { first_name: string | null; last_name: string | null } | null;
};

type InvoiceRow = {
  id: string;
  amount: number;
  payment_method: "cash" | "card";
  created_at: string;
};

type TabKey = "info" | "bookings" | "payments";

function TabButton(props: { label: string; active: boolean; onPress: () => void }) {
  const { label, active, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center py-2 rounded-lg ${active ? "bg-black" : "bg-transparent"}`}
    >
      <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}>{label}</Text>
    </Pressable>
  );
}

export default function ClientDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: company } = useCompany();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  const [tab, setTab] = useState<TabKey>("info");

  const enabled = !!company?.id && !!clientId;

  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ["client", company?.id, clientId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, phone, email")
        .eq("company_id", company!.id)
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data as ClientRow;
    },
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ["clientBookings", company?.id, clientId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, date, time_from, time_to, invoice_id, services(name), staff(first_name, last_name)")
        .eq("company_id", company!.id)
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .order("time_from", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as BookingRow[];
    },
  });

  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["clientInvoices", company?.id, clientId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount, payment_method, created_at")
        .eq("company_id", company!.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []).map((row: any) => {
        return {
          id: row.id,
          amount: Number(row.amount ?? 0),
          payment_method: row.payment_method,
          created_at: row.created_at,
        } satisfies InvoiceRow;
      });
    },
  });

  const headerTitle = useMemo(() => {
    if (!client) return "Klient";
    return `${client.last_name} ${client.first_name}`;
  }, [client]);

  const totalPaid = useMemo(() => {
    return (invoices ?? []).reduce((sum, inv) => sum + Number(inv.amount ?? 0), 0);
  }, [invoices]);

  const isLoading = isClientLoading || isBookingsLoading || isInvoicesLoading;

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerTitle: "Klient" }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable
              onPress={() => {
                // In Tabs, back navigation can sometimes jump to the default tab.
                // Prefer deterministic navigation back to the clients list.
                router.replace("/(protected)/clients");
              }}
              className="p-2 -ml-2"
            >
              <ChevronLeft size={22} color="#111827" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {headerTitle}
            </Text>
          </HStack>

          <HStack className="items-center">
            <Pressable
              onPress={() => router.push({ pathname: "/(protected)/clients/edit", params: { clientId } })}
              className="p-2"
              hitSlop={8}
            >
              <Pencil size={18} color="#111827" />
            </Pressable>

            {client?.phone ? (
              <Pressable
                onPress={() => Linking.openURL(`tel:${client.phone}`)}
                className="p-2"
                hitSlop={8}
              >
                <Phone size={18} color="#111827" />
              </Pressable>
            ) : null}
          </HStack>
        </HStack>

        <HStack className="mt-3 bg-gray-100 rounded-lg p-1">
          <TabButton label="Info" active={tab === "info"} onPress={() => setTab("info")} />
          <TabButton label="Booking" active={tab === "bookings"} onPress={() => setTab("bookings")} />
          <TabButton label="Platby" active={tab === "payments"} onPress={() => setTab("payments")} />
        </HStack>
      </Box>

      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : !client ? (
        <Box className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-600 text-center">Klient nebol nájdený.</Text>
        </Box>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          {tab === "info" ? (
            <VStack className="gap-3">
              <Box className="bg-white rounded-lg border border-gray-100 p-4">
                <Text className="text-sm text-gray-500">Meno</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {client.last_name} {client.first_name}
                </Text>
              </Box>

              <Box className="bg-white rounded-lg border border-gray-100 p-4">
                <Text className="text-sm text-gray-500">Kontakt</Text>
                {client.phone ? (
                  <HStack className="items-center justify-between mt-1">
                    <Text className="text-gray-900">{client.phone}</Text>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${client.phone}`)}
                      className="flex-row items-center"
                      hitSlop={8}
                    >
                      <Phone size={16} color="#111827" />
                      <Text className="ml-2 text-gray-900 font-semibold">Zavolať</Text>
                    </Pressable>
                  </HStack>
                ) : (
                  <Text className="text-gray-600 mt-1">—</Text>
                )}

                <Text className="text-sm text-gray-500 mt-3">Email</Text>
                <Text className="text-gray-900 mt-1">{client.email ?? "—"}</Text>
              </Box>

              <Box className="bg-white rounded-lg border border-gray-100 p-4">
                <Text className="text-sm text-gray-500">Prehľad</Text>
                <HStack className="mt-2 justify-between">
                  <VStack>
                    <Text className="text-gray-600 text-sm">Bookingov</Text>
                    <Text className="text-gray-900 font-semibold">{bookings?.length ?? 0}</Text>
                  </VStack>
                  <VStack className="items-end">
                    <Text className="text-gray-600 text-sm">Zaplatené</Text>
                    <Text className="text-gray-900 font-semibold">{totalPaid.toFixed(2)} €</Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          ) : null}

          {tab === "bookings" ? (
            <VStack className="gap-2">
              {(bookings ?? []).length === 0 ? (
                <Text className="text-center text-gray-500 mt-6">Žiadne bookingy</Text>
              ) : (
                (bookings ?? []).map((booking) => {
                  const dateLabel = format(new Date(booking.date), "d. MMM yyyy", { locale: sk });
                  const timeLabel = `${booking.time_from?.slice(0, 5)} – ${booking.time_to?.slice(0, 5)}`;
                  const paid = !!booking.invoice_id;

                  const services = Array.isArray((booking as any).services)
                    ? (booking as any).services[0]
                    : (booking as any).services;

                  const staff = Array.isArray((booking as any).staff)
                    ? (booking as any).staff[0]
                    : (booking as any).staff;

                  const staffName = staff
                    ? `${staff.first_name ?? ""} ${staff.last_name ?? ""}`.trim()
                    : "";

                  const serviceName = services?.name ?? "";

                  return (
                    <Box key={booking.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                      <HStack className="items-center justify-between">
                        <VStack className="flex-1">
                          <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                            {dateLabel} · {timeLabel}
                          </Text>
                          <Text className="text-gray-500 text-sm" numberOfLines={1}>
                            {(serviceName + (staffName ? ` · ${staffName}` : "")).trim()}
                          </Text>
                        </VStack>
                        <Text className={`text-sm font-semibold ${paid ? "text-green-600" : "text-amber-600"}`}>
                          {paid ? "Zaplatené" : "Nezaplatené"}
                        </Text>
                      </HStack>
                    </Box>
                  );
                })
              )}
            </VStack>
          ) : null}

          {tab === "payments" ? (
            <VStack className="gap-2">
              {(invoices ?? []).length === 0 ? (
                <Text className="text-center text-gray-500 mt-6">Žiadne platby</Text>
              ) : (
                (invoices ?? []).map((invoice) => {
                  const dateLabel = format(new Date(invoice.created_at), "d. MMM yyyy, HH:mm", { locale: sk });
                  const methodLabel = invoice.payment_method === "cash" ? "Hotovosť" : "Karta";
                  return (
                    <Box key={invoice.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                      <HStack className="items-center justify-between">
                        <VStack>
                          <Text className="text-gray-900 font-semibold">{invoice.amount.toFixed(2)} €</Text>
                          <Text className="text-gray-500 text-sm">{dateLabel}</Text>
                        </VStack>
                        <HStack className="items-center gap-2">
                          <CreditCard size={16} color="#111827" />
                          <Text className="text-gray-700 font-semibold">{methodLabel}</Text>
                        </HStack>
                      </HStack>
                    </Box>
                  );
                })
              )}
            </VStack>
          ) : null}
        </ScrollView>
      )}
    </Box>
  );
}
