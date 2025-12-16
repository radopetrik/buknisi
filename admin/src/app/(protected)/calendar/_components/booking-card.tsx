import { Booking, ClientOption, ServiceOption, StaffOption } from "../types";
import { calculateBookingTotals, formatPrice } from "../utils";

interface BookingCardProps {
  booking: Booking;
  staffMembers: StaffOption[];
  services: ServiceOption[];
  clients: ClientOption[];
  onClick: (booking: Booking) => void;
}

export function BookingCard({ booking, staffMembers, services, clients, onClick }: BookingCardProps) {
  const staffName = staffMembers.find((s) => s.id === booking.staffId)?.name ?? "N/A";
  const primaryServiceId = booking.serviceSelections[0]?.serviceId;
  const primaryServiceName = services.find((s) => s.id === primaryServiceId)?.name ?? "Služba";
  const extraServicesCount = Math.max(booking.serviceSelections.length - 1, 0);
  const { totalPrice } = calculateBookingTotals(booking, services);
  const clientName = booking.clientId
    ? `${clients.find((c) => c.id === booking.clientId)?.firstName ?? "Klient"}`
    : "Bez klienta";

  return (
    <button
      type="button"
      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary/50 hover:bg-secondary"
      onClick={() => onClick(booking)}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {booking.timeFrom} – {booking.timeTo}
        </span>
        <span className="font-medium text-foreground">{staffName}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">
        {primaryServiceName}
        {extraServicesCount > 0 && <span className="text-xs font-semibold text-muted-foreground"> +{extraServicesCount} služieb</span>}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{clientName}</span>
        <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
      </div>
    </button>
  );
}
