import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsServicesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>Manage service offerings, durations, and pricing.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Configure the catalog of services clients can book, including durations, add-ons, and visibility.
      </CardContent>
    </Card>
  );
}
