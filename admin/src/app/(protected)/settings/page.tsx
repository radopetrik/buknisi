import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  {
    title: "Services",
    description: "Manage service offerings, durations, and pricing.",
    href: "/settings/services",
  },
  {
    title: "Bookings",
    description: "Adjust scheduling rules, buffers, and notifications.",
    href: "/settings/bookings",
  },
  {
    title: "Payments",
    description: "Configure payment methods, policies, and invoices.",
    href: "/settings/payments",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Select a category to configure workspace preferences.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-md"
            >
              <CardHeader className="p-0">
                <CardTitle className="text-base group-hover:text-primary">{category.title}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
