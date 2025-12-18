"use client";

import { useState } from "react";
import { Invoice, ClientOption, CompanyDetails } from "../types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime } from "../utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDetailDialog } from "./invoice-detail-dialog";

interface InvoicesListProps {
  invoices: Invoice[];
  clients: ClientOption[];
  companyDetails: CompanyDetails;
}

export function InvoicesList({ invoices, clients, companyDetails }: InvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Žiadne faktúry v histórii.
      </div>
    );
  }

  const getClientName = (invoice: Invoice) => {
    if (invoice.clientName) return invoice.clientName;
    if (invoice.clientId) {
      const client = clients.find(c => c.id === invoice.clientId);
      return client ? `${client.firstName} ${client.lastName}` : "Neznámy";
    }
    return "-";
  };

  const getClientOption = (invoice: Invoice) => {
    if (invoice.clientId) {
      return clients.find(c => c.id === invoice.clientId);
    }
    return undefined;
  };

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dátum</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead>Suma</TableHead>
              <TableHead>Metóda</TableHead>
              <TableHead>Položky</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {formatDateTime(invoice.createdAt)}
                </TableCell>
                <TableCell>{getClientName(invoice)}</TableCell>
                <TableCell className="font-bold">{formatPrice(invoice.amount)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {invoice.paymentMethod === "card" ? "Karta" : "Hotovosť"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                  {invoice.items.map(i => `${i.name} (x${i.count})`).join(", ")}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(invoice)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceDetailDialog 
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
        company={companyDetails}
        client={selectedInvoice ? getClientOption(selectedInvoice) : undefined}
      />
    </>
  );
}
