"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function ClientsManager({ initialData }: ClientsManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
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
    setSheetOpen(true);
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
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
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
          handleCloseSheet();
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Klienti</h2>
          <p className="text-sm text-muted-foreground">
            Spravujte databázu klientov a ich kontaktné údaje.
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Nový klient
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Hľadať..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] pl-4">Avatar</TableHead>
                  <TableHead>Meno</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead className="text-right pr-4">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Žiadni klienti nezodpovedajú hľadaniu.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="pl-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(client.first_name, client.last_name)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {client.first_name} {client.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-muted-foreground">
                          {client.email && <span>{client.email}</span>}
                          {client.phone && <span>{client.phone}</span>}
                          {!client.email && !client.phone && <span className="italic">Bez kontaktu</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(client)}
                            disabled={isPending}
                            title="Upraviť"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Upraviť</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(client)}
                            disabled={isPending}
                            title="Vymazať"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Vymazať</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {message && (
             <div className="m-4 p-3 rounded-md bg-muted text-sm text-muted-foreground text-center">
               {message}
             </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (open) {
            setSheetOpen(true);
          } else {
            handleCloseSheet();
          }
        }}
      >
        <SheetContent className="flex flex-col gap-6 sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle>{mode === "create" ? "Nový klient" : "Upraviť klienta"}</SheetTitle>
            <SheetDescription>
              {mode === "create"
                ? "Pridajte nového klienta do vašej databázy."
                : "Aktualizujte údaje existujúceho klienta."}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 flex-1">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meno</FormLabel>
                    <FormControl>
                      <Input placeholder="Jana" {...field} />
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
                      <Input placeholder="Nováková" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jana@example.com" {...field} />
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
                    <FormLabel>Telefón</FormLabel>
                    <FormControl>
                      <Input placeholder="+421 900 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex-1" />
              <div className="flex gap-3 pt-6 border-t mt-auto">
                <Button type="button" variant="outline" onClick={handleCloseSheet} disabled={isPending} className="flex-1">
                  Zrušiť
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Ukladám..." : "Uložiť"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
