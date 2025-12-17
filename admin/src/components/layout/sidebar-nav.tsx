"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  CreditCard,
  Settings,
  User,
  UserCog,
  Users,
  Star,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Kalendár", href: "/calendar", icon: CalendarRange },
  { label: "Fakturácia", href: "/billing", icon: CreditCard },
  { label: "Klienti", href: "/clients", icon: Users },
  { label: "Zamestnanci", href: "/staff", icon: UserCog },
  { label: "Profil", href: "/profile", icon: User },
  { label: "Nastavenia", href: "/settings", icon: Settings },
  { label: "Hodnotenia", href: "/rating", icon: Star },
];

export function SidebarNav({ isCollapsed }: { isCollapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
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
      })}
    </nav>
  );
}
