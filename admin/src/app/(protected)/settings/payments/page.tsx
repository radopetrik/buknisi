import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Configure payment methods, policies, and invoices.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Connect payment providers, set accepted methods, and manage invoicing preferences for your workspace.
      </CardContent>
    </Card>
  );
}
