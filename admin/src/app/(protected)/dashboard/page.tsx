
import { getUserWithCompany, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Users, Star, TrendingUp, Clock, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const { company } = await getUserWithCompany();
  if (!company) redirect("/login");

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Parallel data fetching
  const [
    { data: companyDetails },
    { count: bookingsCount },
    { count: clientsCount },
    { data: upcomingBookings },
    { data: recentRatings },
  ] = await Promise.all([
    // 1. Full company details (for rating)
    supabase
      .from("companies")
      .select("rating, rating_count, review_rank")
      .eq("id", company.id)
      .single(),

    // 2. Upcoming bookings count (from today)
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id)
      .gte("date", today),

    // 3. Total clients count
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id),

    // 4. Upcoming bookings list (limit 5)
    supabase
      .from("bookings")
      .select(`
        id,
        date,
        time_from,
        service:services(name, price),
        client:clients(first_name, last_name, phone)
      `)
      .eq("company_id", company.id)
      .gte("date", today)
      .order("date", { ascending: true })
      .order("time_from", { ascending: true })
      .limit(5),

    // 5. Recent ratings list (limit 3)
    supabase
      .from("company_ratings")
      .select(`
        id,
        rating,
        note,
        created_at,
        user:profiles(first_name, last_name, email)
      `)
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Prehľad</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Klienti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount || 0}</div>
            <p className="text-xs text-muted-foreground">celkový počet</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{companyDetails?.review_rank || "-"}</div>
            <p className="text-xs text-muted-foreground">pozícia v rebríčku</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Upcoming Bookings Table */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Najbližšie rezervácie</CardTitle>
            <CardDescription>
              Zoznam najbližších plánovaných termínov.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Čas</TableHead>
                  <TableHead>Klient</TableHead>
                  <TableHead>Služba</TableHead>
                  <TableHead className="text-right">Cena</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings && upcomingBookings.length > 0 ? (
                  upcomingBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {new Date(booking.date).toLocaleDateString("sk-SK")}
                      </TableCell>
                      <TableCell>
                        {booking.time_from.slice(0, 5)} - {booking.time_to.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{booking.client?.first_name} {booking.client?.last_name}</span>
                          <span className="text-xs text-muted-foreground">{booking.client?.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>{booking.service?.name}</TableCell>
                      <TableCell className="text-right">
                        {booking.service?.price} €
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarDays className="h-8 w-8 opacity-50" />
                        <p>Žiadne nadchádzajúce rezervácie</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Ratings List */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Posledné hodnotenia</CardTitle>
            <CardDescription>
              Spätná väzba od vašich zákazníkov.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentRatings && recentRatings.length > 0 ? (
                recentRatings.map((rating) => (
                  <div key={rating.id} className="flex items-start">
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          {rating.user?.first_name 
                            ? `${rating.user.first_name} ${rating.user.last_name}` 
                            : "Anonym"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rating.created_at).toLocaleDateString("sk-SK")}
                        </span>
                      </div>
                      <div className="flex items-center pt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < rating.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      {rating.note && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{rating.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Star className="h-8 w-8 opacity-50" />
                    <p>Zatiaľ žiadne hodnotenia</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
