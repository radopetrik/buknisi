"use client";

import { useState } from "react";
import { 
  ServiceOption, 
  ClientOption, 
  UnpaidBooking, 
  Invoice, 
  BookingServiceSelection,
  PaymentMethod,
  InvoiceItem
} from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ShoppingCart, Clock, Receipt } from "lucide-react";
import { UnpaidList } from "./unpaid-list";
import { InvoicesList } from "./invoices-list";
import { CheckoutSheet } from "./checkout-sheet";
import { createInvoice, updateBookingAndPay } from "../actions";
import { safeId } from "../utils";

interface BillingManagerProps {
  services: ServiceOption[];
  clients: ClientOption[];
  unpaidBookings: UnpaidBooking[];
  invoices: Invoice[];
}

export function BillingManager({ services, clients, unpaidBookings, invoices }: BillingManagerProps) {
  const [activeTab, setActiveTab] = useState("unpaid");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<"new" | "booking">("new");
  const [selectedBooking, setSelectedBooking] = useState<UnpaidBooking | null>(null);

  const handleNewPayment = () => {
    setCheckoutMode("new");
    setSelectedBooking(null);
    setCheckoutOpen(true);
  };

  const handlePayBooking = (booking: UnpaidBooking) => {
    setCheckoutMode("booking");
    setSelectedBooking(booking);
    setCheckoutOpen(true);
  };

  const handleProcessPayment = async (
    selections: BookingServiceSelection[], 
    clientId: string | undefined, 
    method: PaymentMethod,
    totalAmount: number
  ) => {
    try {
      if (checkoutMode === "booking" && selectedBooking) {
        await updateBookingAndPay(selectedBooking.id, selections, method, services, clientId);
        // toast.success("Rezervácia bola zaplatená");
      } else {
        // Create Ad-hoc Invoice
        const items: InvoiceItem[] = [];
        selections.forEach(sel => {
          const service = services.find(s => s.id === sel.serviceId);
          if (service) {
            items.push({
              type: "service",
              id: service.id,
              name: service.name,
              price: service.price,
              count: 1
            });
            sel.addons.forEach(aSel => {
              const addon = service.addons.find(a => a.id === aSel.addonId);
              if (addon) {
                items.push({
                  type: "addon",
                  id: addon.id,
                  name: addon.name,
                  price: addon.price,
                  count: aSel.count,
                  serviceName: service.name
                });
              }
            });
          }
        });

        await createInvoice({
          clientId: clientId || null,
          amount: totalAmount,
          paymentMethod: method,
          items: items
        });
        // toast.success("Platba bola úspešná");
      }
      setCheckoutOpen(false);
    } catch (error) {
      console.error(error);
      alert("Nastala chyba pri platbe");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pokladňa</h2>
          <p className="text-muted-foreground">Správa platieb a faktúr</p>
        </div>
        <Button onClick={handleNewPayment} size="lg" className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Nová platba
        </Button>
      </div>

      <Tabs defaultValue="unpaid" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="unpaid" className="gap-2">
            <Clock className="h-4 w-4" />
            Nezaplatené ({unpaidBookings.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Receipt className="h-4 w-4" />
            História faktúr
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid" className="space-y-4">
          <UnpaidList bookings={unpaidBookings} onPay={handlePayBooking} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <InvoicesList invoices={invoices} clients={clients} />
        </TabsContent>
      </Tabs>

      <CheckoutSheet
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        mode={checkoutMode}
        initialBooking={selectedBooking}
        services={services}
        clients={clients}
        onPay={handleProcessPayment}
      />
    </div>
  );
}
