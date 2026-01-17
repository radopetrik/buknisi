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
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { fetchServices, fetchStaffServiceIds, saveStaffServices } from "@/lib/staff";

export default function StaffServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();
  const { staffId } = useLocalSearchParams<{ staffId: string }>();

  const enabled = !!company?.id && !!staffId;

  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ["services", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchServices(company!.id),
  });

  const { data: initialStaffServiceIds, isLoading: isStaffServicesLoading } = useQuery({
    queryKey: ["staffServices", staffId],
    enabled: !!staffId,
    queryFn: () => fetchStaffServiceIds(staffId!),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (!initialStaffServiceIds) return;
    setSelectedIds(initialStaffServiceIds);
    setHydrated(true);
  }, [hydrated, initialStaffServiceIds]);

  const hasChanges = useMemo(() => {
    const initial = initialStaffServiceIds ?? [];
    if (selectedIds.length !== initial.length) return true;
    const set = new Set(initial);
    return selectedIds.some((id) => !set.has(id));
  }, [initialStaffServiceIds, selectedIds]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSave = enabled && hasChanges && !saving;

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Služby" onPress={() => router.back()} />
        </HStack>
      </Box>

      {isServicesLoading || isStaffServicesLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          <VStack className="gap-4">
            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-base font-semibold text-gray-900">Vyberte priradené služby</Text>
              <Text className="text-sm text-gray-500 mt-1">Zamestnanec sa bude ponúkať len pre tieto služby.</Text>

              {(services ?? []).length === 0 ? (
                <Box className="py-6">
                  <Text className="text-gray-600">Najprv pridajte služby v Nastaveniach.</Text>
                </Box>
              ) : (
                <VStack className="gap-2 mt-4">
                  {(services ?? []).map((service) => {
                    const selected = selectedIds.includes(service.id);
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
                if (!staffId || !company?.id) return;

                setSaving(true);
                setErrorMessage(null);

                try {
                  await saveStaffServices(staffId, Array.from(new Set(selectedIds)));

                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["staff", company.id] }),
                    queryClient.invalidateQueries({ queryKey: ["staffList", company.id] }),
                    queryClient.invalidateQueries({ queryKey: ["staffServices", staffId] }),
                  ]);

                  router.back();
                } catch (err: any) {
                  setErrorMessage(err?.message ?? "Nepodarilo sa uložiť služby.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? <ButtonSpinner /> : null}
              <ButtonText>{saving ? "Ukladám..." : "Uložiť"}</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
