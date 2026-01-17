import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
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

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const dayOptions: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Pondelok" },
  { value: "tuesday", label: "Utorok" },
  { value: "wednesday", label: "Streda" },
  { value: "thursday", label: "Štvrtok" },
  { value: "friday", label: "Piatok" },
  { value: "saturday", label: "Sobota" },
  { value: "sunday", label: "Nedeľa" },
];

type BusinessHourRow = {
  id: string;
  day_in_week: DayOfWeek;
  from_time: string;
  to_time: string;
  break_from_time: string | null;
  break_to_time: string | null;
};

type DayState = {
  enabled: boolean;
  from: string;
  to: string;
  breakFrom: string;
  breakTo: string;
};

function normalizeTime(value: string) {
  return value.trim();
}

function toSupabaseTime(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const base = trimmed.includes(":") ? trimmed : `${trimmed}:00`;
  return `${base}:00`.slice(0, 8);
}

function prepareInitialDayState(businessHours: BusinessHourRow[]): Record<DayOfWeek, DayState> {
  const base: Record<DayOfWeek, DayState> = {
    monday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    tuesday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    wednesday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    thursday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    friday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    saturday: { enabled: false, from: "09:00", to: "13:00", breakFrom: "", breakTo: "" },
    sunday: { enabled: false, from: "09:00", to: "13:00", breakFrom: "", breakTo: "" },
  };

  for (const row of businessHours) {
    base[row.day_in_week] = {
      enabled: true,
      from: row.from_time?.slice(0, 5) ?? base[row.day_in_week].from,
      to: row.to_time?.slice(0, 5) ?? base[row.day_in_week].to,
      breakFrom: row.break_from_time?.slice(0, 5) ?? "",
      breakTo: row.break_to_time?.slice(0, 5) ?? "",
    };
  }

  return base;
}

export default function OnboardingHoursScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ companyId?: string }>();
  const { data: companyFromHook } = useCompany();

  const companyId = typeof params.companyId === "string" ? params.companyId : companyFromHook?.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["onboardingHours", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const result = await supabase
        .from("company_business_hours")
        .select("id, day_in_week, from_time, to_time, break_from_time, break_to_time")
        .eq("company_id", companyId!);

      if (result.error) throw result.error;
      return (result.data ?? []) as BusinessHourRow[];
    },
  });

  const [hoursState, setHoursState] = useState<Record<DayOfWeek, DayState>>(() => prepareInitialDayState([]));
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data || hydrated) return;
    setHoursState(prepareInitialDayState(data));
    setHydrated(true);
  }, [data, hydrated]);

  const updateDayState = (day: DayOfWeek, updater: (prev: DayState) => DayState) => {
    setHoursState((prev) => ({
      ...prev,
      [day]: updater(prev[day]),
    }));
  };

  const handleSave = async (): Promise<boolean> => {
    if (!companyId) return false;

    setSaving(true);
    setErrorMessage(null);

    try {
      const enabledDays = dayOptions
        .map((day) => ({ day: day.value, state: hoursState[day.value] }))
        .filter((row) => row.state.enabled);

      const payload = enabledDays.map(({ day, state }) => {
        const from = normalizeTime(state.from);
        const to = normalizeTime(state.to);
        if (!from || !to) {
          throw new Error("Vyplňte čas Od/Do pre všetky zapnuté dni.");
        }
        if (from >= to) {
          throw new Error("Skontrolujte čas Od/Do – začiatok musí byť skôr ako koniec.");
        }

        const breakFrom = normalizeTime(state.breakFrom);
        const breakTo = normalizeTime(state.breakTo);

        if ((breakFrom && !breakTo) || (!breakFrom && breakTo)) {
          throw new Error("Vyplňte prestávku Od aj Do (alebo nechajte obe prázdne).");
        }
        if (breakFrom && breakTo) {
          if (breakFrom >= breakTo) throw new Error("Prestávka musí mať správne poradie.");
          if (breakFrom <= from || breakTo >= to) {
            throw new Error("Prestávka musí byť medzi otváracími hodinami.");
          }
        }

        return {
          company_id: companyId,
          day_in_week: day,
          from_time: toSupabaseTime(from)!,
          to_time: toSupabaseTime(to)!,
          break_from_time: breakFrom ? toSupabaseTime(breakFrom) : null,
          break_to_time: breakTo ? toSupabaseTime(breakTo) : null,
        };
      });

      const disabledDays = dayOptions.map((d) => d.value).filter((d) => !hoursState[d].enabled);

      if (payload.length > 0) {
        const upsertResult = await supabase.from("company_business_hours").upsert(payload, { onConflict: "company_id,day_in_week" });
        if (upsertResult.error) throw upsertResult.error;
      }

      if (disabledDays.length > 0) {
        const deleteResult = await supabase
          .from("company_business_hours")
          .delete()
          .eq("company_id", companyId)
          .in("day_in_week", disabledDays);
        if (deleteResult.error) throw deleteResult.error;
      }

      Alert.alert("Uložené", "Otváracie hodiny uložené.");
      return true;
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa uložiť otváracie hodiny.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    router.push({ pathname: "/(protected)/onboarding/photos", params: { companyId } });
  };

  const handleSaveAndNext = async () => {
    const ok = await handleSave();
    if (ok) goNext();
  };

  if (!companyId || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Stack.Screen options={{ headerShown: false }} />
        <Spinner size="large" color="black" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-gray-700 text-center">{(error as any)?.message ?? "Chyba načítania"}</Text>
        <Button className="mt-4" onPress={() => refetch()}>
          <ButtonText>Skúsiť znovu</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton
            label="Späť"
            onPress={() => router.replace({ pathname: "/(protected)/onboarding/basic", params: { companyId } })}
          />
          <Text className="text-base font-semibold text-gray-900">Otváracie hodiny (2/3)</Text>
          <Pressable onPress={goNext} className="px-3 py-2">
            <Text className="text-gray-600">Preskočiť</Text>
          </Pressable>
        </HStack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <VStack className="gap-4">
          <Text className="text-sm text-gray-600">Zapnite dni a nastavte čas v tvare HH:MM (napr. 09:00).</Text>

          {dayOptions.map((day) => {
            const state = hoursState[day.value];
            return (
              <Box key={day.value} className="bg-white rounded-xl border border-gray-100 p-4">
                <HStack className="items-center justify-between">
                  <Text className="text-base font-semibold text-gray-900">{day.label}</Text>
                  <Pressable
                    onPress={() => updateDayState(day.value, (prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className={state.enabled ? "px-3 py-2 rounded bg-emerald-600" : "px-3 py-2 rounded bg-gray-200"}
                  >
                    <Text className={state.enabled ? "text-white" : "text-gray-800"}>{state.enabled ? "Zapnuté" : "Vypnuté"}</Text>
                  </Pressable>
                </HStack>

                {state.enabled ? (
                  <VStack className="gap-3 mt-4">
                    <HStack className="gap-3">
                      <Box className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Od</Text>
                        <Input className="bg-white">
                          <InputField
                            value={state.from}
                            onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, from: value }))}
                            placeholder="09:00"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </Input>
                      </Box>
                      <Box className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Do</Text>
                        <Input className="bg-white">
                          <InputField
                            value={state.to}
                            onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, to: value }))}
                            placeholder="17:00"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </Input>
                      </Box>
                    </HStack>

                    <HStack className="gap-3">
                      <Box className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Prestávka od (voliteľné)</Text>
                        <Input className="bg-white">
                          <InputField
                            value={state.breakFrom}
                            onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, breakFrom: value }))}
                            placeholder="12:00"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </Input>
                      </Box>
                      <Box className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Prestávka do</Text>
                        <Input className="bg-white">
                          <InputField
                            value={state.breakTo}
                            onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, breakTo: value }))}
                            placeholder="12:30"
                            autoCapitalize="none"
                            autoCorrect={false}
                          />
                        </Input>
                      </Box>
                    </HStack>
                  </VStack>
                ) : null}
              </Box>
            );
          })}

          {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

          <Button className="w-full" isDisabled={saving} onPress={handleSaveAndNext}>
            {saving ? <ButtonSpinner /> : null}
            <ButtonText>{saving ? "Ukladám..." : "Uložiť a pokračovať"}</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </View>
  );
}
