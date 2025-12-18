"use client";

import { Invoice, ClientOption } from "../types";
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

interface InvoicesListProps {
  invoices: Invoice[];
  clients: ClientOption[];
}

export function InvoicesList({ invoices, clients }: InvoicesListProps) {
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

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dátum</TableHead>
            <TableHead>Klient</TableHead>
            <TableHead>Suma</TableHead>
            <TableHead>Metóda</TableHead>
            <TableHead>Položky</TableHead>
            {/* <TableHead className="text-right">Detail</TableHead> */}
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
              {/* <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
