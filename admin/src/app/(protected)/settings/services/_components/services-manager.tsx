"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  createAddon,
  createCategory,
  createService,
  deleteAddon,
  deleteCategory,
  deleteService,
  setServiceAddons,
  updateAddon,
  updateCategory,
  updateService,
} from "../actions";
import { priceTypes, type Addon, type Service, type ServiceAddonLink, type ServiceCategory } from "../types";

type ServicesManagerProps = {
  initialData: {
    services: Service[];
    categories: ServiceCategory[];
    addons: Addon[];
    serviceAddons: ServiceAddonLink[];
  };
};

const categoryFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be zero or higher"),
  price_type: z.enum(priceTypes),
  duration: z
    .coerce
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(55, "Duration must be at most 55 minutes")
    .refine((value) => value % 5 === 0, "Duration must be in 5-minute steps"),
  service_category_id: z.string().uuid().optional().or(z.literal("")),
  is_mobile: z.boolean().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const defaultServiceValues: ServiceFormValues = {
  name: "",
  price: 0,
  price_type: "fixed",
  duration: 30,
  service_category_id: "",
  is_mobile: false,
};

const addonFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be zero or higher"),
  duration: z
    .coerce
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(55, "Duration must be at most 55 minutes")
    .refine((value) => value % 5 === 0, "Duration must be in 5-minute steps"),
  description: z.string().max(500, "Keep it short").optional().nullable(),
});

type AddonFormValues = z.infer<typeof addonFormSchema>;

const defaultAddonValues: AddonFormValues = {
  name: "",
  price: 0,
  duration: 10,
  description: null,
};

const durationOptions = Array.from({ length: 11 }, (_, index) => (index + 1) * 5);

function buildServiceAddonMap(links: ServiceAddonLink[]) {
  return links.reduce<Record<string, string[]>>((acc, link) => {
    const current = acc[link.service_id] ?? [];
    acc[link.service_id] = [...current, link.addon_id];
    return acc;
  }, {});
}

export function ServicesManager({ initialData }: ServicesManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"categories" | "services" | "addons">("categories");

  const [isCategoryPending, startCategoryTransition] = useTransition();
  const [isServicePending, startServiceTransition] = useTransition();
  const [isAddonPending, startAddonTransition] = useTransition();
  const [pendingAddonServiceId, setPendingAddonServiceId] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [addonMessage, setAddonMessage] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { id: undefined, name: "" },
  });

  const serviceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: defaultServiceValues,
  });

  const addonForm = useForm<AddonFormValues>({
    resolver: zodResolver(addonFormSchema),
    defaultValues: defaultAddonValues,
  });

  const serviceAddonMapFromProps = useMemo(
    () => buildServiceAddonMap(initialData.serviceAddons),
    [initialData.serviceAddons],
  );
  const [serviceAddonMap, setServiceAddonMap] = useState<Record<string, string[]>>(serviceAddonMapFromProps);

  useEffect(() => {
    setServiceAddonMap(serviceAddonMapFromProps);
  }, [serviceAddonMapFromProps]);

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    categoryForm.reset({ id: undefined, name: "" });
  };

  const closeServiceModal = () => {
    setServiceModalOpen(false);
    serviceForm.reset(defaultServiceValues);
  };

  const closeAddonModal = () => {
    setAddonModalOpen(false);
    addonForm.reset(defaultAddonValues);
  };

  const handleCategorySubmit = (values: CategoryFormValues) => {
    setCategoryMessage(null);
    startCategoryTransition(() => {
      const action = values.id ? updateCategory : createCategory;
      action(values).then((result) => {
        setCategoryMessage(result.message);
        if (result.success) {
          closeCategoryModal();
          router.refresh();
        }
      });
    });
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryMessage(null);
    startCategoryTransition(() => {
      deleteCategory({ id }).then((result) => {
        setCategoryMessage(result.message);
        if (result.success) {
          router.refresh();
        }
      });
    });
  };

  const handleServiceSubmit = (values: ServiceFormValues) => {
    setServiceMessage(null);
    startServiceTransition(() => {
      const payload = {
        ...values,
        service_category_id: values.service_category_id ? values.service_category_id : null,
        is_mobile: values.is_mobile ?? false,
      };
      const action = values.id ? updateService : createService;
      action(payload).then((result) => {
        setServiceMessage(result.message);
        if (result.success) {
          closeServiceModal();
          router.refresh();
        }
      });
    });
  };

  const handleDeleteService = (id: string) => {
    setServiceMessage(null);
    startServiceTransition(() => {
      deleteService({ id }).then((result) => {
        setServiceMessage(result.message);
        if (result.success) {
          router.refresh();
        }
      });
    });
  };

  const handleAddonSubmit = (values: AddonFormValues) => {
    setAddonMessage(null);
    startAddonTransition(() => {
      const description = values.description?.trim() ?? "";
      const payload = {
        ...values,
        description: description.length > 0 ? description : null,
      };
      const action = values.id ? updateAddon : createAddon;
      action(payload).then((result) => {
        setAddonMessage(result.message);
        if (result.success) {
          closeAddonModal();
          router.refresh();
        }
      });
    });
  };

  const handleDeleteAddon = (id: string) => {
    setAddonMessage(null);
    startAddonTransition(() => {
      deleteAddon({ id }).then((result) => {
        setAddonMessage(result.message);
        if (result.success) {
          router.refresh();
        }
      });
    });
  };

  const handleToggleServiceAddon = (serviceId: string, addonId: string, checked: boolean) => {
    const current = serviceAddonMap[serviceId] ?? [];
    const next = checked
      ? Array.from(new Set([...current, addonId]))
      : current.filter((id) => id !== addonId);
    setServiceAddonMap((prev) => ({ ...prev, [serviceId]: next }));
    setPendingAddonServiceId(serviceId);
    startAddonTransition(() => {
      setServiceAddons({ serviceId, addonIds: next }).then((result) => {
        setAddonMessage(result.message);
        setPendingAddonServiceId(null);
        if (result.success) {
          router.refresh();
        } else {
          setServiceAddonMap((prev) => ({ ...prev, [serviceId]: current }));
        }
      });
    });
  };

  const renderTabs = () => (
    <div className="flex flex-wrap items-center gap-2">
      {[
        { key: "categories", label: "Category" },
        { key: "services", label: "Services" },
        { key: "addons", label: "Addons" },
      ].map((tab) => (
        <Button
          key={tab.key}
          variant={activeTab === tab.key ? "default" : "secondary"}
          size="sm"
          type="button"
          onClick={() => setActiveTab(tab.key as typeof activeTab)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );

  const renderCategoryTab = () => (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Kategórie</CardTitle>
          <CardDescription>Skupiny služieb, ktoré klientom pomáhajú orientovať sa.</CardDescription>
        </div>
        <Button type="button" onClick={() => setCategoryModalOpen(true)}>
          Nová kategória
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {initialData.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatiaľ žiadne kategórie.</p>
        ) : (
          <div className="space-y-2">
            {initialData.categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">Služby zostanú zachované aj po úprave názvu.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      categoryForm.reset({ id: category.id, name: category.name });
                      setCategoryModalOpen(true);
                    }}
                    disabled={isCategoryPending}
                  >
                    Upraviť
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={isCategoryPending}
                  >
                    Vymazať
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {categoryMessage ? <p className="text-sm text-muted-foreground">{categoryMessage}</p> : null}
      </CardContent>
    </Card>
  );

  const renderServicesTab = () => (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Služby</CardTitle>
          <CardDescription>Definujte cenu, dĺžku trvania a viditeľnosť.</CardDescription>
        </div>
        <Button type="button" onClick={() => setServiceModalOpen(true)}>
          Nová služba
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialData.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatiaľ žiadne služby. Pridajte prvú.</p>
        ) : (
          <div className="space-y-2">
            {initialData.services.map((service) => {
              const categoryName = initialData.categories.find((c) => c.id === service.service_category_id)?.name;
              return (
                <div
                  key={service.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>{service.name}</span>
                      {service.is_mobile ? (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-900">
                          Mobilné
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoryName ? `${categoryName} • ` : ""}
                      {service.duration} min • {service.price_type === "free"
                        ? "Zdarma"
                        : service.price_type === "dont_show"
                          ? "Cena sa nezobrazuje"
                          : service.price_type === "starts_at"
                            ? `Od ${service.price.toFixed(2)} €`
                            : `${service.price.toFixed(2)} €`}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        serviceForm.reset({
                          id: service.id,
                          name: service.name,
                          price: service.price,
                          price_type: service.price_type,
                          duration: service.duration,
                          service_category_id: service.service_category_id ?? "",
                          is_mobile: service.is_mobile,
                        });
                        setServiceModalOpen(true);
                      }}
                      disabled={isServicePending}
                    >
                      Upraviť
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                      disabled={isServicePending}
                    >
                      Vymazať
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {serviceMessage ? <p className="text-sm text-muted-foreground">{serviceMessage}</p> : null}
      </CardContent>
    </Card>
  );

  const renderAddonsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Doplnky</CardTitle>
            <CardDescription>Krátke doplnky k hlavným službám.</CardDescription>
          </div>
          <Button type="button" onClick={() => setAddonModalOpen(true)}>
            Nový doplnok
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialData.addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zatiaľ žiadne doplnkové služby.</p>
          ) : (
            <div className="space-y-2">
              {initialData.addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">{addon.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {addon.duration} min • {addon.price.toFixed(2)} €
                      {addon.description ? ` • ${addon.description}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        addonForm.reset({
                          id: addon.id,
                          name: addon.name,
                          price: addon.price,
                          duration: addon.duration,
                          description: addon.description ?? null,
                        });
                        setAddonModalOpen(true);
                      }}
                      disabled={isAddonPending}
                    >
                      Upraviť
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      type="button"
                      onClick={() => handleDeleteAddon(addon.id)}
                      disabled={isAddonPending}
                    >
                      Vymazať
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {addonMessage ? <p className="text-sm text-muted-foreground">{addonMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priradenie doplnkov k službám</CardTitle>
          <CardDescription>
            Vyberte, ktoré doplnky sú dostupné pri konkrétnej službe. Klienti ich uvidia pri rezervácii.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialData.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Najprv pridajte aspoň jednu službu.</p>
          ) : initialData.addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Najprv vytvorte doplnky, ktoré chcete priradiť.</p>
          ) : (
            <div className="space-y-3">
              {initialData.services.map((service) => (
                <div
                  key={service.id}
                  className="space-y-3 rounded-lg border border-border/60 bg-card p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{service.name}</span>
                      <span className="text-xs text-muted-foreground">{service.duration} min</span>
                    </div>
                    {pendingAddonServiceId === service.id ? (
                      <span className="text-xs text-purple-900">Ukladám zmeny...</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {initialData.addons.map((addon) => {
                      const checked = serviceAddonMap[service.id]?.includes(addon.id) ?? false;
                      return (
                        <label
                          key={addon.id}
                          className="flex items-center gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2 text-sm text-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleToggleServiceAddon(service.id, addon.id, e.target.checked)}
                            disabled={pendingAddonServiceId === service.id}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                          />
                          <span>{addon.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {addonMessage ? <p className="text-sm text-muted-foreground">{addonMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Services</h2>
          <p className="text-sm text-muted-foreground">Spravujte kategórie, služby a doplnky vo firemnom kontexte.</p>
        </div>
        {renderTabs()}
      </div>

      {activeTab === "categories" ? renderCategoryTab() : null}
      {activeTab === "services" ? renderServicesTab() : null}
      {activeTab === "addons" ? renderAddonsTab() : null}

      <Dialog
        open={categoryModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setCategoryModalOpen(true);
            return;
          }
          closeCategoryModal();
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{categoryForm.getValues("id") ? "Upraviť kategóriu" : "Nová kategória"}</DialogTitle>
            <DialogDescription>
              Pomenujte kategóriu tak, aby klienti rozumeli ponuke.
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form className="space-y-4" onSubmit={categoryForm.handleSubmit(handleCategorySubmit)}>
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Názov kategórie</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Masáže" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={closeCategoryModal}>
                  Zrušiť
                </Button>
                <Button type="submit" disabled={isCategoryPending}>
                  {isCategoryPending ? "Ukladám..." : categoryForm.getValues("id") ? "Uložiť" : "Pridať"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={serviceModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setServiceModalOpen(true);
            return;
          }
          closeServiceModal();
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{serviceForm.getValues("id") ? "Upraviť službu" : "Nová služba"}</DialogTitle>
            <DialogDescription>
              Nastavte parametre, ktoré uvidí klient pri rezervácii.
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form className="space-y-4" onSubmit={serviceForm.handleSubmit(handleServiceSubmit)}>
              <FormField
                control={serviceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Názov služby</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Švédska masáž" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={serviceForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="duration"
                  render={({ field }) => {
                    const selectedValue = Number(field.value ?? durationOptions[0]);
                    const hasCustomValue = !durationOptions.includes(selectedValue);
                    return (
                      <FormItem>
                        <FormLabel>Trvanie (min)</FormLabel>
                        <FormControl>
                          <select
                            value={selectedValue}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                          >
                            {durationOptions.map((minutes) => (
                              <option key={minutes} value={minutes}>{`${minutes} min`}</option>
                            ))}
                            {hasCustomValue ? (
                              <option value={selectedValue}>{`${selectedValue} min`}</option>
                            ) : null}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={serviceForm.control}
                  name="price_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ ceny</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        >
                          {priceTypes.map((type) => (
                            <option key={type} value={type}>
                              {type === "fixed"
                                ? "Pevná"
                                : type === "free"
                                  ? "Zdarma"
                                  : type === "dont_show"
                                    ? "Nezobrazovať"
                                    : "Od ceny"}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={serviceForm.control}
                  name="service_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategória</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        >
                          <option value="">Bez kategórie</option>
                          {initialData.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={serviceForm.control}
                name="is_mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobilná služba</FormLabel>
                    <FormControl>
                      <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                        />
                        <span>Možné vykonať u klienta</span>
                      </label>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={closeServiceModal}>
                  Zrušiť
                </Button>
                <Button type="submit" disabled={isServicePending}>
                  {isServicePending ? "Ukladám..." : serviceForm.getValues("id") ? "Uložiť" : "Pridať"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addonModalOpen}
        onOpenChange={(open) => {
          if (open) {
            setAddonModalOpen(true);
            return;
          }
          closeAddonModal();
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{addonForm.getValues("id") ? "Upraviť doplnok" : "Nový doplnok"}</DialogTitle>
            <DialogDescription>Krátke doplnky k hlavným službám.</DialogDescription>
          </DialogHeader>
          <Form {...addonForm}>
            <form className="space-y-4" onSubmit={addonForm.handleSubmit(handleAddonSubmit)}>
              <FormField
                control={addonForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Názov doplnku</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Horúci zábal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={addonForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cena</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addonForm.control}
                  name="duration"
                  render={({ field }) => {
                    const selectedValue = Number(field.value ?? durationOptions[0]);
                    const hasCustomValue = !durationOptions.includes(selectedValue);
                    return (
                      <FormItem>
                        <FormLabel>Trvanie (min)</FormLabel>
                        <FormControl>
                          <select
                            value={selectedValue}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                          >
                            {durationOptions.map((minutes) => (
                              <option key={minutes} value={minutes}>{`${minutes} min`}</option>
                            ))}
                            {hasCustomValue ? (
                              <option value={selectedValue}>{`${selectedValue} min`}</option>
                            ) : null}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              <FormField
                control={addonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Popis (voliteľné)</FormLabel>
                    <FormControl>
                      <textarea
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        placeholder="Krátky popis doplnku pre klientov"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={closeAddonModal}>
                  Zrušiť
                </Button>
                <Button type="submit" disabled={isAddonPending}>
                  {isAddonPending ? "Ukladám..." : addonForm.getValues("id") ? "Uložiť" : "Pridať"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
