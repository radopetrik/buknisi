import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Booking, ServiceOption, StaffOption } from "../types";
import { getDateLabel } from "../utils";

interface DayDetailSheetProps {
  dayDetail: { date: Date; bookings: Booking[] } | null;
  onClose: () => void;
  onBookingClick: (booking: Booking) => void;
  onAddBooking: (date: Date) => void;
  staffMembers: StaffOption[];
  services: ServiceOption[];
}

export function DayDetailSheet({
  dayDetail,
  onClose,
  onBookingClick,
  onAddBooking,
  staffMembers,
  services,
}: DayDetailSheetProps) {
  const isOpen = !!dayDetail;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {dayDetail && (
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <SheetHeader className="text-left">
              <SheetTitle>{getDateLabel(dayDetail.date)}</SheetTitle>
              <SheetDescription>Vyberte booking alebo vytvorte nový.</SheetDescription>
            </SheetHeader>
            <div className="flex items-center gap-2">
              <SheetClose asChild>
                <Button variant="outline" onClick={onClose}>
                  Zavrieť
                </Button>
              </SheetClose>
              <Button onClick={() => onAddBooking(dayDetail.date)}>
                Pridať booking
              </Button>
            </div>
          </div>
          <div className="mt-4 divide-y">
            {dayDetail.bookings.map((booking) => (
              <button
                key={booking.id}
                className="flex w-full items-start justify-between gap-3 px-1 py-4 text-left transition hover:bg-secondary"
                onClick={() => {
                  onBookingClick(booking);
                  onClose();
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {booking.timeFrom} – {booking.timeTo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {services.find((s) => s.id === booking.serviceSelections[0]?.serviceId)?.name ?? "Služba"}
                  </p>
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  {staffMembers.find((s) => s.id === booking.staffId)?.name ?? "Pracovník"}
                </div>
              </button>
            ))}
            {dayDetail.bookings.length === 0 && (
              <p className="px-1 py-6 text-sm text-slate-500">Žiadne rezervácie</p>
            )}
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}
