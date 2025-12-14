import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsBookingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>Adjust scheduling rules, buffers, and notifications.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Set booking policies like lead times, buffer intervals, cancellation rules, and confirmation notices.
      </CardContent>
    </Card>
  );
}
