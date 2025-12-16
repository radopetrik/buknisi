import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Booking, BookingServiceSelection, ClientOption, ServiceOption, StaffOption } from "../types";
import { addMinutesToTime, calculateBookingTotals, formatPrice, safeId } from "../utils";

interface BookingSheetProps {
  isOpen: boolean;
  mode: "view" | "edit" | "create";
  booking: Booking | null;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  onEdit: () => void;
  staffMembers: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onCreateClientOpen: () => void;
}

export function BookingSheet({
  isOpen,
  mode,
  booking: initialBooking,
  onClose,
  onSave,
  onEdit,
  staffMembers,
  services,
  clients,
  onCreateClientOpen,
}: BookingSheetProps) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [activeTab, setActiveTab] = useState<"booking" | "notes">("booking");
  const [clientSearch, setClientSearch] = useState("");
  const [clientOptionsOpen, setClientOptionsOpen] = useState(false);
  const [addonsOpen, setAddonsOpen] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setBooking(initialBooking);
    if (initialBooking && initialBooking.clientId) {
      const client = clients.find((c) => c.id === initialBooking.clientId);
      setClientSearch(client ? `${client.firstName} ${client.lastName}`.trim() : "");
    } else {
      setClientSearch("");
    }
    setFormError("");
    setClientOptionsOpen(false);
    setActiveTab("booking");
  }, [initialBooking, clients, isOpen]);

  const bookingTotals = booking && services.length > 0 ? calculateBookingTotals(booking, services) : { totalMinutes: 0, totalPrice: 0 };

  useEffect(() => {
    if (!booking) return;
    const nextTimeTo = addMinutesToTime(booking.timeFrom, bookingTotals.totalMinutes);
    if (nextTimeTo !== booking.timeTo) {
        setBooking((prev) => (prev ? { ...prev, timeTo: nextTimeTo } : prev));
    }
  }, [booking?.timeFrom, booking?.serviceSelections, bookingTotals.totalMinutes]);

  if (!booking) return null;

  const handleBookingField = (field: keyof Booking, value: string | null) => {
    if (field === "clientId") {
      const client = clients.find((c) => c.id === value);
      setClientSearch(client ? `${client.firstName} ${client.lastName}`.trim() : "");
      setClientOptionsOpen(false);
    }
    const nextValue = field === "clientId" && value === "" ? null : value;
    setBooking((prev) => (prev ? { ...prev, [field]: nextValue as never } : prev));
  };

  const handleAddService = () => {
    const fallbackService = services[0];
    if (!fallbackService) return;
    const selection: BookingServiceSelection = { id: safeId(), serviceId: fallbackService.id, addons: [] };
    setBooking((prev) =>
      prev
        ? { ...prev, serviceSelections: [...prev.serviceSelections, selection] }
        : prev
    );
  };

  const handleRemoveService = (selectionId: string) => {
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            serviceSelections: prev.serviceSelections.filter((item) => item.id !== selectionId),
          }
        : prev
    );
  };

  const handleServiceChange = (selectionId: string, serviceId: string) => {
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            serviceSelections: prev.serviceSelections.map((item) =>
              item.id === selectionId ? { ...item, serviceId, addons: [] } : item
            ),
          }
        : prev
    );
  };

  const handleAddonToggle = (selectionId: string, addonId: string, checked: boolean) => {
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            serviceSelections: prev.serviceSelections.map((selection) => {
              if (selection.id !== selectionId) return selection;
              if (checked) {
                const exists = selection.addons.find((addon) => addon.addonId === addonId);
                if (exists) return selection;
                return { ...selection, addons: [...selection.addons, { addonId, count: 1 }] };
              }
              return { ...selection, addons: selection.addons.filter((addon) => addon.addonId !== addonId) };
            }),
          }
        : prev
    );
  };

  const handleAddonCountChange = (selectionId: string, addonId: string, count: number) => {
    setBooking((prev) =>
      prev
        ? {
            ...prev,
            serviceSelections: prev.serviceSelections.map((selection) => {
              if (selection.id !== selectionId) return selection;
              return {
                ...selection,
                addons: selection.addons.map((addon) =>
                  addon.addonId === addonId ? { ...addon, count: Math.max(1, count) } : addon
                ),
              };
            }),
          }
        : prev
    );
  };

  const handleSaveInternal = () => {
      const hasServices = booking.serviceSelections.length > 0 && booking.serviceSelections.every((item) => item.serviceId);
      if (!hasServices || !booking.staffId || !booking.date || !booking.timeFrom || !booking.timeTo) {
        setFormError("Vyplňte aspoň jednu službu, pracovníka, dátum a čas.");
        return;
      }
      if (booking.timeFrom >= booking.timeTo) {
        setFormError("Čas od musí byť menší ako čas do.");
        return;
      }
      onSave(booking);
  };

  const filteredClients = clientSearch.trim()
    ? clients.filter((client) =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearch.trim().toLowerCase())
      )
    : clients;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex h-full flex-col w-full sm:max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <SheetHeader className="text-left">
            <SheetTitle>{mode === "create" ? "Nový booking" : "Detail booking"}</SheetTitle>
            <SheetDescription>Client je voliteľný; môžete ho vytvoriť priamo v sheete.</SheetDescription>
          </SheetHeader>
          <div className="flex items-center gap-2">
            {mode !== "create" && (
              <Button variant="outline" onClick={onEdit}>
                Upraviť
              </Button>
            )}
            <SheetClose asChild>
              <Button variant="ghost" onClick={onClose}>Zavrieť</Button>
            </SheetClose>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("booking")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              activeTab === "booking" ? "bg-primary text-primary-foreground shadow" : "text-slate-700 hover:bg-secondary"
            }`}
          >
            Booking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              activeTab === "notes" ? "bg-primary text-primary-foreground shadow" : "text-slate-700 hover:bg-secondary"
            }`}
          >
            Notes & Info
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="mb-6 space-y-3">
            <Label htmlFor="client">Klient (voliteľné)</Label>
            <div className="relative">
              <Input
                id="client"
                placeholder="Vyhľadajte klienta"
                disabled={mode === "view"}
                value={clientSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setClientSearch(value);
                  if (value.trim() === "") {
                    handleBookingField("clientId", "");
                  }
                  setClientOptionsOpen(true);
                }}
                onFocus={() => setClientOptionsOpen(true)}
              />
              {clientOptionsOpen && mode !== "view" && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-secondary"
                    onClick={() => {
                        onCreateClientOpen();
                        setClientOptionsOpen(false);
                    }}
                  >
                    + Vytvoriť nového klienta
                  </button>
                  <div className="max-h-56 divide-y overflow-auto">
                    {filteredClients.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500">Žiadny klient</p>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                          onClick={() => {
                            handleBookingField("clientId", client.id);
                            setClientSearch(`${client.firstName} ${client.lastName}`.trim());
                            setClientOptionsOpen(false);
                          }}
                        >
                          <span className="font-medium text-foreground">
                            {client.firstName} {client.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">{client.email ?? client.phone ?? ""}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {booking.clientId && <p className="text-xs text-muted-foreground">Vybraný klient: {clientSearch || ""}</p>}
          </div>

          {activeTab === "booking" && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="staff">Pracovník</Label>
                  <select
                    id="staff"
                    disabled={mode === "view"}
                    value={booking.staffId}
                    onChange={(event) => handleBookingField("staffId", event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="date">Dátum</Label>
                  <Input
                    id="date"
                    type="date"
                    disabled={mode === "view"}
                    value={booking.date}
                    onChange={(event) => handleBookingField("date", event.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="timeFrom">Čas od</Label>
                  <Input
                    id="timeFrom"
                    type="time"
                    disabled={mode === "view"}
                    value={booking.timeFrom}
                    onChange={(event) => handleBookingField("timeFrom", event.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="timeTo">Čas do</Label>
                  <Input id="timeTo" type="time" readOnly disabled value={booking.timeTo} />
                  <p className="text-xs text-muted-foreground">Koniec sa počíta podľa trvania služieb a doplnkov.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Servisy a doplnky</Label>
                  {mode !== "view" && (
                    <Button size="sm" variant="outline" onClick={handleAddService}>
                      Pridať službu
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {booking.serviceSelections.map((selection, index) => {
                    const service = services.find((item) => item.id === selection.serviceId);
                    const selectionTotals = calculateBookingTotals(
                      { ...booking, serviceSelections: [selection] },
                      services
                    );
                    const selectedAddonDetails = service
                      ? selection.addons
                          .map((addonSel) => {
                            const addon = service.addons.find((item) => item.id === addonSel.addonId);
                            if (!addon) return null;
                            return { ...addon, count: addonSel.count };
                          })
                          .filter(Boolean) as { id: string; name: string; price: number; duration: number; count: number }[]
                      : [];
                    return (
                      <div key={selection.id} className="space-y-3 rounded-md border bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-foreground">Služba {index + 1}</div>
                          {mode !== "view" && booking.serviceSelections.length > 1 && (
                            <button
                              type="button"
                              className="text-xs font-semibold text-red-600 hover:underline"
                              onClick={() => handleRemoveService(selection.id)}
                            >
                              Odstrániť
                            </button>
                          )}
                        </div>

                        <select
                          disabled={mode === "view"}
                          value={selection.serviceId}
                          onChange={(event) => handleServiceChange(selection.id, event.target.value)}
                          className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {services.map((serviceItem) => (
                            <option key={serviceItem.id} value={serviceItem.id}>
                              {serviceItem.name}
                            </option>
                          ))}
                        </select>

                        {service && (
                          <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                            <span>
                              {service.duration} min • {formatPrice(service.price)}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatPrice(selectionTotals.totalPrice)}
                            </span>
                          </div>
                        )}

                        {service && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground">
                                Doplnky {selectedAddonDetails.length > 0 ? `(${selectedAddonDetails.length})` : ""}
                              </p>
                              {service.addons.length > 0 && (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-primary hover:underline"
                                  onClick={() => setAddonsOpen((prev) => ({ ...prev, [selection.id]: !prev[selection.id] }))}
                                >
                                  {addonsOpen[selection.id] ? "Skryť" : "Spravovať"} doplnky
                                </button>
                              )}
                            </div>

                            {selectedAddonDetails.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedAddonDetails.map((addon) => (
                                  <span
                                    key={addon.id}
                                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-secondary-foreground"
                                  >
                                    {addon.name} ×{addon.count}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Žiadne doplnky</p>
                            )}

                            {service.addons.length > 0 && addonsOpen[selection.id] && (
                              <div className="max-h-64 space-y-2 overflow-auto rounded-md border bg-slate-50 p-3">
                                {service.addons.map((addon) => {
                                  const selectedAddon = selection.addons.find((item) => item.addonId === addon.id);
                                  const checked = !!selectedAddon;
                                  return (
                                    <div
                                      key={addon.id}
                                      className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2"
                                    >
                                      <div className="flex flex-col text-sm">
                                        <span className="font-medium text-foreground">{addon.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {addon.duration} min • {formatPrice(addon.price)}
                                        </span>
                                      </div>
                                      {mode === "view" ? (
                                        <span className="text-xs font-semibold text-foreground">
                                          {checked ? `×${selectedAddon?.count ?? 1}` : "-"}
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) =>
                                              handleAddonToggle(selection.id, addon.id, event.target.checked)
                                            }
                                            className="h-4 w-4"
                                          />
                                          <Input
                                            type="number"
                                            min={1}
                                            value={selectedAddon?.count ?? 1}
                                            disabled={!checked}
                                            onChange={(event) =>
                                              handleAddonCountChange(selection.id, addon.id, Number(event.target.value))
                                            }
                                            className="h-9 w-20"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="internalNote">Interná poznámka</Label>
                <textarea
                  id="internalNote"
                  disabled={mode === "view"}
                  value={booking.internalNote ?? ""}
                  onChange={(event) => handleBookingField("internalNote", event.target.value)}
                  className="min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Systémové poznámky viditeľné len interne"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="clientNote">Poznámka klienta</Label>
                <textarea
                  id="clientNote"
                  disabled={mode === "view"}
                  value={booking.clientNote ?? ""}
                  onChange={(event) => handleBookingField("clientNote", event.target.value)}
                  className="min-h-[100px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Poznámka od klienta / preferencie"
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 mt-4 border-t pt-4 bg-background">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Celkový čas</span>
              <span className="font-semibold text-foreground">{bookingTotals.totalMinutes} min</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cena spolu</span>
              <span className="font-semibold text-foreground">{formatPrice(bookingTotals.totalPrice)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-red-600">{formError}</div>
            {mode !== "view" && (
              <div className="flex gap-2">
                <SheetClose asChild>
                  <Button variant="outline" onClick={onClose}>
                    Zrušiť
                  </Button>
                </SheetClose>
                <Button onClick={handleSaveInternal}>Uložiť</Button>
              </div>
            )}
            {mode === "view" && (
              <Button onClick={onEdit}>
                Upraviť booking
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
