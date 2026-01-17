import { Alert, ScrollView } from "react-native";
import { useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
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

import {
  createStaffTimeOff,
  deleteStaffTimeOff,
  fetchStaffTimeOffs,
  timeOffReasonLabel,
  timeOffReasons,
  type TimeOffReason,
} from "@/lib/staff";

export default function StaffTimeOffScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();
  const { staffId } = useLocalSearchParams<{ staffId: string }>();

  const { data: timeOffs, isLoading } = useQuery({
    queryKey: ["staffTimeOffs", staffId],
    enabled: !!staffId,
    queryFn: () => fetchStaffTimeOffs(staffId!),
  });

  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [reason, setReason] = useState<TimeOffReason>("vacation");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canAdd = useMemo(() => {
    if (!staffId) return false;
    if (!date.trim()) return false;
    if (saving) return false;
    if (!allDay && (!fromTime.trim() || !toTime.trim())) return false;
    return true;
  }, [allDay, date, fromTime, saving, staffId, toTime]);

  const handleAdd = async () => {
    if (!staffId) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      await createStaffTimeOff({
        staff_id: staffId,
        all_day: allDay,
        day: date.trim(),
        from_time: allDay ? null : fromTime.trim(),
        to_time: allDay ? null : toTime.trim(),
        reason,
      });

      setDate("");
      setAllDay(true);
      setFromTime("");
      setToTime("");
      setReason("vacation");

      await queryClient.invalidateQueries({ queryKey: ["staffTimeOffs", staffId] });
      if (company?.id) {
        await queryClient.invalidateQueries({ queryKey: ["staff", company.id] });
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa pridať voľno.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Odstrániť", "Naozaj chcete odstrániť tento záznam voľna?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStaffTimeOff(id);
            await queryClient.invalidateQueries({ queryKey: ["staffTimeOffs", staffId] });
          } catch (err: any) {
            Alert.alert("Chyba", err?.message ?? "Nepodarilo sa odstrániť záznam.");
          }
        },
      },
    ]);
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Voľno" onPress={() => router.back()} />
        </HStack>
      </Box>

      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          <VStack className="gap-4">
            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-base font-semibold text-gray-900">Pridať nové voľno</Text>

              <VStack className="gap-3 mt-4">
                <Box>
                  <Text className="text-sm text-gray-600 mb-1">Dátum (YYYY-MM-DD)</Text>
                  <Input className="bg-white">
                    <InputField value={date} onChangeText={setDate} placeholder="2026-01-17" autoCapitalize="none" />
                  </Input>
                </Box>

                <Box>
                  <Text className="text-sm text-gray-600 mb-2">Dôvod</Text>
                  <Box className="flex-row flex-wrap gap-2">
                    {timeOffReasons.map((r) => {
                      const selected = r === reason;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => setReason(r)}
                          className={
                            selected
                              ? "px-3 py-2 rounded border border-gray-900 bg-gray-900"
                              : "px-3 py-2 rounded border border-gray-200 bg-white"
                          }
                        >
                          <Text className={selected ? "text-white text-sm" : "text-gray-800 text-sm"}>
                            {timeOffReasonLabel(r)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Box>
                </Box>

                <Box>
                  <Text className="text-sm text-gray-600 mb-2">Rozsah</Text>
                  <Box className="flex-row gap-2">
                    <Pressable
                      onPress={() => setAllDay(true)}
                      className={
                        allDay
                          ? "flex-1 px-3 py-3 rounded border border-gray-900 bg-gray-900"
                          : "flex-1 px-3 py-3 rounded border border-gray-200 bg-white"
                      }
                    >
                      <Text className={allDay ? "text-white text-center" : "text-gray-800 text-center"}>
                        Celý deň
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setAllDay(false)}
                      className={
                        !allDay
                          ? "flex-1 px-3 py-3 rounded border border-gray-900 bg-gray-900"
                          : "flex-1 px-3 py-3 rounded border border-gray-200 bg-white"
                      }
                    >
                      <Text className={!allDay ? "text-white text-center" : "text-gray-800 text-center"}>
                        Čas
                      </Text>
                    </Pressable>
                  </Box>
                </Box>

                {!allDay ? (
                  <HStack className="gap-3">
                    <Box className="flex-1">
                      <Text className="text-xs text-gray-600 mb-1">Od</Text>
                      <Input className="bg-white">
                        <InputField value={fromTime} onChangeText={setFromTime} placeholder="09:00" autoCapitalize="none" />
                      </Input>
                    </Box>
                    <Box className="flex-1">
                      <Text className="text-xs text-gray-600 mb-1">Do</Text>
                      <Input className="bg-white">
                        <InputField value={toTime} onChangeText={setToTime} placeholder="13:00" autoCapitalize="none" />
                      </Input>
                    </Box>
                  </HStack>
                ) : null}

                {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

                <Button className="w-full" disabled={!canAdd} onPress={handleAdd}>
                  {saving ? <ButtonSpinner /> : null}
                  <ButtonText>{saving ? "Ukladám..." : "Pridať"}</ButtonText>
                </Button>
              </VStack>
            </Box>

            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-base font-semibold text-gray-900">História a plán</Text>

              {(timeOffs ?? []).length === 0 ? (
                <Box className="py-6">
                  <Text className="text-gray-600">Žiadne záznamy.</Text>
                </Box>
              ) : (
                <VStack className="gap-2 mt-4">
                  {(timeOffs ?? []).map((row) => (
                    <Box key={row.id} className="px-3 py-3 rounded border border-gray-100">
                      <HStack className="items-center justify-between">
                        <Box>
                          <Text className="text-gray-900 font-medium">
                            {row.day} • {timeOffReasonLabel(row.reason)}
                          </Text>
                          <Text className="text-gray-500 text-sm mt-1">
                            {row.all_day ? "Celý deň" : `${row.from_time?.slice(0, 5)} - ${row.to_time?.slice(0, 5)}`}
                          </Text>
                        </Box>
                        <Pressable onPress={() => handleDelete(row.id)} className="p-2" hitSlop={8}>
                          <Trash2 size={18} color="#6b7280" />
                        </Pressable>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}
