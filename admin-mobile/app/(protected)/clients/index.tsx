import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Stack } from "expo-router";
import { ActivityIndicator } from "react-native";
import { Phone, Search } from "lucide-react-native";
import { useState } from "react";
import * as Linking from "expo-linking";

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
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: "Clients" }} />
      
      <View className="p-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 h-10">
            <Search size={20} color="#9ca3af" />
            <TextInput 
                className="flex-1 ml-2 text-base" 
                placeholder="Search clients..." 
                value={search}
                onChangeText={setSearch}
            />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="black" />
        </View>
      ) : (
        <FlatList
            data={filteredClients}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
                <View className="bg-white p-4 rounded-lg mb-3 border border-gray-100 shadow-sm flex-row justify-between items-center">
                    <View>
                        <Text className="text-lg font-medium text-gray-900">{item.last_name} {item.first_name}</Text>
                        <View className="flex-row mt-1 gap-3">
                             {item.phone && (
                                <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} className="flex-row items-center">
                                    <Phone size={14} color="#6b7280" />
                                    <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
                                </TouchableOpacity>
                             )}
                        </View>
                    </View>
                </View>
            )}
            ListEmptyComponent={
                <Text className="text-center text-gray-500 mt-10">No clients found</Text>
            }
        />
      )}
    </View>
  );
}
