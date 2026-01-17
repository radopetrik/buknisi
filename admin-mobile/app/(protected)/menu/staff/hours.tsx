import { ScrollView } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
  daysOfWeek,
  fetchStaffWorkingHours,
  saveStaffWorkingHours,
  type DayOfWeek,
} from "./_lib";

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

export default function StaffWorkingHoursScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();
  const { staffId } = useLocalSearchParams<{ staffId: string }>();

  const { data: hours, isLoading } = useQuery({
    queryKey: ["staffWorkingHours", staffId],
    enabled: !!staffId,
    queryFn: () => fetchStaffWorkingHours(staffId!),
  });

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<Record<DayOfWeek, DayState>>(() => {
    const init: any = {};
    for (const day of daysOfWeek) {
      init[day.value] = {
        enabled: false,
        from: "09:00",
        to: "17:00",
        breakFrom: "",
        breakTo: "",
      } satisfies DayState;
    }
    return init;
  });

  useEffect(() => {
    if (hydrated) return;
    if (!hours) return;

    setState((prev) => {
      const next = { ...prev };
      for (const day of daysOfWeek) {
        const row = hours.find((h) => h.day_in_week === day.value);
        next[day.value] = {
          enabled: !!row,
          from: row?.from_time?.slice(0, 5) ?? prev[day.value].from,
          to: row?.to_time?.slice(0, 5) ?? prev[day.value].to,
          breakFrom: row?.break_from_time?.slice(0, 5) ?? "",
          breakTo: row?.break_to_time?.slice(0, 5) ?? "",
        };
      }
      return next;
    });

    setHydrated(true);
  }, [hours, hydrated]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = !!staffId && hydrated && !saving;

  const enabledDays = useMemo(() => {
    return daysOfWeek
      .map((day) => ({ day: day.value, state: state[day.value] }))
      .filter((row) => row.state.enabled);
  }, [state]);

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={22} color="#111827" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">Pracovná doba</Text>
          </HStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          <VStack className="gap-3">
            <Text className="text-sm text-gray-600">
              Zapnite dni a nastavte čas v tvare HH:MM (napr. 09:00).
            </Text>

            {daysOfWeek.map((day) => {
              const dayState = state[day.value];
              return (
                <Box key={day.value} className="bg-white rounded-xl border border-gray-100 p-4">
                  <HStack className="items-center justify-between">
                    <Text className="text-base font-semibold text-gray-900">{day.label}</Text>
                    <Pressable
                      onPress={() =>
                        setState((prev) => ({
                          ...prev,
                          [day.value]: { ...prev[day.value], enabled: !prev[day.value].enabled },
                        }))
                      }
                      className={
                        dayState.enabled
                          ? "px-3 py-2 rounded bg-emerald-600"
                          : "px-3 py-2 rounded bg-gray-200"
                      }
                    >
                      <Text className={dayState.enabled ? "text-white" : "text-gray-800"}>
                        {dayState.enabled ? "Zapnuté" : "Vypnuté"}
                      </Text>
                    </Pressable>
                  </HStack>

                  {dayState.enabled ? (
                    <VStack className="gap-3 mt-4">
                      <HStack className="gap-3">
                        <Box className="flex-1">
                          <Text className="text-xs text-gray-600 mb-1">Od</Text>
                          <Input className="bg-white">
                            <InputField
                              value={dayState.from}
                              onChangeText={(value) =>
                                setState((prev) => ({
                                  ...prev,
                                  [day.value]: { ...prev[day.value], from: value },
                                }))
                              }
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
                              value={dayState.to}
                              onChangeText={(value) =>
                                setState((prev) => ({
                                  ...prev,
                                  [day.value]: { ...prev[day.value], to: value },
                                }))
                              }
                              placeholder="17:00"
                              autoCapitalize="none"
                              autoCorrect={false}
                            />
                          </Input>
                        </Box>
                      </HStack>

                      <HStack className="gap-3">
                        <Box className="flex-1">
                          <Text className="text-xs text-gray-600 mb-1">Pauza od (voliteľné)</Text>
                          <Input className="bg-white">
                            <InputField
                              value={dayState.breakFrom}
                              onChangeText={(value) =>
                                setState((prev) => ({
                                  ...prev,
                                  [day.value]: { ...prev[day.value], breakFrom: value },
                                }))
                              }
                              placeholder="12:00"
                              autoCapitalize="none"
                              autoCorrect={false}
                            />
                          </Input>
                        </Box>
                        <Box className="flex-1">
                          <Text className="text-xs text-gray-600 mb-1">Pauza do (voliteľné)</Text>
                          <Input className="bg-white">
                            <InputField
                              value={dayState.breakTo}
                              onChangeText={(value) =>
                                setState((prev) => ({
                                  ...prev,
                                  [day.value]: { ...prev[day.value], breakTo: value },
                                }))
                              }
                              placeholder="13:00"
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

            <Button
              className="w-full"
              disabled={!canSave}
              onPress={async () => {
                if (!staffId) return;

                setSaving(true);
                setErrorMessage(null);

                try {
                  const enabledPayload = enabledDays.map((row) => {
                    const from = normalizeTime(row.state.from);
                    const to = normalizeTime(row.state.to);
                    if (!from || !to) {
                      throw new Error("Vyplňte čas Od/Do pre všetky zapnuté dni.");
                    }

                    const breakFrom = normalizeTime(row.state.breakFrom);
                    const breakTo = normalizeTime(row.state.breakTo);

                    return {
                      day_in_week: row.day,
                      from_time: from,
                      to_time: to,
                      break_from_time: breakFrom || null,
                      break_to_time: breakTo || null,
                    };
                  });

                  const disabledDays = daysOfWeek
                    .map((d) => d.value)
                    .filter((d) => !state[d].enabled);

                  await saveStaffWorkingHours({
                    staffId,
                    enabledDays: enabledPayload,
                    disabledDays,
                  });

                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["staffWorkingHours", staffId] }),
                    company?.id
                      ? queryClient.invalidateQueries({ queryKey: ["staff", company.id] })
                      : Promise.resolve(),
                  ]);

                  router.back();
                } catch (err: any) {
                  setErrorMessage(err?.message ?? "Nepodarilo sa uložiť pracovnú dobu.");
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
