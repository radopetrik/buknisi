"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { createStaff, updateStaff } from "../actions";
import { staffRoles, type ServiceSummary, type Staff, type StaffServiceLink } from "../types";

type StaffManagerProps = {
  initialData: {
    staff: Staff[];
    services: ServiceSummary[];
    staffServices: StaffServiceLink[];
  };
};

const staffFormSchema = z.object({
  full_name: z.string().min(1, "Meno je povinné").max(160, "Maximálne 160 znakov"),
  role: z.enum(staffRoles),
  position: z.string().max(160, "Maximálne 160 znakov").optional(),
  available_for_booking: z.boolean().default(true),
  description: z.string().max(800, "Skráťte popis").optional(),
  serviceIds: z.array(z.string().uuid()).default([]),
});

const defaultValues = {
  full_name: "",
  role: staffRoles[0],
  position: "",
  available_for_booking: true,
  description: "",
  serviceIds: [] as string[],
};

function buildStaffServiceMap(links: StaffServiceLink[]) {
  return links.reduce<Record<string, string[]>>((acc, link) => {
    const current = acc[link.staff_id] ?? [];
    acc[link.staff_id] = [...current, link.service_id];
    return acc;
  }, {});
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StaffManager({ initialData }: StaffManagerProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [sheetMode, setSheetMode] = useState<"edit" | "create">("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isCreateMode = sheetMode === "create";

  const staffServiceMap = useMemo(() => buildStaffServiceMap(initialData.staffServices), [initialData.staffServices]);

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues,
  });

  const selectedServiceIds = form.watch("serviceIds") ?? [];

  const handleOpenStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setSheetMode("edit");
    setMessage(null);
    form.reset({
      full_name: staff.full_name,
      role: staff.role,
      position: staff.position ?? "",
      available_for_booking: staff.available_for_booking,
      description: staff.description ?? "",
      serviceIds: staffServiceMap[staff.id] ?? [],
    });
    setSheetOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setSheetMode("create");
    setMessage(null);
    form.reset(defaultValues);
    setSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setSelectedStaff(null);
    setSheetMode("edit");
    setMessage(null);
    form.reset(defaultValues);
  };

  const handleSubmit = (values: z.infer<typeof staffFormSchema>) => {
    setMessage(null);
    startTransition(() => {
      const basePayload = {
        ...values,
        position: values.position?.trim() || null,
        description: values.description?.trim() || null,
        serviceIds: Array.from(new Set(values.serviceIds ?? [])),
      };

      if (!isCreateMode && !selectedStaff?.id) {
        setMessage("Vyberte člena na úpravu");
        return;
      }

      const actionPromise = isCreateMode
        ? createStaff(basePayload)
        : updateStaff({ ...basePayload, id: selectedStaff!.id });

      actionPromise.then((result) => {
        setMessage(result.message);
        if (result.success) {
          handleCloseSheet();
          router.refresh();
        }
      });
    });
  };

  const toggleService = (serviceId: string, checked: boolean) => {
    const current = form.getValues("serviceIds") ?? [];
    const next = checked ? Array.from(new Set([...current, serviceId])) : current.filter((id) => id !== serviceId);
    form.setValue("serviceIds", next, { shouldDirty: true });
  };

  const roleLabel = (role: string) => {
    if (role === "manager") return "Manažér";
    if (role === "reception") return "Recepcia";
    if (role === "staffer") return "Personál";
    return "Základný";
  };

  const sheetTitle = isCreateMode ? "Nový člen personálu" : "Upraviť personál";
  const sheetDescription = isCreateMode
    ? "Vyplňte detaily nového člena tímu."
    : "Aktualizujte informácie a priraďte služby.";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Personál</h2>
          <p className="text-sm text-muted-foreground">
             Správa členov tímu a priraďovanie služieb.
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Pridať člena
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] pl-4">Avatar</TableHead>
                  <TableHead>Meno & Pozícia</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Služby</TableHead>
                  <TableHead className="text-right pr-4">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Zatiaľ žiadni členovia personálu.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialData.staff.map((staff) => {
                     const assignedServicesCount = (staffServiceMap[staff.id] ?? []).length;
                     return (
                      <TableRow key={staff.id}>
                        <TableCell className="pl-4">
                           <Avatar>
                              <AvatarFallback>{getInitials(staff.full_name)}</AvatarFallback>
                           </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{staff.full_name}</span>
                            {staff.position && (
                              <span className="text-xs text-muted-foreground">{staff.position}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="outline">{roleLabel(staff.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          {staff.available_for_booking ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-transparent">
                               Dostupný
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-transparent">
                               Skrytý
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{assignedServicesCount} služieb</span>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenStaff(staff)}
                              disabled={isPending}
                              title="Upraviť"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Upraviť</span>
                            </Button>
                        </TableCell>
                      </TableRow>
                     )
                  })
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : handleCloseSheet())}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden sm:max-w-xl p-0">
          <div className="px-6 pt-6">
            <SheetHeader>
               <SheetTitle>{sheetTitle}</SheetTitle>
               <SheetDescription>{sheetDescription}</SheetDescription>
            </SheetHeader>
          </div>
          
          <Form {...form}>
            <form className="flex-1 flex flex-col min-h-0" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meno a priezvisko</FormLabel>
                      <FormControl>
                        <Input placeholder="Napr. Jana Nováková" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rola</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            {staffRoles.map((role) => (
                              <option key={role} value={role}>
                                {roleLabel(role)}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pozícia (voliteľné)</FormLabel>
                        <FormControl>
                          <Input placeholder="Napr. Senior stylist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Popis (voliteľné)</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Krátky bio alebo špecializácia"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="available_for_booking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Viditeľnosť v bookingu</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Povoliť klientom rezervovať tohto člena tímu online.
                        </div>
                      </div>
                      <FormControl>
                         <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                         </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium leading-none">Priradené služby</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vyberte služby, ktoré tento člen tímu vykonáva.
                    </p>
                  </div>
                  {initialData.services.length === 0 ? (
                    <div className="flex items-center justify-center p-4 border border-dashed rounded-md bg-muted/50">
                       <p className="text-sm text-muted-foreground">Najprv pridajte služby v nastaveniach.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {initialData.services.map((service) => {
                        const checked = selectedServiceIds.includes(service.id);
                        return (
                          <div
                            key={service.id}
                            className={cn(
                               "flex items-start space-x-3 rounded-md border p-3 transition-colors hover:bg-accent hover:text-accent-foreground",
                               checked ? "border-primary bg-primary/5" : "bg-card"
                            )}
                          >
                             <div className="flex h-5 items-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => toggleService(service.id, event.target.checked)}
                                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                  disabled={isPending}
                                />
                             </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.duration} min</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t bg-background p-6">
                {message && <p className="mb-4 text-sm text-destructive">{message}</p>}
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseSheet} disabled={isPending}>
                    Zrušiť
                  </Button>
                  <Button type="submit" disabled={isPending || (!isCreateMode && !selectedStaff?.id)}>
                    {isPending ? "Ukladám..." : "Uložiť zmeny"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
