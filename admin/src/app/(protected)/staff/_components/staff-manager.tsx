"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Clock, User as UserIcon, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { createStaff, updateStaff, updateStaffWorkingHours, createStaffTimeOff, deleteStaffTimeOff, updateStaffServices } from "../actions";
import { StaffAvatarManager } from "./staff-avatar-manager";
import {
  staffRoles,
  type ServiceSummary,
  type Staff,
  type StaffServiceLink,
  type StaffWorkingHour,
  type StaffTimeOff,
  type DayOfWeek,
  timeOffReasons,
} from "../types";

type StaffManagerProps = {
  initialData: {
    staff: Staff[];
    services: ServiceSummary[];
    staffServices: StaffServiceLink[];
    workingHours: StaffWorkingHour[];
    timeOffs: StaffTimeOff[];
  };
};

const staffFormSchema = z.object({
  full_name: z.string().min(1, "Meno je povinné").max(160, "Maximálne 160 znakov"),
  role: z.enum(staffRoles),
  position: z.string().max(160, "Maximálne 160 znakov").optional(),
  email: z.string().email("Neplatný email").optional().or(z.literal("")),
  phone: z.string().max(20, "Telefónne číslo je príliš dlhé").optional().or(z.literal("")),
  available_for_booking: z.boolean().default(true),
  description: z.string().max(800, "Skráťte popis").optional(),
  serviceIds: z.array(z.string().uuid()).default([]),
});

const defaultValues = {
  full_name: "",
  role: staffRoles[0],
  position: "",
  email: "",
  phone: "",
  available_for_booking: true,
  description: "",
  serviceIds: [] as string[],
};

const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Pondelok" },
  { value: "tuesday", label: "Utorok" },
  { value: "wednesday", label: "Streda" },
  { value: "thursday", label: "Štvrtok" },
  { value: "friday", label: "Piatok" },
  { value: "saturday", label: "Sobota" },
  { value: "sunday", label: "Nedeľa" },
];

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
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedStaff = useMemo(
    () => initialData.staff.find((s) => s.id === selectedStaffId) ?? null,
    [initialData.staff, selectedStaffId]
  );

  const staffServiceMap = useMemo(() => buildStaffServiceMap(initialData.staffServices), [initialData.staffServices]);

  const handleSelectStaff = (staff: Staff) => {
    setSelectedStaffId(staff.id);
    setIsCreating(false);
    setMessage(null);
  };

  const handleCreateNew = () => {
    setSelectedStaffId(null);
    setIsCreating(true);
    setMessage(null);
  };

  const handleSuccess = (newStaff?: Staff) => {
    // If create, we'll have a new staff object.
    // We update the ID, and when router.refresh() finishes, selectedStaff will be populated.
    if (newStaff) {
      setSelectedStaffId(newStaff.id);
      setIsCreating(false);
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))] gap-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personál</h2>
          <p className="text-sm text-muted-foreground">Správa členov tímu, služieb a pracovnej doby.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden items-start">
        {/* Left Column: List */}
        <Card className="w-[300px] flex-none flex flex-col h-full overflow-hidden">
          <CardHeader className="py-4 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Zoznam zamestnancov</CardTitle>
              <Button size="sm" variant="outline" onClick={handleCreateNew} disabled={isCreating && !selectedStaff}>
                <Plus className="h-4 w-4 mr-2" />
                Nový
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
            {initialData.staff.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">Žiadni zamestnanci</div>
            )}
            {initialData.staff.map((staff) => (
              <div
                key={staff.id}
                onClick={() => handleSelectStaff(staff)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                  selectedStaffId === staff.id ? "bg-muted shadow-sm ring-1 ring-border" : "border border-transparent"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={staff.photo || ""} className="object-cover" />
                  <AvatarFallback>{getInitials(staff.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{staff.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{staff.position || staff.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column: Details */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {selectedStaff || isCreating ? (
            <StaffDetailView
              key={selectedStaff?.id ?? "new"}
              staff={selectedStaff}
              isCreating={isCreating}
              initialServices={initialData.services}
              assignedServiceIds={selectedStaff ? staffServiceMap[selectedStaff.id] ?? [] : []}
              workingHours={
                selectedStaff ? initialData.workingHours.filter((wh) => wh.staff_id === selectedStaff.id) : []
              }
              timeOffs={selectedStaff ? initialData.timeOffs.filter((to) => to.staff_id === selectedStaff.id) : []}
              onSuccess={handleSuccess}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border rounded-lg bg-muted/10 border-dashed m-1">
              <UserIcon className="h-12 w-12 mb-4 opacity-20" />
              <p>Vyberte zamestnanca zo zoznamu alebo vytvorte nového.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffDetailView({
  staff,
  isCreating,
  initialServices,
  assignedServiceIds,
  workingHours,
  timeOffs,
  onSuccess,
}: {
  staff: Staff | null;
  isCreating: boolean;
  initialServices: ServiceSummary[];
  assignedServiceIds: string[];
  workingHours: StaffWorkingHour[];
  timeOffs: StaffTimeOff[];
  onSuccess: (staff?: Staff) => void;
}) {
  const [activeTab, setActiveTab] = useState(isCreating ? "profile" : "overview");

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="border-b py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isCreating ? "Nový zamestnanec" : staff?.full_name}</CardTitle>
            <CardDescription>{isCreating ? "Vytvorte nový profil" : staff?.position || "Detail profilu"}</CardDescription>
          </div>
          {!isCreating && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="overview">Prehľad</TabsTrigger>
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="services">Služby</TabsTrigger>
                <TabsTrigger value="hours">Pracovná doba</TabsTrigger>
                <TabsTrigger value="timeoff">Voľno</TabsTrigger>
                <TabsTrigger value="avatar">Foto</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6">
        {isCreating ? (
          <StaffProfileForm
            staff={null}
            initialServices={initialServices}
            assignedServiceIds={[]}
            onSuccess={onSuccess}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full space-y-0">
            <TabsContent value="overview" className="h-full m-0">
              {staff && (
                <StaffOverview
                  staff={staff}
                  initialServices={initialServices}
                  assignedServiceIds={assignedServiceIds}
                  workingHours={workingHours}
                  timeOffs={timeOffs}
                  onTabChange={setActiveTab}
                />
              )}
            </TabsContent>
            <TabsContent value="profile" className="h-full m-0">
              <StaffProfileForm
                staff={staff}
                initialServices={initialServices}
                assignedServiceIds={assignedServiceIds}
                onSuccess={onSuccess}
              />
            </TabsContent>
            <TabsContent value="services" className="h-full m-0">
              {staff && (
                <ServicesManager
                  staff={staff}
                  initialServices={initialServices}
                  assignedServiceIds={assignedServiceIds}
                />
              )}
            </TabsContent>
            <TabsContent value="hours" className="h-full m-0">
              {staff && <WorkingHoursManager staff={staff} initialHours={workingHours} />}
            </TabsContent>
            <TabsContent value="timeoff" className="h-full m-0">
              {staff && <TimeOffManager staff={staff} initialTimeOffs={timeOffs} />}
            </TabsContent>
            <TabsContent value="avatar" className="h-full m-0">
              {staff && <StaffAvatarManager staff={staff} />}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function StaffOverview({
  staff,
  initialServices,
  assignedServiceIds,
  workingHours,
  timeOffs,
  onTabChange,
}: {
  staff: Staff;
  initialServices: ServiceSummary[];
  assignedServiceIds: string[];
  workingHours: StaffWorkingHour[];
  timeOffs: StaffTimeOff[];
  onTabChange: (tab: string) => void;
}) {
  const assignedServices = initialServices.filter((s) => assignedServiceIds.includes(s.id));
  const upcomingTimeOffs = timeOffs
    .filter((to) => new Date(to.day) >= new Date())
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  const daysMap: Record<string, string> = {
    monday: "Pondelok",
    tuesday: "Utorok",
    wednesday: "Streda",
    thursday: "Štvrtok",
    friday: "Piatok",
    saturday: "Sobota",
    sunday: "Nedeľa",
  };

  const sortedHours = workingHours.sort((a, b) => {
    const days = Object.keys(daysMap);
    return days.indexOf(a.day_in_week) - days.indexOf(b.day_in_week);
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              <AvatarImage src={staff.photo || ""} className="object-cover" />
              <AvatarFallback className="text-2xl">{getInitials(staff.full_name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{staff.full_name}</h2>
                  <p className="text-muted-foreground font-medium">{staff.position || "Bez pozície"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onTabChange("profile")}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Upraviť profil
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  {staff.role === "manager"
                    ? "Manažér"
                    : staff.role === "reception"
                    ? "Recepcia"
                    : staff.role === "staffer"
                    ? "Personál"
                    : "Základný"}
                </Badge>
                {staff.available_for_booking ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Dostupný na booking
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Skrytý z bookingu
                  </Badge>
                )}
              </div>

              {staff.description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{staff.description}</p>}

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 mt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{staff.email || "Email nenastavený"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{staff.phone || "Telefón nenastavený"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column: Working Hours (2 cols wide) */}
        <div className="md:col-span-2 flex flex-col h-full">
          <Card className="flex-1">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Pracovná doba</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onTabChange("hours")}>
                Upraviť
              </Button>
            </CardHeader>
            <CardContent>
              {sortedHours.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {sortedHours.map((wh) => (
                    <div
                      key={wh.id}
                      className="flex justify-between items-center text-sm p-3 border rounded-md bg-muted/5 hover:bg-muted/10 transition-colors"
                    >
                      <span className="font-medium">{daysMap[wh.day_in_week]}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {wh.from_time.slice(0, 5)} - {wh.to_time.slice(0, 5)}
                        {wh.break_from_time && (
                          <span className="block text-xs opacity-70 mt-0.5">
                            (Pauza: {wh.break_from_time.slice(0, 5)} - {wh.break_to_time?.slice(0, 5)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border border-dashed rounded-md bg-muted/5">
                  <Clock className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Nie je nastavená žiadna pracovná doba.</p>
                  <Button variant="link" size="sm" onClick={() => onTabChange("hours")} className="mt-2">
                    Nastaviť pracovnú dobu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Column: Services & Time Off (1 col wide) */}
        <div className="space-y-6 flex flex-col">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Služby ({assignedServices.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onTabChange("services")}>
                Spravovať
              </Button>
            </CardHeader>
            <CardContent>
              {assignedServices.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignedServices.map((s) => (
                    <Badge key={s.id} variant="secondary" className="font-normal">
                      {s.name} <span className="text-muted-foreground ml-1 text-xs">({s.duration}m)</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Žiadne priradené služby.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Nadchádzajúce voľno</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onTabChange("timeoff")}>
                Spravovať
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {upcomingTimeOffs.length > 0 ? (
                  upcomingTimeOffs.slice(0, 5).map((to) => (
                    <div
                      key={to.id}
                      className="flex items-start gap-3 text-sm pb-3 border-b last:border-0 last:pb-0"
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-0.5 shrink-0",
                          to.reason === "sick_day"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : to.reason === "vacation"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-gray-200"
                        )}
                      >
                        {to.reason === "sick_day" ? "PN" : to.reason === "vacation" ? "Dov" : "Iné"}
                      </Badge>
                      <div>
                        <p className="font-medium">{new Date(to.day).toLocaleDateString("sk-SK")}</p>
                        <p className="text-xs text-muted-foreground">
                          {to.all_day ? "Celý deň" : `${to.from_time?.slice(0, 5)} - ${to.to_time?.slice(0, 5)}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                     <p className="text-sm text-muted-foreground">Žiadne naplánované voľno.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StaffProfileForm({
  staff,
  initialServices,
  assignedServiceIds,
  onSuccess,
}: {
  staff: Staff | null;
  initialServices: ServiceSummary[];
  assignedServiceIds: string[];
  onSuccess: (staff?: Staff) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: staff
      ? {
          full_name: staff.full_name,
          role: staff.role,
          position: staff.position ?? "",
          email: staff.email ?? "",
          phone: staff.phone ?? "",
          available_for_booking: staff.available_for_booking,
          description: staff.description ?? "",
          serviceIds: assignedServiceIds,
        }
      : defaultValues,
  });

  const selectedServiceIds = form.watch("serviceIds") ?? [];

  const toggleService = (serviceId: string, checked: boolean) => {
    const current = form.getValues("serviceIds") ?? [];
    const next = checked ? Array.from(new Set([...current, serviceId])) : current.filter((id) => id !== serviceId);
    form.setValue("serviceIds", next, { shouldDirty: true });
  };

  const onSubmit = (values: z.infer<typeof staffFormSchema>) => {
    setMessage(null);
    startTransition(() => {
      const basePayload = {
        ...values,
        position: values.position?.trim() || null,
        description: values.description?.trim() || null,
        serviceIds: Array.from(new Set(values.serviceIds ?? [])),
      };

      const actionPromise = !staff
        ? createStaff(basePayload)
        : updateStaff({ ...basePayload, id: staff.id });

      actionPromise.then((result) => {
        setMessage(result.message);
        if (result.success) {
          onSuccess();
        }
      });
    });
  };

  const roleLabel = (role: string) => {
    if (role === "manager") return "Manažér";
    if (role === "reception") return "Recepcia";
    if (role === "staffer") return "Personál";
    return "Základný";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (voliteľné)</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" {...field} />
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
                  <Input placeholder="+421 900 000 000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                <div className="text-sm text-muted-foreground">Povoliť klientom rezervovať tohto člena tímu online.</div>
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

        {!staff && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium leading-none">Priradené služby</h3>
                <p className="text-xs text-muted-foreground mt-1">Vyberte služby, ktoré tento člen tímu vykonáva.</p>
              </div>
              {initialServices.length === 0 ? (
                <div className="flex items-center justify-center p-4 border border-dashed rounded-md bg-muted/50">
                  <p className="text-sm text-muted-foreground">Najprv pridajte služby v nastaveniach.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {initialServices.map((service) => {
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
          </>
        )}

        <div className="pt-4 flex items-center justify-between">
            <span className="text-sm text-destructive font-medium">{message}</span>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Ukladám..." : "Uložiť zmeny"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

function ServicesManager({
  staff,
  initialServices,
  assignedServiceIds,
}: {
  staff: Staff;
  initialServices: ServiceSummary[];
  assignedServiceIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(assignedServiceIds);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const toggleService = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, serviceId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== serviceId));
    }
    setMessage(null);
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(() => {
      updateStaffServices(staff.id, selectedIds).then((res) => {
        setMessage(res.message);
      });
    });
  };

  // Check if there are changes
  const hasChanges =
    selectedIds.length !== assignedServiceIds.length || !selectedIds.every((id) => assignedServiceIds.includes(id));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Spravovanie služieb</h3>
          <p className="text-sm text-muted-foreground">Vyberte služby, ktoré {staff.full_name} vykonáva.</p>
        </div>
        <Button onClick={handleSave} disabled={isPending || !hasChanges}>
          {isPending ? "Ukladám..." : "Uložiť zmeny"}
        </Button>
      </div>

      <Separator />

      {initialServices.length === 0 ? (
        <div className="flex items-center justify-center p-8 border border-dashed rounded-md bg-muted/50">
          <p className="text-muted-foreground">Najprv pridajte služby v sekcii Nastavenia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialServices.map((service) => {
            const checked = selectedIds.includes(service.id);
            return (
              <div
                key={service.id}
                className={cn(
                  "flex items-start space-x-3 rounded-md border p-4 transition-all cursor-pointer",
                  checked
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "bg-card hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => toggleService(service.id, !checked)}
              >
                <div className="flex h-5 items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleService(service.id, e.target.checked)}
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-primary pointer-events-none"
                    disabled={isPending}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-medium leading-none">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.duration} min</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message && <p className="text-sm font-medium text-destructive text-right">{message}</p>}
    </div>
  );
}

function WorkingHoursManager({ staff, initialHours }: { staff: Staff; initialHours: StaffWorkingHour[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // Transform initialHours to a map for easier access
  const hoursMap = useMemo(() => {
    const map: Record<string, StaffWorkingHour> = {};
    initialHours.forEach((h) => {
      map[h.day_in_week] = h;
    });
    return map;
  }, [initialHours]);

  const [hoursState, setHoursState] = useState<{
    [key in DayOfWeek]: {
      enabled: boolean;
      from: string;
      to: string;
      breakFrom: string;
      breakTo: string;
    };
  }>(() => {
    const state: any = {};
    daysOfWeek.forEach((d) => {
      const existing = hoursMap[d.value];
      state[d.value] = {
        enabled: !!existing,
        from: existing?.from_time?.slice(0, 5) ?? "09:00",
        to: existing?.to_time?.slice(0, 5) ?? "17:00",
        breakFrom: existing?.break_from_time?.slice(0, 5) ?? "",
        breakTo: existing?.break_to_time?.slice(0, 5) ?? "",
      };
    });
    return state;
  });

  const handleChange = (day: DayOfWeek, field: string, value: any) => {
    setHoursState((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(() => {
      const payload = Object.entries(hoursState)
        .filter(([_, val]) => val.enabled)
        .map(([day, val]) => ({
          day_in_week: day as DayOfWeek,
          from_time: val.from,
          to_time: val.to,
          break_from_time: val.breakFrom || null,
          break_to_time: val.breakTo || null,
        }));

      updateStaffWorkingHours(staff.id, payload).then((res) => {
        setMessage(res.message);
        if (res.success) {
           // success
        }
      });
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-[100px_1fr_1fr] gap-4 mb-2 font-medium text-sm text-muted-foreground px-2">
        <div>Deň</div>
        <div>Pracovná doba (Od - Do)</div>
        <div>Pauza (Od - Do)</div>
      </div>
      <div className="space-y-2">
        {daysOfWeek.map((day) => {
          const state = hoursState[day.value];
          return (
            <div key={day.value} className="grid grid-cols-[100px_1fr_1fr] gap-4 items-center p-2 rounded-md border bg-card">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.enabled}
                  onChange={(e) => handleChange(day.value, "enabled", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className={cn("text-sm", !state.enabled && "text-muted-foreground")}>{day.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={state.from}
                  onChange={(e) => handleChange(day.value, "from", e.target.value)}
                  disabled={!state.enabled}
                  className="h-8 w-24"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={state.to}
                  onChange={(e) => handleChange(day.value, "to", e.target.value)}
                  disabled={!state.enabled}
                  className="h-8 w-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={state.breakFrom}
                  onChange={(e) => handleChange(day.value, "breakFrom", e.target.value)}
                  disabled={!state.enabled}
                  className="h-8 w-24"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={state.breakTo}
                  onChange={(e) => handleChange(day.value, "breakTo", e.target.value)}
                  disabled={!state.enabled}
                  className="h-8 w-24"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-4 pt-4">
        {message && <span className="text-sm font-medium">{message}</span>}
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Ukladám..." : "Uložiť pracovnú dobu"}
        </Button>
      </div>
    </div>
  );
}

function TimeOffManager({ staff, initialTimeOffs }: { staff: Staff; initialTimeOffs: StaffTimeOff[] }) {
  const [isPending, startTransition] = useTransition();
  const [newTimeOff, setNewTimeOff] = useState<{
    date: string;
    allDay: boolean;
    from: string;
    to: string;
    reason: string;
  }>({
    date: "",
    allDay: true,
    from: "",
    to: "",
    reason: "vacation",
  });

  const handleAdd = () => {
    if (!newTimeOff.date) return;
    startTransition(() => {
      createStaffTimeOff({
        staff_id: staff.id,
        all_day: newTimeOff.allDay,
        day: newTimeOff.date,
        from_time: newTimeOff.allDay ? null : newTimeOff.from,
        to_time: newTimeOff.allDay ? null : newTimeOff.to,
        reason: newTimeOff.reason,
      }).then((res) => {
        if (res.success) {
          setNewTimeOff({ date: "", allDay: true, from: "", to: "", reason: "vacation" });
        }
      });
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      deleteStaffTimeOff(id);
    });
  };

  const sortedTimeOffs = [...initialTimeOffs].sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
        <h3 className="font-medium text-sm">Pridať nové voľno</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
             <label className="text-xs font-medium">Dátum</label>
             <Input
                type="date"
                value={newTimeOff.date}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, date: e.target.value })}
                className="bg-background"
             />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-medium">Dôvod</label>
             <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newTimeOff.reason}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
              >
                {timeOffReasons.map(r => (
                  <option key={r} value={r}>{r === 'sick_day' ? 'PN' : r === 'vacation' ? 'Dovolenka' : 'Školenie'}</option>
                ))}
              </select>
          </div>
          <div className="flex items-center space-x-2 pb-3">
             <input
                type="checkbox"
                id="allDay"
                checked={newTimeOff.allDay}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, allDay: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
             />
             <label htmlFor="allDay" className="text-sm font-medium leading-none cursor-pointer">Celý deň</label>
          </div>
          {!newTimeOff.allDay && (
             <div className="col-span-1 lg:col-span-2 flex items-center gap-2">
               <div className="space-y-1 flex-1">
                 <label className="text-xs font-medium">Od</label>
                 <Input type="time" value={newTimeOff.from} onChange={(e) => setNewTimeOff({...newTimeOff, from: e.target.value})} className="bg-background" />
               </div>
               <div className="space-y-1 flex-1">
                 <label className="text-xs font-medium">Do</label>
                 <Input type="time" value={newTimeOff.to} onChange={(e) => setNewTimeOff({...newTimeOff, to: e.target.value})} className="bg-background" />
               </div>
             </div>
          )}
          <div className={cn("col-span-1", newTimeOff.allDay && "lg:col-span-2")}>
            <Button onClick={handleAdd} disabled={isPending || !newTimeOff.date} className="w-full">Pridať</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-sm">História a plánované voľno</h3>
        <div className="space-y-2">
          {sortedTimeOffs.length === 0 && <p className="text-sm text-muted-foreground">Žiadne záznamy.</p>}
          {sortedTimeOffs.map((to) => (
            <div key={to.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
               <div className="flex items-center gap-4">
                  <Badge variant={to.reason === 'sick_day' ? 'destructive' : 'default'}>
                    {to.reason === 'sick_day' ? 'PN' : to.reason === 'vacation' ? 'Dovolenka' : 'Školenie'}
                  </Badge>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {new Date(to.day).toLocaleDateString('sk-SK')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {to.all_day ? "Celý deň" : `${to.from_time?.slice(0,5)} - ${to.to_time?.slice(0,5)}`}
                    </span>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => handleDelete(to.id)} disabled={isPending}>
                 <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
               </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
