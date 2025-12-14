import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Monitor invoices, payments, and balances.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Billing dashboards and payment management will live here.
      </CardContent>
    </Card>
  );
}
