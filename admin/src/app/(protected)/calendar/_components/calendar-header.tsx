import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDateLabel } from "../utils";
import { StaffOption, ViewMode } from "../types";

interface CalendarHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  focusedDate: Date;
  onDateNav: (direction: "prev" | "next" | "today") => void;
  staffFilter: string;
  setStaffFilter: (id: string) => void;
  staffMembers: StaffOption[];
  onAddBooking: () => void;
  loadingData: boolean;
  servicesCount: number;
}

const viewLabels: Record<ViewMode, string> = {
  month: "Mesiač",
  week: "Týždeň",
  day: "Deň",
  agenda: "Agenda",
};

export function CalendarHeader({
  viewMode,
  setViewMode,
  focusedDate,
  onDateNav,
  staffFilter,
  setStaffFilter,
  staffMembers,
  onAddBooking,
  loadingData,
  servicesCount,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">Kalendár</h2>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => onDateNav("prev")} aria-label="Predošlé">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onDateNav("today")}
            className="min-w-[160px] justify-between"
            aria-label="Dnešný dátum"
          >
            <span>{getDateLabel(focusedDate)}</span>
            <span className="text-xs text-muted-foreground">Dnes</span>
          </Button>
          <Button size="icon" variant="outline" onClick={() => onDateNav("next")} aria-label="Ďalšie">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-input bg-white">
          {Object.entries(viewLabels).map(([key, label]) => {
            const active = viewMode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setViewMode(key as ViewMode)}
                className={`px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "text-slate-700 hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <select
          value={staffFilter}
          onChange={(event) => setStaffFilter(event.target.value)}
          className="h-10 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <option value="">Všetci pracovníci</option>
          {staffMembers.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name}
            </option>
          ))}
        </select>
        <Button onClick={onAddBooking} disabled={loadingData || servicesCount === 0 || staffMembers.length === 0}>
          Pridať booking
        </Button>
        {(servicesCount === 0 || staffMembers.length === 0) && !loadingData && (
          <span className="text-xs text-red-600">Pridajte služby a pracovníkov, aby ste mohli vytvárať bookingy.</span>
        )}
      </div>
    </div>
  );
}
