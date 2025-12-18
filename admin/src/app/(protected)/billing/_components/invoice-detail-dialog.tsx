"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Invoice, CompanyDetails, ClientOption } from "../types";
import { formatPrice, formatDateTime } from "../utils";
import { Printer } from "lucide-react";

interface InvoiceDetailDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyDetails;
  client?: ClientOption;
}

export function InvoiceDetailDialog({ 
  invoice, 
  open, 
  onOpenChange, 
  company,
  client
}: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Detail faktúry</DialogTitle>
        <div id="print-area" className="p-4 sm:p-8 space-y-8 bg-white text-black">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">{company.name}</h1>
              <div className="text-sm text-gray-600 space-y-1">
                {company.addressText && <p>{company.addressText}</p>}
                {company.city && <p>{company.city}</p>}
                {company.email && <p>Email: {company.email}</p>}
                {company.phone && <p>Tel: {company.phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold mb-2">FAKTÚRA</h2>
              <p className="text-sm text-gray-600">Dátum: {formatDateTime(invoice.createdAt)}</p>
              <p className="text-sm text-gray-600">Číslo: {invoice.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-600 mt-2">
                Metóda: {invoice.paymentMethod === "card" ? "Karta" : "Hotovosť"}
              </p>
            </div>
          </div>

          {/* Client Info */}
          {(client || invoice.clientName) && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Klient</h3>
              <div className="text-sm">
                <p className="font-medium text-lg">
                  {client ? `${client.firstName} ${client.lastName}` : invoice.clientName}
                </p>
                {client?.email && <p className="text-gray-600">{client.email}</p>}
                {client?.phone && <p className="text-gray-600">{client.phone}</p>}
              </div>
            </div>
          )}

          {/* Items */}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-3 font-semibold text-gray-700">Položka</th>
                <th className="py-3 font-semibold text-gray-700 text-right">Cena</th>
                <th className="py-3 font-semibold text-gray-700 text-right">Množstvo</th>
                <th className="py-3 font-semibold text-gray-700 text-right">Spolu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.type === "addon" && item.serviceName && (
                      <div className="text-xs text-gray-500">K službe: {item.serviceName}</div>
                    )}
                  </td>
                  <td className="py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                  <td className="py-3 text-right text-gray-600">{item.count}</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatPrice(item.price * item.count)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className="border-t-2 border-gray-100">
                <td colSpan={3} className="py-4 text-right font-semibold text-gray-900">Spolu</td>
                <td className="py-4 text-right font-bold text-lg text-gray-900">
                  {formatPrice(invoice.amount)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="border-t pt-8 text-center text-xs text-gray-500">
            <p>Ďakujeme za vašu návštevu!</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zavrieť</Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Tlačiť
          </Button>
        </div>
        
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
            }
            /* Hide Dialog Overlay and other UI elements */
            [role="dialog"] > button {
               display: none;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
