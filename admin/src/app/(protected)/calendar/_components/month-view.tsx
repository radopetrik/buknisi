import { dayNames, formatDateKey, getMonthMatrix, isSameDay } from "../utils";
import { Booking, ClientOption, ServiceOption, StaffOption } from "../types";
import { BookingCard } from "./booking-card";

interface MonthViewProps {
  focusedDate: Date;
  bookings: Booking[];
  staffMembers: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onBookingClick: (booking: Booking) => void;
  onDayClick: (date: Date, bookings: Booking[]) => void;
}

export function MonthView({
  focusedDate,
  bookings,
  staffMembers,
  services,
  clients,
  onBookingClick,
  onDayClick,
}: MonthViewProps) {
  const weeks = getMonthMatrix(focusedDate);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground">
        {dayNames.map((name) => (
          <div key={name} className="px-2 py-1 text-center">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 auto-rows-[150px] md:auto-rows-[170px]">
        {weeks.flat().map((day, idx) => {
          const dayBookings = bookings.filter((booking) => booking.date === formatDateKey(day));
          const isCurrentMonth = day.getMonth() === focusedDate.getMonth();
          const visibleBookings = dayBookings.slice(0, 2);
          const overflowCount = Math.max(dayBookings.length - visibleBookings.length, 0);
          const hasBookings = dayBookings.length > 0;

          const handleDayClick = () => {
            if (!hasBookings) return;
            onDayClick(day, dayBookings);
          };

          return (
            <div
              key={`${day.toISOString()}-${idx}`}
              className={`flex flex-col overflow-hidden rounded-lg border ${
                isCurrentMonth ? "bg-white" : "bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={handleDayClick}
                className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-secondary"
              >
                <div className="flex items-center gap-2">
                  <span className={`${isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
                    {day.getDate()}
                  </span>
                  {hasBookings && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {dayBookings.length} objednávok
                    </span>
                  )}
                </div>
                {isSameDay(day, new Date()) && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    Dnes
                  </span>
                )}
              </button>

              <div className="flex-1 space-y-1 overflow-hidden px-2 pb-2">
                {!hasBookings ? (
                  <p className="text-[11px] text-slate-400">Voľné</p>
                ) : (
                  <>
                    {visibleBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        staffMembers={staffMembers}
                        services={services}
                        clients={clients}
                        onClick={onBookingClick}
                      />
                    ))}
                    {overflowCount > 0 && (
                      <button
                        type="button"
                        onClick={handleDayClick}
                        className="w-full rounded-md border border-dashed border-slate-200 bg-white px-3 py-1 text-left text-[11px] font-semibold text-primary transition hover:border-secondary hover:bg-secondary"
                      >
                        +{overflowCount} ďalšie
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
