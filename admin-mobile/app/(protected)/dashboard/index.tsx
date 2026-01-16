import { ScrollView, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Stack } from "expo-router";
import { CreditCard, Calendar, Users, Star } from "lucide-react-native";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";

function StatCard({ title, value, subtext, icon: Icon }: any) {
  return (
    <Box className="bg-white p-4 rounded-xl border border-gray-100 flex-1 mb-3 mx-1 shadow-sm">
      <HStack className="justify-between items-start mb-2">
        <Text className="text-sm font-medium text-gray-500">{title}</Text>
        <Icon size={16} color="#6b7280" />
      </HStack>
      <Heading size="xl" className="font-bold text-gray-900">{value}</Heading>
      <Text className="text-xs text-gray-400 mt-1">{subtext}</Text>
    </Box>
  );
}

export default function DashboardScreen() {
  const { data: company, isLoading: companyLoading } = useCompany();

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [
        { count: bookingsCount },
        { count: clientsCount },
        { count: unpaidCount },
        { data: upcomingBookings },
        { data: recentInvoices },
        { data: monthInvoices } // For revenue
      ] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("company_id", company!.id).gte("date", today),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("company_id", company!.id),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("company_id", company!.id).is("invoice_id", null),
        supabase
          .from("bookings")
          .select("id, date, time_from, clients(first_name, last_name), booking_services(services(name))")
          .eq("company_id", company!.id)
          .gte("date", today)
          .order("date", { ascending: true })
          .order("time_from", { ascending: true })
          .limit(5),
        supabase
           .from("invoices")
           .select("id, amount, created_at, clients(first_name, last_name)")
           .eq("company_id", company!.id)
           .order("created_at", { ascending: false })
           .limit(5),
        supabase
           .from("invoices")
           .select("amount")
           .eq("company_id", company!.id)
           .gte("created_at", startOfMonth)
      ]);

      const revenue = monthInvoices?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      return {
        bookingsCount,
        clientsCount,
        unpaidCount,
        upcomingBookings,
        recentInvoices,
        revenue
      };
    }
  });

  if (companyLoading || statsLoading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={statsLoading} onRefresh={refetch} />}
    >
      <Stack.Screen options={{ headerTitle: company?.name || "Dashboard", headerShadowVisible: false }} />
      
      <HStack className="flex-wrap -mx-1 mb-4">
        <Box className="w-1/2">
            <StatCard 
                title="Revenue" 
                value={`€${stats?.revenue.toFixed(2)}`} 
                subtext="This month"
                icon={CreditCard}
            />
        </Box>
        <Box className="w-1/2">
            <StatCard 
                title="Upcoming" 
                value={stats?.bookingsCount} 
                subtext="Future bookings"
                icon={Calendar}
            />
        </Box>
        <Box className="w-1/2">
            <StatCard 
                title="Unpaid" 
                value={stats?.unpaidCount} 
                subtext="Needs invoice"
                icon={Star}
            />
        </Box>
        <Box className="w-1/2">
            <StatCard 
                title="Clients" 
                value={stats?.clientsCount} 
                subtext="Total database"
                icon={Users}
            />
        </Box>
      </HStack>

      <Box className="mb-6">
        <Heading size="md" className="mb-3 text-gray-900">Upcoming Bookings</Heading>
        {stats?.upcomingBookings?.length === 0 ? (
           <Text className="text-gray-500">No upcoming bookings.</Text>
        ) : (
          stats?.upcomingBookings?.map((booking: any) => {
             const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
             const service = booking.booking_services?.[0]?.services?.name || "Service";
             return (
               <Box key={booking.id} className="bg-white p-4 rounded-lg mb-2 border border-gray-100 flex-row justify-between items-center">
                 <Box>
                   <Text className="font-medium text-gray-900">{client?.first_name} {client?.last_name}</Text>
                   <Text className="text-xs text-gray-500 mt-1">
                     {format(new Date(booking.date), "d. MMM", { locale: sk })} • {booking.time_from.slice(0, 5)}
                   </Text>
                 </Box>
                 <Text className="text-sm font-medium text-gray-600">{service}</Text>
               </Box>
             );
          })
        )}
      </Box>

      <Box className="mb-8">
        <Heading size="md" className="mb-3 text-gray-900">Recent Sales</Heading>
        {stats?.recentInvoices?.map((invoice: any) => {
             const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
             return (
               <Box key={invoice.id} className="bg-white p-4 rounded-lg mb-2 border border-gray-100 flex-row justify-between items-center">
                 <Box>
                   <Text className="font-medium text-gray-900">{client?.first_name} {client?.last_name || "Unknown"}</Text>
                   <Text className="text-xs text-gray-500 mt-1">
                     {format(new Date(invoice.created_at), "d. MMM HH:mm", { locale: sk })}
                   </Text>
                 </Box>
                 <Text className="text-sm font-bold text-gray-900">+€{Number(invoice.amount).toFixed(2)}</Text>
               </Box>
             );
          })}
      </Box>
    </ScrollView>
  );
}
