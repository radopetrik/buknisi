import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>Stay on top of client records and notes.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Client lists, profiles, and communication history will be managed here.
      </CardContent>
    </Card>
  );
}
