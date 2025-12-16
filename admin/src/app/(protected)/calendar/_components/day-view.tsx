import { formatDateKey, getDateLabel } from "../utils";
import { Booking, ClientOption, ServiceOption, StaffOption } from "../types";
import { BookingCard } from "./booking-card";

interface DayViewProps {
  focusedDate: Date;
  bookings: Booking[];
  staffMembers: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onBookingClick: (booking: Booking) => void;
}

export function DayView({
  focusedDate,
  bookings,
  staffMembers,
  services,
  clients,
  onBookingClick,
}: DayViewProps) {
  const dayBookings = bookings
    .filter((booking) => booking.date === formatDateKey(focusedDate))
    .sort((a, b) => a.timeFrom.localeCompare(b.timeFrom));

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{getDateLabel(focusedDate)}</p>
        <p className="text-xs text-muted-foreground">{dayBookings.length} rezervácie</p>
      </div>
      <div className="divide-y">
        {dayBookings.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">Žiadne rezervácie</p>
        ) : (
          dayBookings.map((booking) => (
            <div key={booking.id} className="px-4 py-3">
              <BookingCard
                booking={booking}
                staffMembers={staffMembers}
                services={services}
                clients={clients}
                onClick={onBookingClick}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
