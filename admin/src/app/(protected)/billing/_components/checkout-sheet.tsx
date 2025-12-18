"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UnpaidBooking, ServiceOption, ClientOption, BookingServiceSelection, PaymentMethod } from "../types";
import { formatPrice, safeId } from "../utils";
import { Trash2, Plus, CreditCard, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "new" | "booking";
  initialBooking: UnpaidBooking | null;
  services: ServiceOption[];
  clients: ClientOption[];
  onPay: (selections: BookingServiceSelection[], clientId: string | undefined, method: PaymentMethod, total: number) => void;
}

export function CheckoutSheet({
  isOpen,
  onClose,
  mode,
  initialBooking,
  services,
  clients,
  onPay
}: CheckoutSheetProps) {
  const [selections, setSelections] = useState<BookingServiceSelection[]>([]);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "booking" && initialBooking) {
        setSelections(initialBooking.serviceSelections);
        setClientId(initialBooking.clientId || undefined);
        const client = clients.find(c => c.id === initialBooking.clientId);
        setClientSearch(client ? `${client.firstName} ${client.lastName}` : "");
      } else {
        setSelections([{ id: safeId(), serviceId: services[0]?.id || "", addons: [] }]);
        setClientId(undefined);
        setClientSearch("");
      }
      setPaymentMethod("cash");
    }
  }, [isOpen, mode, initialBooking, services, clients]);

  const handleAddService = () => {
    if (!services[0]) return;
    setSelections(prev => [...prev, { id: safeId(), serviceId: services[0].id, addons: [] }]);
  };

  const handleRemoveService = (id: string) => {
    setSelections(prev => prev.filter(s => s.id !== id));
  };

  const handleServiceChange = (id: string, newServiceId: string) => {
    setSelections(prev => prev.map(s => s.id === id ? { ...s, serviceId: newServiceId, addons: [] } : s));
  };

  const handleToggleAddon = (selectionId: string, addonId: string, checked: boolean) => {
    setSelections(prev => prev.map(s => {
      if (s.id !== selectionId) return s;
      if (checked) {
        return { ...s, addons: [...s.addons, { addonId, count: 1 }] };
      }
      return { ...s, addons: s.addons.filter(a => a.addonId !== addonId) };
    }));
  };

  const handleAddonCount = (selectionId: string, addonId: string, count: number) => {
    setSelections(prev => prev.map(s => {
      if (s.id !== selectionId) return s;
      return {
        ...s,
        addons: s.addons.map(a => a.addonId === addonId ? { ...a, count: Math.max(1, count) } : a)
      };
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    selections.forEach(sel => {
      const service = services.find(s => s.id === sel.serviceId);
      if (service) {
        total += service.price;
        sel.addons.forEach(aSel => {
          const addon = service.addons.find(a => a.id === aSel.addonId);
          if (addon) {
            total += addon.price * aSel.count;
          }
        });
      }
    });
    return total;
  };

  const totalAmount = calculateTotal();

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>{mode === "new" ? "Nová platba" : "Platba rezervácie"}</SheetTitle>
          <SheetDescription>
            Skontrolujte položky a vyberte spôsob platby.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {/* Client Selection */}
          <div className="mb-6 space-y-3">
            <Label>Klient</Label>
            <div className="relative">
              <Input 
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientDropdownOpen(true);
                  if (e.target.value === "") setClientId(undefined);
                }}
                onFocus={() => setClientDropdownOpen(true)}
                placeholder="Hľadať klienta..."
              />
              {clientDropdownOpen && clientSearch && !clientId && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-lg">
                  {filteredClients.map(client => (
                    <div 
                      key={client.id}
                      className="cursor-pointer px-4 py-2 hover:bg-slate-100"
                      onClick={() => {
                        setClientId(client.id);
                        setClientSearch(`${client.firstName} ${client.lastName}`);
                        setClientDropdownOpen(false);
                      }}
                    >
                      <div className="font-medium">{client.firstName} {client.lastName}</div>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </div>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-4 py-2 text-sm text-muted-foreground">Žiadny klient nájdený</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Services & Addons */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Položky</h3>
              <Button size="sm" variant="outline" onClick={handleAddService}>
                <Plus className="mr-2 h-4 w-4" /> Pridať službu
              </Button>
            </div>

            {selections.map((sel, idx) => {
              const service = services.find(s => s.id === sel.serviceId);
              return (
                <div key={sel.id} className="rounded-lg border bg-slate-50 p-4">
                  <div className="mb-3 flex gap-3">
                    <div className="flex-1">
                      <Label className="mb-1.5 block text-xs text-muted-foreground">Služba {idx + 1}</Label>
                      <select 
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        value={sel.serviceId}
                        onChange={(e) => handleServiceChange(sel.id, e.target.value)}
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({formatPrice(s.price)})</option>
                        ))}
                      </select>
                    </div>
                    {selections.length > 1 && (
                      <div className="flex items-end">
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveService(sel.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {service && service.addons.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <Label className="text-xs text-muted-foreground">Doplnky</Label>
                      <div className="grid gap-2">
                        {service.addons.map(addon => {
                          const isSelected = sel.addons.find(a => a.addonId === addon.id);
                          return (
                            <div key={addon.id} className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={!!isSelected}
                                  onChange={(e) => handleToggleAddon(sel.id, addon.id, e.target.checked)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm">{addon.name}</span>
                                <span className="text-xs text-muted-foreground">({formatPrice(addon.price)})</span>
                              </div>
                              {isSelected && (
                                <Input 
                                  type="number" 
                                  min={1} 
                                  className="h-7 w-16 px-1 py-0 text-center text-xs"
                                  value={isSelected.count}
                                  onChange={(e) => handleAddonCount(sel.id, addon.id, parseInt(e.target.value) || 1)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer / Payment */}
        <div className="border-t bg-white p-6">
          <div className="mb-4 flex flex-col gap-3">
            <Label>Spôsob platby</Label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-3 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Wallet className={`mb-1 h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-primary' : 'text-slate-600'}`}>Hotovosť</span>
              </div>
              <div 
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-3 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className={`mb-1 h-6 w-6 ${paymentMethod === 'card' ? 'text-primary' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-primary' : 'text-slate-600'}`}>Karta</span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-medium text-muted-foreground">Spolu k úhrade</span>
            <span className="text-2xl font-bold text-foreground">{formatPrice(totalAmount)}</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Zrušiť</Button>
            <Button className="flex-1" size="lg" onClick={() => onPay(selections, clientId, paymentMethod, totalAmount)}>
              Zaplatiť {formatPrice(totalAmount)}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
