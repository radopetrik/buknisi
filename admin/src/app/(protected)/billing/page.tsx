import { getBillingData } from "./actions";
import { BillingManager } from "./_components/billing-manager";

export default async function BillingPage() {
  const { services, clients, unpaidBookings, invoices, companyDetails } = await getBillingData();

  return (
    <BillingManager 
      services={services}
      clients={clients}
      unpaidBookings={unpaidBookings}
      invoices={invoices}
      companyDetails={companyDetails}
    />
  );
}
