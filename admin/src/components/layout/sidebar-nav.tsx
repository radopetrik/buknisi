"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  LayoutDashboard,
  Settings,
  Users,
  UserCog,
  Store,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const CashRegister = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="7" x="3" y="15" rx="2" />
    <path d="M5 15 7 6h10l2 9" />
    <rect width="10" height="4" x="7" y="2" rx="1" />
    <circle cx="12" cy="18" r="1" />
  </svg>
);

const mainNavItems = [
  { label: "Prehľad", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kalendár", href: "/calendar", icon: CalendarRange },
  { label: "Pokladňa", href: "/billing", icon: CashRegister },
  { label: "Klienti", href: "/clients", icon: Users },
  { label: "Zamestnanci", href: "/staff", icon: UserCog },
  { label: "Hodnotenia", href: "/rating", icon: Star },
];

const bottomNavItems = [
  { label: "Profil", href: "/profile", icon: Store },
  { label: "Nastavenia", href: "/settings", icon: Settings },
];

export function SidebarNav({ isCollapsed }: { isCollapsed?: boolean }) {
  const pathname = usePathname();

  const renderItems = (items: typeof mainNavItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
            "hover:bg-white/40 hover:text-foreground hover:shadow-sm",
            isActive
              ? "bg-white/60 text-foreground shadow-sm ring-1 ring-black/5 backdrop-blur-sm"
              : "text-foreground/70 hover:text-foreground",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </Link>
      );
    });
  };

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {renderItems(mainNavItems)}
      
      <div className="my-2 px-3">
        <Separator className="bg-border/50" />
      </div>

      {renderItems(bottomNavItems)}
    </nav>
  );
}
