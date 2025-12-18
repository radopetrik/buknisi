import { getBillingData } from "./actions";
import { BillingManager } from "./_components/billing-manager";

export default async function BillingPage() {
  const { services, clients, unpaidBookings, invoices } = await getBillingData();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <BillingManager 
        services={services}
        clients={clients}
        unpaidBookings={unpaidBookings}
        invoices={invoices}
      />
    </div>
  );
}
