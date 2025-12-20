import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Stack } from "expo-router";
import { useState } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { sk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react-native";

export default function CalendarScreen() {
  const { data: company } = useCompany();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["bookings", company?.id, selectedDate.toISOString().split("T")[0]],
    enabled: !!company?.id,
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
            id, date, time_from, time_to,
            clients(first_name, last_name),
            booking_services(services(name, duration))
        `)
        .eq("company_id", company!.id)
        .eq("date", dateStr)
        .order("time_from", { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: "Calendar" }} />
      
      {/* Week Strip */}
      <View className="bg-white pb-4 pt-2 shadow-sm z-10">
        <View className="flex-row justify-between items-center px-4 mb-4">
            <TouchableOpacity onPress={() => setSelectedDate(d => subWeeks(d, 1))}>
                <ChevronLeft color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
                {format(selectedDate, "MMMM yyyy", { locale: sk })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(d => addWeeks(d, 1))}>
                <ChevronRight color="black" />
            </TouchableOpacity>
        </View>

        <View className="flex-row justify-around px-2">
            {weekDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                
                return (
                    <TouchableOpacity 
                        key={day.toISOString()} 
                        onPress={() => setSelectedDate(day)}
                        className={`items-center p-2 rounded-xl min-w-[45px] ${isSelected ? "bg-black" : "bg-transparent"}`}
                    >
                        <Text className={`text-xs mb-1 ${isSelected ? "text-gray-300" : isToday ? "text-blue-600 font-bold" : "text-gray-400"}`}>
                            {format(day, "EEE", { locale: sk })}
                        </Text>
                        <Text className={`text-base font-bold ${isSelected ? "text-white" : isToday ? "text-blue-600" : "text-gray-900"}`}>
                            {format(day, "d")}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Text className="text-gray-500 font-medium mb-4">
            {format(selectedDate, "EEEE, d. MMMM", { locale: sk })}
        </Text>

        {!bookings || bookings.length === 0 ? (
            <View className="items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <Text className="text-gray-400">No bookings for this day</Text>
            </View>
        ) : (
            bookings.map((booking: any) => {
                const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
                const service = booking.booking_services?.[0]?.services;
                
                return (
                    <View key={booking.id} className="bg-white rounded-xl p-4 mb-3 border-l-4 border-l-blue-500 shadow-sm flex-row">
                        <View className="mr-4 items-center justify-center">
                             <Text className="font-bold text-gray-900 text-lg">{booking.time_from.slice(0, 5)}</Text>
                             <Text className="text-xs text-gray-400">{booking.time_to.slice(0, 5)}</Text>
                        </View>
                        <View className="flex-1 border-l border-gray-100 pl-4">
                            <Text className="text-base font-bold text-gray-900 mb-1">
                                {client?.first_name} {client?.last_name}
                            </Text>
                            <View className="flex-row items-center mb-1">
                                <Text className="text-blue-600 font-medium text-sm">
                                    {service?.name || "Service"}
                                </Text>
                            </View>
                            {service?.duration && (
                                <View className="flex-row items-center">
                                    <Clock size={12} color="#9ca3af" />
                                    <Text className="text-xs text-gray-400 ml-1">{service.duration} min</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            })
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
