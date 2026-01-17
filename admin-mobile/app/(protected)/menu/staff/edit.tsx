import { ScrollView } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCompany } from "@/hooks/useCompany";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { fetchStaffDetail, staffRoleLabel, staffRoles, updateStaff, type StaffRole } from "@/lib/staff";

export default function EditStaffScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();
  const { staffId } = useLocalSearchParams<{ staffId: string }>();

  const enabled = !!company?.id && !!staffId;

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staffDetail", company?.id, staffId],
    enabled,
    queryFn: () => fetchStaffDetail(company!.id, staffId!),
  });

  const [hydrated, setHydrated] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("staffer");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [availableForBooking, setAvailableForBooking] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!staff || hydrated) return;

    setFullName(staff.full_name ?? "");
    setRole(staff.role);
    setPosition(staff.position ?? "");
    setEmail(staff.email ?? "");
    setPhone(staff.phone ?? "");
    setDescription(staff.description ?? "");
    setAvailableForBooking(staff.available_for_booking);

    setHydrated(true);
  }, [hydrated, staff]);

  const canSave = useMemo(() => {
    return !!company?.id && !!staffId && fullName.trim().length > 0 && hydrated && !saving;
  }, [company?.id, fullName, hydrated, saving, staffId]);

  const goBack = () => {
    if (!staffId) {
      router.replace("/(protected)/menu/staff");
      return;
    }
    router.replace(`/(protected)/menu/staff/${staffId}`);
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Upraviť profil" onPress={goBack} />
        </HStack>
      </Box>

      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : !staff ? (
        <Box className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-600 text-center">Zamestnanec nebol nájdený.</Text>
        </Box>
      ) : (
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
                <InputField
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+421 900 000 000"
                  keyboardType="phone-pad"
                />
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

            {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

            <Button
              className="w-full"
              disabled={!canSave}
              onPress={async () => {
                if (!company?.id || !staffId) return;

                setSaving(true);
                setErrorMessage(null);

                try {
                  await updateStaff({
                    companyId: company.id,
                    staffId,
                    patch: {
                      full_name: fullName.trim(),
                      role,
                      position: position.trim() ? position.trim() : null,
                      email: email.trim() ? email.trim().toLowerCase() : null,
                      phone: phone.trim() ? phone.trim() : null,
                      available_for_booking: availableForBooking,
                      description: description.trim() ? description.trim() : null,
                    },
                  });

                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["staff", company.id] }),
                    queryClient.invalidateQueries({ queryKey: ["staffList", company.id] }),
                    queryClient.invalidateQueries({ queryKey: ["staffDetail", company.id, staffId] }),
                  ]);

                  goBack();
                } catch (err: any) {
                  setErrorMessage(err?.message ?? "Nepodarilo sa uložiť zmeny.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? <ButtonSpinner /> : null}
              <ButtonText>{saving ? "Ukladám..." : "Uložiť"}</ButtonText>
            </Button>

            <Button variant="outline" action="secondary" className="w-full" onPress={goBack}>
              <ButtonText>Zrušiť</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
