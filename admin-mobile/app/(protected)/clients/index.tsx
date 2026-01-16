import { FlatList, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Stack } from "expo-router";
import { Phone, Search } from "lucide-react-native";
import { useState } from "react";
import * as Linking from "expo-linking";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Spinner } from "@/components/ui/spinner";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";

export default function ClientsScreen() {
  const { data: company } = useCompany();
  const [search, setSearch] = useState("");

  const { data: clients, isLoading, refetch } = useQuery({
    queryKey: ["clients", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("company_id", company!.id)
        .order("last_name", { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredClients = clients?.filter(c => 
    c.last_name.toLowerCase().includes(search.toLowerCase()) || 
    c.first_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <Box className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerTitle: "Klienti" }} />
      
      <Box className="p-4 bg-white border-b border-gray-200">
        <Input className="bg-gray-100 rounded-lg h-10 border-0">
            <InputSlot className="pl-3">
                <InputIcon as={Search} size={20} color="#9ca3af"/>
            </InputSlot>
            <InputField 
                className="text-base ml-2" 
                placeholder="Search clients..." 
                value={search}
                onChangeText={setSearch}
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
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
                <Box className="bg-white p-4 rounded-lg mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
                    <Box>
                        <Text className="text-lg font-medium text-gray-900">{item.last_name} {item.first_name}</Text>
                        <HStack className="mt-1 gap-3">
                             {item.phone && (
                                <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)} className="flex-row items-center">
                                    <Phone size={14} color="#6b7280" />
                                    <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
                                </Pressable>
                             )}
                        </HStack>
                    </Box>
                </Box>
            )}
            ListEmptyComponent={
                <Text className="text-center text-gray-500 mt-10">No clients found</Text>
            }
        />
      )}
    </Box>
  );
}
