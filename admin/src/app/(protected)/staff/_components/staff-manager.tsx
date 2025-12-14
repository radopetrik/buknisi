"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Personál</h2>
          <p className="text-sm text-muted-foreground">
            Spravujte členov tímu a priraďte im služby, ktoré poskytujú.
          </p>
        </div>
        <Button type="button" onClick={handleOpenCreate}>
          Pridať člena
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Členovia tímu</CardTitle>
          <CardDescription>Upravte viditeľnosť, rolu a dostupné služby.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {initialData.staff.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Zatiaľ žiadni členovia personálu.</p>
              <Button size="sm" type="button" onClick={handleOpenCreate}>
                Pridať prvého člena
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {initialData.staff.map((staff) => {
                const assignedServices = staffServiceMap[staff.id] ?? [];
                return (
                  <div
                    key={staff.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                        <span>{staff.full_name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {roleLabel(staff.role)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            staff.available_for_booking
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-amber-100 text-amber-900",
                          )}
                        >
                          {staff.available_for_booking ? "Dostupný na booking" : "Skrytý z bookingu"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {staff.position ? `${staff.position} • ` : ""}
                        {assignedServices.length} služieb
                      </div>
                      {staff.description ? (
                        <p className="text-xs text-muted-foreground">{staff.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" type="button" onClick={() => handleOpenStaff(staff)} disabled={isPending}>
                        Upraviť
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : handleCloseSheet())}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden sm:max-w-xl p-6">
          <SheetHeader>
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>{sheetDescription}</SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form className="mt-4 flex h-full flex-col" onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
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
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
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
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
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
                    <FormItem>
                      <FormLabel>Viditeľnosť v bookingu</FormLabel>
                      <FormControl>
                        <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                          />
                          <span>Zobraziť pri rezervácii</span>
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Služby</p>
                    <p className="text-xs text-muted-foreground">Vyberte, ktoré služby tento člen poskytuje.</p>
                  </div>
                  {initialData.services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Najprv pridajte služby v sekcii Nastavenia &gt; Služby.</p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border/60 bg-muted/30 p-2">
                      {initialData.services.map((service) => {
                        const checked = selectedServiceIds.includes(service.id);
                        return (
                          <label
                            key={service.id}
                            className="flex items-center gap-3 rounded-md bg-background px-3 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => toggleService(service.id, event.target.checked)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                              disabled={isPending}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{service.name}</span>
                              <span className="text-xs text-muted-foreground">{service.duration} min</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t bg-background pt-4">
                {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
                <div className="mt-3 flex w-full items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseSheet} disabled={isPending}>
                    Zrušiť
                  </Button>
                  <Button type="submit" disabled={isPending || (!isCreateMode && !selectedStaff?.id)}>
                    {isPending ? "Ukladám..." : "Uložiť"}
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
