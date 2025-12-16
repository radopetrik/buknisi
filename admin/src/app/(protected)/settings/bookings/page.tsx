import { Separator } from "@/components/ui/separator";

export default function SettingsBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Bookings</h3>
        <p className="text-sm text-muted-foreground">
          Adjust scheduling rules, buffers, and notifications.
        </p>
      </div>
      <Separator />
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
         Set booking policies like lead times, buffer intervals, cancellation rules, and confirmation notices.
      </div>
    </div>
  );
}
