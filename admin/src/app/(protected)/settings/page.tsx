import Link from "next/link";
import {
  Briefcase,
  Calendar,
  CreditCard,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";

const categories = [
  {
    title: "Services",
    description: "Manage service offerings, durations, and pricing.",
    href: "/settings/services",
    icon: Briefcase,
  },
  {
    title: "Bookings",
    description: "Adjust scheduling rules, buffers, and notifications.",
    href: "/settings/bookings",
    icon: Calendar,
  },
  {
    title: "Payments",
    description: "Configure payment methods, policies, and invoices.",
    href: "/settings/payments",
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your workspace preferences and configurations.
        </p>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-md hover:border-primary/50"
          >
            <div className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <category.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold tracking-tight">{category.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {category.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
