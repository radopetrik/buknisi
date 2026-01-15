"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Check,
  Clock,
  Layers,
  LayoutGrid,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
import { priceTypes, type Addon, type Service, type ServiceAddonLink, type ServiceCategory, type SubCategoryOption } from "../types";

type ServicesManagerProps = {
  initialData: {
    services: Service[];
    categories: ServiceCategory[];
    subCategories: SubCategoryOption[];
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
  sub_category_id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be zero or higher"),
  price_type: z.enum(priceTypes),
  duration: z
    .coerce
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(180, "Duration must be at most 180 minutes")
    .refine((value) => value % 5 === 0, "Duration must be in 5-minute steps"),
  service_category_id: z.string().uuid().optional().or(z.literal("")),
  is_mobile: z.boolean().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const defaultServiceValues: ServiceFormValues = {
  sub_category_id: "",
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
    .max(120, "Duration must be at most 120 minutes")
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

const durationOptions = Array.from({ length: 24 }, (_, index) => (index + 1) * 5);

function buildServiceAddonMap(links: ServiceAddonLink[]) {
  return links.reduce<Record<string, string[]>>((acc, link) => {
    const current = acc[link.service_id] ?? [];
    acc[link.service_id] = [...current, link.addon_id];
    return acc;
  }, {});
}

export function ServicesManager({ initialData }: ServicesManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"categories" | "services" | "addons">("services");

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
    resolver: zodResolver(serviceFormSchema) as Resolver<ServiceFormValues>,
    defaultValues: defaultServiceValues,
  });

  const addonForm = useForm<AddonFormValues>({
    resolver: zodResolver(addonFormSchema) as Resolver<AddonFormValues>,
    defaultValues: defaultAddonValues,
  });

  const serviceAddonMapFromProps = useMemo(
    () => buildServiceAddonMap(initialData.serviceAddons),
    [initialData.serviceAddons],
  );
  const [serviceAddonMap, setServiceAddonMap] = useState<Record<string, string[]>>(serviceAddonMapFromProps);

  const subCategoryLabelById = useMemo(() => {
    return initialData.subCategories.reduce<Record<string, string>>((acc, subCategory) => {
      acc[subCategory.id] = subCategory.label;
      return acc;
    }, {});
  }, [initialData.subCategories]);

  const categoryDescId = useId();
  const serviceDescId = useId();
  const addonDescId = useId();

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
        sub_category_id: values.sub_category_id ? values.sub_category_id : null,
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
    <div className="flex w-full max-w-md items-center gap-1 rounded-lg bg-muted p-1">
      {[
        { key: "services", label: "Služby", icon: LayoutGrid },
        { key: "categories", label: "Kategórie", icon: Layers },
        { key: "addons", label: "Doplnky", icon: Plus },
      ].map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => setActiveTab(tab.key as typeof activeTab)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            activeTab === tab.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderCategoryTab = () => (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle>Kategórie</CardTitle>
          <CardDescription>Skupiny služieb pre lepšiu orientáciu klientov.</CardDescription>
        </div>
        <Button onClick={() => setCategoryModalOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nová kategória
        </Button>
      </CardHeader>
      <CardContent>
        {initialData.categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <Layers className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">Zatiaľ žiadne kategórie</p>
            <Button variant="link" onClick={() => setCategoryModalOpen(true)} className="mt-1 h-auto p-0">
              Vytvoriť prvú
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialData.categories.map((category) => (
              <div
                key={category.id}
                className="group relative flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      categoryForm.reset({ id: category.id, name: category.name });
                      setCategoryModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Upraviť</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Vymazať</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {categoryMessage ? <p className="mt-4 text-sm text-muted-foreground">{categoryMessage}</p> : null}
      </CardContent>
    </Card>
  );

  const renderServicesTab = () => {
    // Group services by category
    const servicesByCategory = initialData.services.reduce(
      (acc, service) => {
        const catId = service.service_category_id ?? "uncategorized";
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(service);
        return acc;
      },
      {} as Record<string, typeof initialData.services>,
    );

    const sortedCategoryIds = Object.keys(servicesByCategory).sort((a, b) => {
      if (a === "uncategorized") return 1;
      if (b === "uncategorized") return -1;
      const catA = initialData.categories.find((c) => c.id === a)?.name ?? "";
      const catB = initialData.categories.find((c) => c.id === b)?.name ?? "";
      return catA.localeCompare(catB);
    });

    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle>Služby</CardTitle>
            <CardDescription>Definujte ponuku, ceny a trvanie.</CardDescription>
          </div>
          <Button onClick={() => setServiceModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nová služba
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {initialData.services.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">Zatiaľ žiadne služby</p>
              <Button
                variant="link"
                onClick={() => setServiceModalOpen(true)}
                className="mt-1 h-auto p-0"
              >
                Pridať prvú službu
              </Button>
            </div>
          ) : (
            <>
              {sortedCategoryIds.map((catId) => {
                const services = servicesByCategory[catId];
                const category = initialData.categories.find((c) => c.id === catId);
                const title = category ? category.name : "Nezaradené";
                const Icon = category ? Layers : LayoutGrid;

                return (
                  <div key={catId} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">{title}</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="group relative flex flex-col justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium line-clamp-2">{service.name}</div>
                              {service.is_mobile && (
                                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  Mobilné
                                </span>
                              )}
                            </div>
                            {service.sub_category_id ? (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {subCategoryLabelById[service.sub_category_id] ?? "Neznáma kategória"}
                              </div>
                            ) : null}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{service.duration} min</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                <span>
                                  {service.price_type === "free"
                                    ? "Zdarma"
                                    : service.price_type === "dont_show"
                                      ? "Skryté"
                                      : service.price_type === "starts_at"
                                        ? `od ${service.price.toFixed(2)} €`
                                        : `${service.price.toFixed(2)} €`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                serviceForm.reset({
                                  id: service.id,
                                  sub_category_id: service.sub_category_id ?? "",
                                  name: service.name,
                                  price: service.price,
                                  price_type: service.price_type,
                                  duration: service.duration,
                                  service_category_id: service.service_category_id ?? "",
                                  is_mobile: service.is_mobile,
                                });
                                setServiceModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Upraviť</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Vymazať</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {serviceMessage ? <p className="mt-4 text-sm text-muted-foreground">{serviceMessage}</p> : null}
        </CardContent>
      </Card>
    );
  };

  const renderAddonsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle>Doplnky</CardTitle>
            <CardDescription>Extra služby ku hlavným procedúram.</CardDescription>
          </div>
          <Button onClick={() => setAddonModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nový doplnok
          </Button>
        </CardHeader>
        <CardContent>
          {initialData.addons.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
              <Plus className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">Zatiaľ žiadne doplnky</p>
              <Button variant="link" onClick={() => setAddonModalOpen(true)} className="mt-1 h-auto p-0">
                Vytvoriť prvý
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {initialData.addons.map((addon) => (
                <div
                  key={addon.id}
                  className="group relative flex flex-col justify-between rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="font-medium">{addon.name}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{addon.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{addon.price.toFixed(2)} €</span>
                      </div>
                    </div>
                    {addon.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground/80">
                        {addon.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Upraviť</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteAddon(addon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Vymazať</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {addonMessage ? <p className="mt-4 text-sm text-muted-foreground">{addonMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priradenie doplnkov</CardTitle>
          <CardDescription>
            Vyberte, ktoré doplnky sú dostupné pre jednotlivé služby.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {initialData.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Najprv pridajte služby.</p>
          ) : initialData.addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Najprv vytvorte doplnky.</p>
          ) : (
            <div className="grid gap-6">
              {initialData.services.map((service) => (
                <div key={service.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{service.name}</span>
                      <span className="text-xs text-muted-foreground">({service.duration} min)</span>
                    </div>
                    {pendingAddonServiceId === service.id && (
                      <span className="flex items-center gap-1.5 text-xs text-primary animate-pulse">
                        <Layers className="h-3 w-3" /> Ukladám...
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {initialData.addons.map((addon) => {
                      const isChecked = serviceAddonMap[service.id]?.includes(addon.id) ?? false;
                      return (
                        <label
                          key={addon.id}
                          className={cn(
                            "cursor-pointer flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs transition-all hover:bg-muted/50",
                            isChecked
                              ? "border-primary/50 bg-primary/5 text-primary"
                              : "border-border/50 text-muted-foreground",
                          )}
                        >
                          <span className="truncate font-medium">{addon.name}</span>
                          <div
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                              isChecked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30 bg-background",
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={(e) =>
                              handleToggleServiceAddon(service.id, addon.id, e.target.checked)
                            }
                            disabled={pendingAddonServiceId === service.id}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Služby a Cenník</h3>
          <p className="text-sm text-muted-foreground">
            Kompletná správa vašej ponuky pre klientov.
          </p>
        </div>
        {renderTabs()}
      </div>
      <Separator />

      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        {activeTab === "categories" ? renderCategoryTab() : null}
        {activeTab === "services" ? renderServicesTab() : null}
        {activeTab === "addons" ? renderAddonsTab() : null}
      </div>

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
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby={categoryDescId}>
          <DialogHeader>
            <DialogTitle>{categoryForm.getValues("id") ? "Upraviť kategóriu" : "Nová kategória"}</DialogTitle>
            <DialogDescription id={categoryDescId}>
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
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby={serviceDescId}>
          <DialogHeader>
            <DialogTitle>{serviceForm.getValues("id") ? "Upraviť službu" : "Nová služba"}</DialogTitle>
            <DialogDescription id={serviceDescId}>
              Nastavte parametre, ktoré uvidí klient pri rezervácii.
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form className="space-y-4" onSubmit={serviceForm.handleSubmit(handleServiceSubmit)}>
              <FormField
                control={serviceForm.control}
                name="sub_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategória</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      >
                        <option value="">Bez kategórie</option>
                        {initialData.subCategories.map((subCategory) => (
                          <option key={subCategory.id} value={subCategory.id}>
                            {subCategory.label}
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
                      <FormLabel>Kategória služby</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        >
                          <option value="">Bez kategórie služby</option>
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
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby={addonDescId}>
          <DialogHeader>
            <DialogTitle>{addonForm.getValues("id") ? "Upraviť doplnok" : "Nový doplnok"}</DialogTitle>
            <DialogDescription id={addonDescId}>Krátke doplnky k hlavným službám.</DialogDescription>
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
