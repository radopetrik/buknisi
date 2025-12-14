import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { getUserWithCompany } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin | Dashboard",
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, company } = await getUserWithCompany();

  if (!user) {
    redirect("/login");
  }

  if (!company) {
    redirect("/login?error=no_company");
  }

  return (
    <AppShell userEmail={user.email} companyName={company.name}>
      {children}
    </AppShell>
  );
}
