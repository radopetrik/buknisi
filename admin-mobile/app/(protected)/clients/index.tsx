import { FlatList, RefreshControl, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Stack, useRouter } from "expo-router";
import { Phone, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";

type ClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

function foldForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ClientsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: company } = useCompany();
  const [search, setSearch] = useState("");

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, phone, email")
        .eq("company_id", company!.id)
        .order("last_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ClientRow[];
    },
  });

  const filteredClients = useMemo(() => {
    const query = foldForSearch(search.trim());
    if (!query) return clients ?? [];

    return (clients ?? []).filter((client) => {
      const firstName = foldForSearch(client.first_name);
      const lastName = foldForSearch(client.last_name);

      return (
        lastName.includes(query) ||
        firstName.includes(query) ||
        (client.phone ?? "").includes(search.trim())
      );
    });
  }, [clients, search]);

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerTitle: "Klienti" }} />

      <Box className="px-4 pb-3 pt-3 bg-white border-b border-gray-200">
        <Input className="bg-gray-100 rounded-lg h-10 border-0">
          <InputSlot className="pl-3">
            <InputIcon as={Search} size={20} color="#9ca3af" />
          </InputSlot>
          <InputField
            className="text-base ml-2"
            placeholder="Hľadať klientov..."
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
          data={filteredClients}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(protected)/clients/${item.id}`)}
              className="bg-white px-3 py-3 rounded-lg mb-2 border border-gray-100"
            >
              <HStack className="items-center justify-between gap-3">
                <Text className="text-base font-medium text-gray-900 flex-1" numberOfLines={1}>
                  {item.last_name} {item.first_name}
                </Text>

                {item.phone ? (
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      Linking.openURL(`tel:${item.phone}`);
                    }}
                    className="flex-row items-center"
                    hitSlop={8}
                  >
                    <Phone size={14} color="#6b7280" />
                    <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
                  </Pressable>
                ) : (
                  <View />
                )}
              </HStack>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">Žiadni klienti</Text>
          }
        />
      )}
    </Box>
  );
}
