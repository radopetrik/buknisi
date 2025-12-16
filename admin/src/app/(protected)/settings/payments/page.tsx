import { Separator } from "@/components/ui/separator";

export default function SettingsPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Payments</h3>
        <p className="text-sm text-muted-foreground">
          Configure payment methods, policies, and invoices.
        </p>
      </div>
      <Separator />
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Connect payment providers, set accepted methods, and manage invoicing preferences for your workspace.
      </div>
    </div>
  );
}
