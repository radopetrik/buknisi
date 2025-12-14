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
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Calendar", href: "/calendar", icon: CalendarRange },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Staff Management", href: "/staff", icon: UserCog },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SidebarNav() {
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
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-purple-50 hover:text-purple-900",
              isActive
                ? "bg-purple-100 text-purple-900 shadow-sm"
                : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
