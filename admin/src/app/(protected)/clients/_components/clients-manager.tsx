"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { createClient, deleteClient, updateClient } from "../actions";
import type { Client } from "../types";

type ClientsManagerProps = {
  initialData: {
    clients: Client[];
  };
};

const clientFormSchema = z.object({
  first_name: z.string().min(1, "Meno je povinné").max(120, "Maximálne 120 znakov"),
  last_name: z.string().min(1, "Priezvisko je povinné").max(160, "Maximálne 160 znakov"),
  phone: z.string().max(40, "Telefón je príliš dlhý").optional().or(z.literal("")),
  email: z
    .string()
    .max(320, "Email je príliš dlhý")
    .optional()
    .or(z.literal(""))
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Zadajte platný email",
    }),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const defaultValues: ClientFormValues = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
};

function buildSearchableTokens(client: Client) {
  const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
  const reversedName = `${client.last_name} ${client.first_name}`.toLowerCase();
  const phone = client.phone?.toLowerCase() ?? "";
  const phoneCompact = phone.replace(/\s+/g, "");
  const email = client.email?.toLowerCase() ?? "";
  return { fullName, reversedName, phone, phoneCompact, email };
}

export function ClientsManager({ initialData }: ClientsManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  });

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return initialData.clients;
    }

    const compactTerm = term.replace(/\s+/g, "");

    return initialData.clients.filter((client) => {
      const tokens = buildSearchableTokens(client);
      return (
        tokens.fullName.includes(term) ||
        tokens.reversedName.includes(term) ||
        tokens.phone.includes(term) ||
        tokens.phoneCompact.includes(compactTerm) ||
        tokens.email.includes(term)
      );
    });
  }, [initialData.clients, searchTerm]);

  const handleOpenCreate = () => {
    setMode("create");
    setSelectedClient(null);
    setMessage(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setMode("edit");
    setSelectedClient(client);
    setMessage(null);
    form.reset({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone ?? "",
      email: client.email ?? "",
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setMode("create");
    setSelectedClient(null);
    setMessage(null);
    form.reset(defaultValues);
  };

  const handleSubmit = (values: ClientFormValues) => {
    setMessage(null);
    startTransition(() => {
      const firstName = values.first_name.trim();
      const lastName = values.last_name.trim();
      const phone = values.phone?.trim() ?? "";
      const email = values.email?.trim().toLowerCase() ?? "";

      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone: phone.length > 0 ? phone : null,
        email: email.length > 0 ? email : null,
      };

      if (mode === "edit" && !selectedClient) {
        setMessage("Vyberte klienta na úpravu");
        return;
      }

      const actionPromise = mode === "create"
        ? createClient(payload)
        : updateClient({ ...payload, id: selectedClient!.id });

      actionPromise.then((result) => {
        if (result.success) {
          handleCloseDialog();
          setMessage(result.message);
          router.refresh();
          return;
        }
        setMessage(result.message);
      });
    });
  };

  const handleDelete = (client: Client) => {
    const confirmation = window.confirm(`Vymazať klienta ${client.first_name} ${client.last_name}?`);
    if (!confirmation) {
      return;
    }
    setMessage(null);
    startTransition(() => {
      deleteClient({ id: client.id }).then((result) => {
        setMessage(result.message);
        if (result.success) {
          router.refresh();
        }
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Klienti</h2>
          <p className="text-sm text-muted-foreground">
            Spravujte klientov podľa spoločnosti a udržiavajte kontakty aktuálne.
          </p>
        </div>
        <Button type="button" onClick={handleOpenCreate} disabled={isPending}>
          Nový klient
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Zoznam klientov</CardTitle>
            <CardDescription>Vyhľadávajte podľa mena alebo telefónneho čísla.</CardDescription>
          </div>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Hľadať klienta..."
            className="max-w-md"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredClients.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              Žiadni klienti nezodpovedajú vyhľadávaniu.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => {
                const hasPhone = !!client.phone;
                const hasEmail = !!client.email;
                return (
                  <div
                    key={client.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {client.first_name} {client.last_name}
                      </p>
                      {hasPhone || hasEmail ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {hasPhone ? <span>{client.phone}</span> : null}
                          {hasPhone && hasEmail ? <span>•</span> : null}
                          {hasEmail ? <span>{client.email}</span> : null}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Bez kontaktných údajov</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={() => handleOpenEdit(client)}
                        disabled={isPending}
                      >
                        Upraviť
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        type="button"
                        onClick={() => handleDelete(client)}
                        disabled={isPending}
                      >
                        Vymazať
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setDialogOpen(true);
            return;
          }
          handleCloseDialog();
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Nový klient" : "Upraviť klienta"}</DialogTitle>
            <DialogDescription>
              Vyplňte kontaktné údaje klienta. Údaje sa použijú v rámci vašej spoločnosti.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meno</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Jana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priezvisko</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Nováková" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefón (voliteľné)</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. +421 900 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (voliteľné)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Napr. klient@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={handleCloseDialog} disabled={isPending}>
                  Zrušiť
                </Button>
                <Button type="submit" disabled={isPending || (mode === "edit" && !selectedClient)}>
                  {isPending ? "Ukladám..." : mode === "create" ? "Pridať" : "Uložiť"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
