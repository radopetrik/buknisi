import { getDateLabel } from "../utils";
import { Booking, ClientOption, ServiceOption, StaffOption } from "../types";
import { BookingCard } from "./booking-card";

interface AgendaViewProps {
  bookings: Booking[];
  staffMembers: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onBookingClick: (booking: Booking) => void;
}

export function AgendaView({
  bookings,
  staffMembers,
  services,
  clients,
  onBookingClick,
}: AgendaViewProps) {
  const agenda = bookings
    .map((booking) => ({ ...booking, dateObj: new Date(booking.date) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Agenda</p>
        <p className="text-xs text-muted-foreground">Najbližšie rezervácie</p>
      </div>
      <div className="divide-y">
        {agenda.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">Zatiaľ nič naplánované</p>
        ) : (
          agenda.map((booking) => (
            <div key={booking.id} className="px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{getDateLabel(new Date(booking.date))}</span>
                <span>
                  {booking.timeFrom} – {booking.timeTo}
                </span>
              </div>
              <div className="mt-1">
                <BookingCard
                  booking={booking}
                  staffMembers={staffMembers}
                  services={services}
                  clients={clients}
                  onClick={onBookingClick}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
