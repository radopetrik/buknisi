import { FlatList, RefreshControl } from "react-native";
import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import { useCompany } from "@/hooks/useCompany";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

import { fetchStaffList, staffRoleLabel, type StaffRow } from "@/lib/staff";

function foldForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function StaffListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: company } = useCompany();
  const [search, setSearch] = useState("");

  const { data: staff, isLoading, refetch } = useQuery({
    queryKey: ["staffList", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchStaffList(company!.id),
  });

  const filteredStaff = useMemo(() => {
    const query = foldForSearch(search.trim());
    if (!query) return staff ?? [];

    return (staff ?? []).filter((row) => {
      const fullName = foldForSearch(row.full_name);
      const position = foldForSearch(row.position ?? "");
      return fullName.includes(query) || position.includes(query);
    });
  }, [search, staff]);

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Zamestnanci" onPress={() => router.back()} />
          <Button size="sm" onPress={() => router.push("/(protected)/menu/staff/new")}> 
            <ButtonText>Nový</ButtonText>
          </Button>
        </HStack>
      </Box>

      <Box className="px-4 pb-3 pt-3 bg-white border-b border-gray-200">
        <Input className="bg-gray-100 rounded-lg h-10 border-0">
          <InputSlot className="pl-3">
            <InputIcon as={Search} size={20} color="#9ca3af" />
          </InputSlot>
          <InputField
            className="text-base ml-2"
            placeholder="Hľadať..."
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </Input>
      </Box>

      {isLoading ? (
        <Box className="flex-1 justify-center items-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : (
        <FlatList
          data={filteredStaff}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          ListEmptyComponent={() => (
            <Box className="items-center justify-center py-10">
              <Text className="text-gray-600">Zatiaľ nemáte žiadnych zamestnancov.</Text>
            </Box>
          )}
          renderItem={({ item }) => (
            <StaffRowItem
              row={item}
              onPress={() => router.push(`/(protected)/menu/staff/${item.id}`)}
            />
          )}
        />
      )}
    </Box>
  );
}

function StaffRowItem({ row, onPress }: { row: StaffRow; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="bg-white px-3 py-3 rounded-lg mb-2 border border-gray-100">
      <HStack className="items-center justify-between gap-3">
        <Box className="flex-1">
          <Text className="text-base font-medium text-gray-900" numberOfLines={1}>
            {row.full_name}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {row.position ?? staffRoleLabel(row.role)}
          </Text>
        </Box>
        <Box
          className={
            row.available_for_booking
              ? "bg-emerald-50 border border-emerald-200 px-2 py-1 rounded"
              : "bg-amber-50 border border-amber-200 px-2 py-1 rounded"
          }
        >
          <Text className={row.available_for_booking ? "text-emerald-700 text-xs" : "text-amber-700 text-xs"}>
            {row.available_for_booking ? "Viditeľný" : "Skrytý"}
          </Text>
        </Box>
      </HStack>
    </Pressable>
  );
}
