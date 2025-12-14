import { redirect } from "next/navigation";

import type { PostgrestError } from "@supabase/supabase-js";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient, getUserWithCompany } from "@/lib/supabase/server";

import { ClientsManager } from "./_components/clients-manager";
import type { Client } from "./types";

const MIGRATION_MESSAGE =
  "Chýba stĺpec clients.company_id. Spustite migráciu db/002_add_company_to_clients.sql a znova načítajte stránku.";

export default async function ClientsPage() {
  const { company } = await getUserWithCompany();

  if (!company) {
    redirect("/login?error=no_company");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, company_id, first_name, last_name, phone, email")
    .eq("company_id", company.id)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    if ((error as PostgrestError).code === "42703") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Potrebná migrácia databázy</CardTitle>
            <CardDescription>
              Funkcionalita klientov vyžaduje nový stĺpec <code>company_id</code> v tabuľke <code>clients</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{MIGRATION_MESSAGE}</p>
            <p>Po úspešnej migrácii stránku obnovte.</p>
          </CardContent>
        </Card>
      );
    }

    throw error;
  }

  return <ClientsManager initialData={{ clients: (data ?? []) as Client[] }} />;
}
