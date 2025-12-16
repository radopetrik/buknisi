import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin panel</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Your central place to manage calendar, billing, clients, staff, profile, and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-primary-foreground/80">
          Track your operations and jump into a category using the sidebar.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Calendar", body: "Review schedules, events, and availability." },
          { title: "Billing", body: "Monitor invoices, payments, and balances." },
          { title: "Clients", body: "Stay on top of client records and notes." },
          { title: "Staff Management", body: "Manage roles, onboarding, and permissions." },
          { title: "Profile", body: "Update your personal and security information." },
          { title: "Settings", body: "Configure preferences, notifications, and integrations." },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.body}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <Separator className="mb-3" />
              Quick links and actions for this area will appear here.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
