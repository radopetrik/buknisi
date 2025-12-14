import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>Review schedules, events, and availability.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Calendar tools will appear here. Use this area to plan and coordinate upcoming work.
      </CardContent>
    </Card>
  );
}
