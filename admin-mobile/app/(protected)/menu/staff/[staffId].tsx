import type { ReactNode } from "react";
import { Alert, ScrollView } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Clock, Users, Trash2 } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCompany } from "@/hooks/useCompany";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import { deleteStaff, fetchStaffDetail, staffRoleLabel } from "@/lib/staff";

export default function StaffDetailScreen() {
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

  const handleDelete = () => {
    if (!company?.id || !staffId) return;

    Alert.alert(
      "Odstrániť zamestnanca",
      "Naozaj chcete odstrániť tohto zamestnanca?",
      [
        { text: "Zrušiť", style: "cancel" },
        {
          text: "Odstrániť",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteStaff(company.id, staffId);
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["staff", company.id] }),
                queryClient.invalidateQueries({ queryKey: ["staffList", company.id] }),
              ]);
              router.replace("/(protected)/menu/staff");
            } catch (err: any) {
              Alert.alert("Chyba", err?.message ?? "Nepodarilo sa odstrániť zamestnanca.");
            }
          },
        },
      ]
    );
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Detail" onPress={() => router.back()} />

          <HStack className="items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              action="secondary"
              onPress={() => router.push(`/(protected)/menu/staff/edit?staffId=${staffId}`)}
            >
              <ButtonText>Upraviť</ButtonText>
            </Button>
            <Pressable onPress={handleDelete} className="p-2" hitSlop={8}>
              <Trash2 size={20} color="#ef4444" />
            </Pressable>
          </HStack>
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
            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-lg font-semibold text-gray-900">{staff.full_name}</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {staff.position ?? staffRoleLabel(staff.role)}
              </Text>

              <Box className="mt-3">
                <Text className="text-sm text-gray-700">
                  {staff.available_for_booking ? "Viditeľný v rezerváciách" : "Skrytý z rezervácií"}
                </Text>
              </Box>

              {staff.description ? (
                <Text className="text-sm text-gray-600 mt-3">{staff.description}</Text>
              ) : null}

              <Box className="mt-4">
                <Text className="text-sm text-gray-600">Email: {staff.email ?? "—"}</Text>
                <Text className="text-sm text-gray-600 mt-1">Telefón: {staff.phone ?? "—"}</Text>
              </Box>
            </Box>

            <Box className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <ActionRow
                icon={<Users size={18} color="#111827" />}
                title="Služby"
                subtitle="Priradiť služby zamestnancovi"
                onPress={() => router.push(`/(protected)/menu/staff/services?staffId=${staff.id}`)}
              />
              <ActionRow
                icon={<Clock size={18} color="#111827" />}
                title="Pracovná doba"
                subtitle="Nastaviť pracovné hodiny"
                onPress={() => router.push(`/(protected)/menu/staff/hours?staffId=${staff.id}`)}
              />
              <ActionRow
                icon={<Calendar size={18} color="#111827" />}
                title="Voľno"
                subtitle="Dovolenky, PN, školenia"
                onPress={() => router.push(`/(protected)/menu/staff/timeoff?staffId=${staff.id}`)}
              />
            </Box>
          </VStack>
        </ScrollView>
      )}
    </Box>
  );
}

function ActionRow(props: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={props.onPress} className="px-4 py-4 border-b border-gray-100">
      <HStack className="items-center gap-3">
        <Box className="w-8 items-center">{props.icon}</Box>
        <Box className="flex-1">
          <Text className="text-base font-medium text-gray-900">{props.title}</Text>
          <Text className="text-sm text-gray-500">{props.subtitle}</Text>
        </Box>
      </HStack>
    </Pressable>
  );
}
