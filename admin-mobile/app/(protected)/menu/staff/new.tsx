import { Alert, ScrollView } from "react-native";
import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCompany } from "@/hooks/useCompany";

import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import {
  createStaff,
  fetchServices,
  saveStaffServices,
  staffRoleLabel,
  staffRoles,
  type StaffRole,
} from "@/lib/staff";

export default function NewStaffScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("staffer");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [availableForBooking, setAvailableForBooking] = useState(true);

  const [serviceIds, setServiceIds] = useState<string[]>([]);

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["services", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchServices(company!.id),
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return !!company?.id && fullName.trim().length > 0 && !saving;
  }, [company?.id, fullName, saving]);

  const toggleService = (id: string) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={22} color="#111827" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">Nový zamestnanec</Text>
          </HStack>
        </HStack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        <VStack className="gap-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Meno a priezvisko</Text>
            <Input className="bg-white">
              <InputField value={fullName} onChangeText={setFullName} placeholder="Napr. Jana Nováková" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-2">Rola</Text>
            <Box className="flex-row flex-wrap gap-2">
              {staffRoles.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  className={
                    r === role
                      ? "px-3 py-2 rounded border border-gray-900 bg-gray-900"
                      : "px-3 py-2 rounded border border-gray-200 bg-white"
                  }
                >
                  <Text className={r === role ? "text-white text-sm" : "text-gray-800 text-sm"}>
                    {staffRoleLabel(r)}
                  </Text>
                </Pressable>
              ))}
            </Box>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Pozícia (voliteľné)</Text>
            <Input className="bg-white">
              <InputField value={position} onChangeText={setPosition} placeholder="Napr. Senior stylist" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Email (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Telefón (voliteľné)</Text>
            <Input className="bg-white">
              <InputField value={phone} onChangeText={setPhone} placeholder="+421 900 000 000" keyboardType="phone-pad" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-2">Viditeľnosť v rezerváciách</Text>
            <Box className="flex-row gap-2">
              <Pressable
                onPress={() => setAvailableForBooking(true)}
                className={
                  availableForBooking
                    ? "flex-1 px-3 py-3 rounded border border-emerald-600 bg-emerald-600"
                    : "flex-1 px-3 py-3 rounded border border-gray-200 bg-white"
                }
              >
                <Text className={availableForBooking ? "text-white text-center" : "text-gray-800 text-center"}>
                  Viditeľný
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAvailableForBooking(false)}
                className={
                  !availableForBooking
                    ? "flex-1 px-3 py-3 rounded border border-amber-600 bg-amber-600"
                    : "flex-1 px-3 py-3 rounded border border-gray-200 bg-white"
                }
              >
                <Text className={!availableForBooking ? "text-white text-center" : "text-gray-800 text-center"}>
                  Skrytý
                </Text>
              </Pressable>
            </Box>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Popis (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={description}
                onChangeText={setDescription}
                placeholder="Krátky bio alebo špecializácia"
                multiline
                className="min-h-[96px]"
              />
            </Input>
          </Box>

          <Box className="bg-white rounded-xl border border-gray-100 p-4">
            <Text className="text-base font-semibold text-gray-900">Priradiť služby</Text>
            <Text className="text-sm text-gray-500 mt-1">Vyberte služby, ktoré zamestnanec vykonáva.</Text>

            {isServicesLoading ? (
              <Box className="py-6 items-center">
                <Spinner size="large" color="black" />
              </Box>
            ) : (services ?? []).length === 0 ? (
              <Box className="py-6">
                <Text className="text-gray-600">Najprv pridajte služby v Nastaveniach.</Text>
              </Box>
            ) : (
              <VStack className="gap-2 mt-4">
                {(services ?? []).map((service) => {
                  const selected = serviceIds.includes(service.id);
                  return (
                    <Pressable
                      key={service.id}
                      onPress={() => toggleService(service.id)}
                      className={
                        selected
                          ? "px-3 py-3 rounded border border-gray-900 bg-gray-900"
                          : "px-3 py-3 rounded border border-gray-200 bg-white"
                      }
                    >
                      <HStack className="items-center justify-between">
                        <Text className={selected ? "text-white" : "text-gray-900"}>{service.name}</Text>
                        <Text className={selected ? "text-white/80 text-sm" : "text-gray-500 text-sm"}>
                          {service.duration}m
                        </Text>
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>
            )}
          </Box>

          {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

          <Button
            className="w-full"
            disabled={!canSave}
            onPress={async () => {
              if (!company?.id) return;

              setSaving(true);
              setErrorMessage(null);

              try {
                const created = await createStaff({
                  company_id: company.id,
                  full_name: fullName.trim(),
                  role,
                  position: position.trim() ? position.trim() : null,
                  email: email.trim() ? email.trim().toLowerCase() : null,
                  phone: phone.trim() ? phone.trim() : null,
                  available_for_booking: availableForBooking,
                  description: description.trim() ? description.trim() : null,
                });

                await saveStaffServices(created.id, Array.from(new Set(serviceIds)));

                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ["staff", company.id] }),
                  queryClient.invalidateQueries({ queryKey: ["staffList", company.id] }),
                ]);

                router.replace(`/(protected)/menu/staff/${created.id}`);
              } catch (err: any) {
                setErrorMessage(err?.message ?? "Nepodarilo sa uložiť zamestnanca.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <ButtonSpinner /> : null}
            <ButtonText>{saving ? "Ukladám..." : "Uložiť"}</ButtonText>
          </Button>

          <Button
            variant="outline"
            action="secondary"
            className="w-full"
            onPress={() => router.back()}
          >
            <ButtonText>Zrušiť</ButtonText>
          </Button>

          <Pressable
            onPress={() => {
              Alert.alert(
                "Tip",
                "Služby viete upraviť aj neskôr v detaile zamestnanca (Služby)."
              );
            }}
            className="py-2"
          >
            <Text className="text-center text-gray-500 text-sm">Ako fungujú služby?</Text>
          </Pressable>
        </VStack>
      </ScrollView>
    </Box>
  );
}
