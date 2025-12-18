import { getUserWithCompany, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { PaymentMethods } from "@/components/dashboard/payment-methods";
import { CalendarDays, Users, Star, TrendingUp, CreditCard, DollarSign, Activity } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default async function DashboardPage() {
  const { company } = await getUserWithCompany();
  if (!company) redirect("/login");

  const supabase = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  // Date 6 months ago for chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Start of month
  const sixMonthsAgoStr = sixMonthsAgo.toISOString();

  // Start of current month for "This Month" stats
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  // Parallel data fetching
  const [
    { data: companyDetails },
    { count: bookingsCount },
    { count: clientsCount },
    { count: unpaidCount },
    { data: upcomingBookings },
    { data: recentRatings },
    { data: recentInvoices },
    { data: allInvoices },
  ] = await Promise.all([
    // 1. Company details (rating)
    supabase.from("companies").select("rating, rating_count, review_rank").eq("id", company.id).single(),

    // 2. Upcoming bookings count (from today)
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("company_id", company.id).gte("date", todayStr),

    // 3. Total clients count
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("company_id", company.id),

    // 4. Unpaid bookings count
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("company_id", company.id).is("invoice_id", null),

    // 5. Upcoming bookings list (limit 5)
    supabase
      .from("bookings")
      .select(`
        id, date, time_from, time_to,
        clients(first_name, last_name, phone),
        booking_services(
            services(name, price)
        )
      `)
      .eq("company_id", company.id)
      .gte("date", todayStr)
      .order("date", { ascending: true })
      .order("time_from", { ascending: true })
      .limit(5),

    // 6. Recent ratings (limit 3)
    supabase
      .from("company_ratings")
      .select(`
        id, rating, note, created_at,
        user:profiles(first_name, last_name, email)
      `)
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(3),

    // 7. Recent Invoices (limit 5)
    supabase
      .from("invoices")
      .select(`
        id, amount, created_at,
        clients(first_name, last_name, email)
      `)
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(5),

    // 8. All invoices from last 6 months (for charts)
    supabase
      .from("invoices")
      .select("amount, created_at, payment_method")
      .eq("company_id", company.id)
      .gte("created_at", sixMonthsAgoStr)
  ]);

  // --- Process Data ---

  // 1. Monthly Revenue for Chart
  const monthsMap = new Map<string, number>();
  // Init last 6 months
  for (let i = 5; i >= 0; i--) {
     const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
     const key = d.toLocaleString('sk-SK', { month: 'short' });
     // Capitalize first letter
     const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
     monthsMap.set(formattedKey, 0);
  }

  let totalRevenueThisMonth = 0;
  
  const paymentMethodsMap = { cash: 0, card: 0 };

  if (allInvoices) {
    allInvoices.forEach(inv => {
      const d = new Date(inv.created_at);
      const key = d.toLocaleString('sk-SK', { month: 'short' });
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      if (monthsMap.has(formattedKey)) {
        monthsMap.set(formattedKey, (monthsMap.get(formattedKey) || 0) + Number(inv.amount));
      }

      // Calculate this month revenue
      if (inv.created_at >= startOfMonth) {
        totalRevenueThisMonth += Number(inv.amount);
      }

      // Payment methods
      if (inv.payment_method === 'cash') paymentMethodsMap.cash++;
      if (inv.payment_method === 'card') paymentMethodsMap.card++;
    });
  }

  const overviewData = Array.from(monthsMap.entries()).map(([name, total]) => ({ name, total }));
  
  const paymentMethodData = [
    { name: 'Hotovosť', value: paymentMethodsMap.cash },
    { name: 'Karta', value: paymentMethodsMap.card },
  ];

  const recentSalesData = (recentInvoices || []).map(inv => {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    return {
      id: inv.id,
      name: client ? `${client.first_name} ${client.last_name}` : "Neznámy klient",
      email: client?.email || "",
      amount: Number(inv.amount),
      date: inv.created_at
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tržby (Tento mesiac)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenueThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Suma za aktuálny mesiac
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nezaplatené rezervácie</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              čakajú na vyúčtovanie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nadchádzajúce rezervácie</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsCount || 0}</div>
            <p className="text-xs text-muted-foreground">od dnešného dňa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hodnotenie</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companyDetails?.rating ? Number(companyDetails.rating).toFixed(1) : "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              z {companyDetails?.rating_count || 0} hodnotení
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Prehľad tržieb</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={overviewData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Spôsob platby</CardTitle>
            <CardDescription>Pomer hotovostných a bezhotovostných platieb</CardDescription>
          </CardHeader>
          <CardContent>
             <PaymentMethods data={paymentMethodData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         <Card className="col-span-4">
           <CardHeader>
            <CardTitle>Posledné transakcie</CardTitle>
            <CardDescription>
              Vykonané platby za služby.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales sales={recentSalesData} />
          </CardContent>
         </Card>

         <Card className="col-span-3">
           <CardHeader>
             <CardTitle>Najbližšie rezervácie</CardTitle>
             <CardDescription>
               Čo vás čaká v najbližších dňoch.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-8">
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking: any) => {
                    const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
                    const serviceName = booking.booking_services?.[0]?.services?.name;
                    
                    return (
                    <div key={booking.id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {client?.first_name} {client?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.date).toLocaleDateString("sk-SK")} • {booking.time_from.slice(0, 5)}
                        </p>
                      </div>
                       <div className="ml-auto font-medium">
                           {/* Simplified service display */}
                           {serviceName}
                           {booking.booking_services?.length > 1 ? " +..." : ""}
                       </div>
                    </div>
                  )})
                ) : (
                    <p className="text-sm text-muted-foreground">Žiadne rezervácie.</p>
                )}
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
