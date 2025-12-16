import { dayNames, formatDateKey, getStartOfWeek, isSameDay } from "../utils";
import { Booking, ClientOption, ServiceOption, StaffOption } from "../types";
import { BookingCard } from "./booking-card";

interface WeekViewProps {
  focusedDate: Date;
  bookings: Booking[];
  staffMembers: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onBookingClick: (booking: Booking) => void;
}

export function WeekView({
  focusedDate,
  bookings,
  staffMembers,
  services,
  clients,
  onBookingClick,
}: WeekViewProps) {
  const start = getStartOfWeek(focusedDate);
  const days = Array.from({ length: 7 }, (_, idx) => {
    const day = new Date(start);
    day.setDate(start.getDate() + idx);
    return day;
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const dayBookings = bookings.filter((booking) => booking.date === formatDateKey(day));
        return (
          <div key={day.toISOString()} className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>
                {dayNames[(day.getDay() + 6) % 7]} {day.getDate()}.
              </span>
              {isSameDay(day, new Date()) && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  Dnes
                </span>
              )}
            </div>
            <div className="space-y-2">
              {dayBookings.length === 0 ? (
                <p className="text-[11px] text-slate-400">Voľné</p>
              ) : (
                dayBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    staffMembers={staffMembers}
                    services={services}
                    clients={clients}
                    onClick={onBookingClick}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
