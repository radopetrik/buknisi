import { Alert, Modal, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Check,
  Plus,
  Tag,
  Puzzle,
  Briefcase,
  Trash2,
  X,
} from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCompany } from "@/hooks/useCompany";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import {
  createAddon,
  createService,
  createServiceCategory,
  deleteAddon,
  deleteService,
  deleteServiceCategory,
  fetchAddons,
  fetchServiceAddonLinks,
  fetchCompanyExtraCategoryIds,
  fetchServiceCategories,
  fetchServices,
  fetchSubCategoriesForCategoryIds,
  priceTypes,
  setAddonServices,
  setServiceAddons,
  updateAddon,
  updateService,
  updateServiceCategory,
  type AddonRow,
  type PriceType,
  type ServiceCategoryRow,
  type ServiceRow,
  type SubCategoryOption,
} from "@/lib/services";

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat("sk-SK", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} €`;
  }
}

function priceTypeLabel(value: PriceType) {
  if (value === "free") return "Zdarma";
  if (value === "dont_show") return "Nezobraziť";
  if (value === "starts_at") return "Od";
  return "Fixná";
}

type TabKey = "services" | "categories" | "addons";

type ServicesSettingsData = {
  services: ServiceRow[];
  categories: ServiceCategoryRow[];
  subCategories: SubCategoryOption[];
  addons: AddonRow[];
  serviceAddonMap: Record<string, string[]>;
};

const categorySchema = z.object({
  name: z.string().trim().min(1, "Zadajte názov"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const addonSchema = z.object({
  name: z.string().trim().min(1, "Zadajte názov"),
  price: z.coerce.number().min(0, "Cena musí byť 0 alebo viac"),
  duration: z
    .coerce
    .number()
    .int()
    .min(0, "Trvanie musí byť 0 alebo viac"),
  description: z.string().max(500, "Popis je príliš dlhý").optional(),
});

type AddonFormData = z.infer<typeof addonSchema>;

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Zadajte názov"),
  price: z.coerce.number().min(0, "Cena musí byť 0 alebo viac"),
  duration: z
    .coerce
    .number()
    .int()
    .min(5, "Trvanie musí byť aspoň 5 min")
    .max(180, "Trvanie môže byť max 180 min")
    .refine((value) => value % 5 === 0, "Trvanie musí byť po 5 min"),
  price_type: z.enum(priceTypes),
  is_mobile: z.boolean().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

function TabButton(props: { active: boolean; label: string; onPress: () => void }) {
  const { active, label, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full border ${
        active ? "bg-black border-black" : "bg-white border-gray-200"
      }`}
    >
      <Text className={`text-sm font-semibold ${active ? "text-white" : "text-gray-700"}`}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  const [activeTab, setActiveTab] = useState<TabKey>("services");

  const servicesQuery = useQuery({
    queryKey: ["settings-services", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const companyId = company!.id as string;

      const [services, categories, addons, extraCategoryIds] = await Promise.all([
        fetchServices(companyId),
        fetchServiceCategories(companyId),
        fetchAddons(companyId),
        fetchCompanyExtraCategoryIds(companyId),
      ]);

      const allowedCategoryIds = Array.from(
        new Set([
          (company as any)?.category_id ?? null,
          ...(extraCategoryIds ?? []),
        ].filter(Boolean))
      ) as string[];

      const subCategories = await fetchSubCategoriesForCategoryIds(allowedCategoryIds);

      const links = await fetchServiceAddonLinks(services.map((service) => service.id));

      const serviceAddonMap = links.reduce<Record<string, string[]>>((acc, link) => {
        const current = acc[link.service_id] ?? [];
        acc[link.service_id] = [...current, link.addon_id];
        return acc;
      }, {});

      return {
        services,
        categories,
        subCategories,
        addons,
        serviceAddonMap,
      } satisfies ServicesSettingsData;
    },
  });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    (servicesQuery.data?.categories ?? []).forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [servicesQuery.data?.categories]);

  const subCategoryLabelById = useMemo(() => {
    const map = new Map<string, string>();
    (servicesQuery.data?.subCategories ?? []).forEach((subCategory) => {
      map.set(subCategory.id, subCategory.label);
    });
    return map;
  }, [servicesQuery.data?.subCategories]);

  const refresh = useCallback(() => servicesQuery.refetch(), [servicesQuery]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["settings-services", company?.id] });
  }, [company?.id, queryClient]);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [serviceCategoryId, setServiceCategoryId] = useState<string | null>(null);
  const [serviceSubCategoryId, setServiceSubCategoryId] = useState<string | null>(null);
  const [serviceAddonIds, setServiceAddonIds] = useState<string[]>([]);
  const [serviceSaving, setServiceSaving] = useState(false);

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 30,
      price_type: "fixed",
      is_mobile: false,
    },
  });

  const openCreateService = () => {
    setEditingService(null);
    setServiceCategoryId(null);
    setServiceSubCategoryId(null);
    setServiceAddonIds([]);
    serviceForm.reset({ name: "", price: 0, duration: 30, price_type: "fixed", is_mobile: false });
    setServiceModalOpen(true);
  };

  const openEditService = (service: ServiceRow) => {
    setEditingService(service);
    setServiceCategoryId(service.service_category_id ?? null);
    setServiceSubCategoryId(service.sub_category_id ?? null);
    setServiceAddonIds(servicesQuery.data?.serviceAddonMap?.[service.id] ?? []);
    serviceForm.reset({
      name: service.name,
      price: service.price,
      duration: service.duration,
      price_type: service.price_type,
      is_mobile: service.is_mobile,
    });
    setServiceModalOpen(true);
  };

  useEffect(() => {
    if (!serviceModalOpen) {
      setServiceSaving(false);
    }
  }, [serviceModalOpen]);

  const toggleServiceAddon = (addonId: string) => {
    setServiceAddonIds((prev) => {
      if (prev.includes(addonId)) return prev.filter((id) => id !== addonId);
      return [...prev, addonId];
    });
  };

  const onSaveService = serviceForm.handleSubmit(async (formData) => {
    if (!company?.id) return;

    setServiceSaving(true);
    try {
      const payload: Omit<ServiceRow, "id"> = {
        name: formData.name,
        price: Number(formData.price),
        duration: Number(formData.duration),
        price_type: formData.price_type,
        is_mobile: formData.is_mobile ?? false,
        service_category_id: serviceCategoryId,
        sub_category_id: serviceSubCategoryId,
      };

      let serviceId = editingService?.id;

      if (serviceId) {
        await updateService({ companyId: company.id, id: serviceId, patch: payload });
      } else {
        const created = await createService(company.id, payload);
        serviceId = created.id;
      }

      await setServiceAddons(serviceId!, serviceAddonIds);

      await invalidate();
      setServiceModalOpen(false);
      Alert.alert("Uložené", "Služba uložená.");
    } catch (error: any) {
      Alert.alert("Chyba", error?.message ?? "Nepodarilo sa uložiť službu.");
    } finally {
      setServiceSaving(false);
    }
  });

  const onDeleteService = (service: ServiceRow) => {
    if (!company?.id) return;

    Alert.alert("Odstrániť", `Naozaj chcete odstrániť službu „${service.name}“?`, [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteService({ companyId: company.id, id: service.id });
            await invalidate();
          } catch (error: any) {
            Alert.alert("Chyba", error?.message ?? "Nepodarilo sa odstrániť službu.");
          }
        },
      },
    ]);
  };

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryRow | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const openCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: "" });
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: ServiceCategoryRow) => {
    setEditingCategory(category);
    categoryForm.reset({ name: category.name });
    setCategoryModalOpen(true);
  };

  const onSaveCategory = categoryForm.handleSubmit(async (data) => {
    if (!company?.id) return;

    setCategorySaving(true);
    try {
      if (editingCategory?.id) {
        await updateServiceCategory({ companyId: company.id, id: editingCategory.id, name: data.name });
      } else {
        await createServiceCategory(company.id, data.name);
      }
      await invalidate();
      setCategoryModalOpen(false);
    } catch (error: any) {
      Alert.alert("Chyba", error?.message ?? "Nepodarilo sa uložiť kategóriu.");
    } finally {
      setCategorySaving(false);
    }
  });

  const onDeleteCategory = (category: ServiceCategoryRow) => {
    if (!company?.id) return;

    Alert.alert("Odstrániť", `Naozaj chcete odstrániť kategóriu „${category.name}“?`, [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteServiceCategory({ companyId: company.id, id: category.id });
            await invalidate();
          } catch (error: any) {
            Alert.alert("Chyba", error?.message ?? "Nepodarilo sa odstrániť kategóriu.");
          }
        },
      },
    ]);
  };

  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonRow | null>(null);
  const [addonServiceIds, setAddonServiceIds] = useState<string[]>([]);
  const [addonSaving, setAddonSaving] = useState(false);

  const addonForm = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema),
    defaultValues: { name: "", price: 0, duration: 10, description: "" },
  });

  const openCreateAddon = () => {
    setEditingAddon(null);
    setAddonServiceIds([]);
    addonForm.reset({ name: "", price: 0, duration: 10, description: "" });
    setAddonModalOpen(true);
  };

  const openEditAddon = (addon: AddonRow) => {
    setEditingAddon(addon);

    const serviceIds =
      (servicesQuery.data?.services ?? [])
        .filter((service) => (servicesQuery.data?.serviceAddonMap?.[service.id] ?? []).includes(addon.id))
        .map((service) => service.id) ?? [];

    setAddonServiceIds(serviceIds);

    addonForm.reset({
      name: addon.name,
      price: addon.price,
      duration: addon.duration,
      description: addon.description ?? "",
    });
    setAddonModalOpen(true);
  };

  const onSaveAddon = addonForm.handleSubmit(async (data) => {
    if (!company?.id) return;

    setAddonSaving(true);
    try {
      const payload = {
        name: data.name,
        price: Number(data.price),
        duration: Number(data.duration),
        description: data.description?.trim() ? data.description.trim() : null,
      } satisfies Omit<AddonRow, "id">;

      let addonId = editingAddon?.id;

      if (addonId) {
        await updateAddon({ companyId: company.id, id: addonId, patch: payload });
      } else {
        const created = await createAddon(company.id, payload);
        addonId = created.id;
      }

      await setAddonServices(addonId!, addonServiceIds);

      await invalidate();
      setAddonModalOpen(false);
      Alert.alert("Uložené", "Doplnok uložený.");
    } catch (error: any) {
      Alert.alert("Chyba", error?.message ?? "Nepodarilo sa uložiť doplnok.");
    } finally {
      setAddonSaving(false);
    }
  });

  const onDeleteAddon = (addon: AddonRow) => {
    if (!company?.id) return;

    Alert.alert("Odstrániť", `Naozaj chcete odstrániť doplnok „${addon.name}“?`, [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear service links first to avoid constraint issues.
            await setAddonServices(addon.id, []);
            await deleteAddon({ companyId: company.id, id: addon.id });
            await invalidate();
          } catch (error: any) {
            Alert.alert("Chyba", error?.message ?? "Nepodarilo sa odstrániť doplnok.");
          }
        },
      },
    ]);
  };


  const data = servicesQuery.data;

  return (
    <Box className="flex-1 bg-gray-50">
      <Box style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Služby" onPress={() => router.back()} />

          <Pressable
            onPress={() => {
              if (activeTab === "categories") {
                openCreateCategory();
                return;
              }
              if (activeTab === "addons") {
                openCreateAddon();
                return;
              }
              openCreateService();
            }}
            className="px-4 py-2 rounded-full bg-black flex-row items-center"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-sm font-semibold text-white ml-2">Pridať</Text>
          </Pressable>
        </HStack>
      </Box>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={servicesQuery.isFetching} onRefresh={refresh} />}
      >
        <Text className="text-sm text-gray-600 mb-4">Spravujte služby, kategórie a doplnky.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <HStack className="gap-2">
            <TabButton active={activeTab === "services"} label="Služby" onPress={() => setActiveTab("services")} />
            <TabButton active={activeTab === "categories"} label="Kategórie" onPress={() => setActiveTab("categories")} />
            <TabButton active={activeTab === "addons"} label="Doplnky" onPress={() => setActiveTab("addons")} />
          </HStack>
        </ScrollView>

        {servicesQuery.isLoading ? (
          <Box className="py-10 items-center">
            <Spinner />
          </Box>
        ) : null}

        {!servicesQuery.isLoading && !data ? (
          <Box className="py-10">
            <Text className="text-sm text-gray-600">Nepodarilo sa načítať dáta.</Text>
          </Box>
        ) : null}

        {data && activeTab === "services" ? (
          <VStack className="bg-white rounded-xl overflow-hidden border border-gray-100">
            {data.services.length === 0 ? (
              <Box className="p-6">
                <Text className="text-sm text-gray-600">Zatiaľ nemáte žiadne služby.</Text>
              </Box>
            ) : (
              data.services.map((service, index) => {
                const categoryName = service.service_category_id
                  ? categoryNameById.get(service.service_category_id) ?? ""
                  : "";
                const addonCount = data.serviceAddonMap[service.id]?.length ?? 0;
                const subCategoryLabel = service.sub_category_id
                  ? subCategoryLabelById.get(service.sub_category_id) ?? ""
                  : "";

                return (
                  <Box key={service.id}>
                    <HStack className="items-start justify-between p-4 bg-white">
                      <Pressable
                        onPress={() => openEditService(service)}
                        className="flex-1 pr-3"
                      >
                        <HStack className="items-start">
                          <Box className="h-10 w-10 rounded-lg bg-blue-50 items-center justify-center">
                            <Briefcase size={22} color="#2563EB" />
                          </Box>
                          <Box className="flex-1 ml-3">
                            <Text className="text-base font-semibold text-gray-900">{service.name}</Text>
                            <Text className="text-sm text-gray-600 mt-1">
                              {service.duration} min • {formatPrice(service.price)} • {priceTypeLabel(service.price_type)}
                            </Text>
                            {categoryName ? (
                              <Text className="text-xs text-gray-500 mt-1">Kategória: {categoryName}</Text>
                            ) : null}
                            {subCategoryLabel ? (
                              <Text className="text-xs text-gray-500 mt-1">Typ služby: {subCategoryLabel}</Text>
                            ) : null}
                            {addonCount > 0 ? (
                              <Text className="text-xs text-gray-500 mt-1">Doplnky: {addonCount}</Text>
                            ) : null}
                            {service.is_mobile ? (
                              <Text className="text-xs text-gray-500 mt-1">Mobilná služba</Text>
                            ) : null}
                          </Box>
                        </HStack>
                      </Pressable>

                      <Pressable onPress={() => onDeleteService(service)} className="p-2">
                        <Trash2 size={18} color="#DC2626" />
                      </Pressable>
                    </HStack>
                    {index < data.services.length - 1 ? <Divider className="bg-gray-100" /> : null}
                  </Box>
                );
              })
            )}
          </VStack>
        ) : null}

        {data && activeTab === "categories" ? (
          <VStack className="bg-white rounded-xl overflow-hidden border border-gray-100">
            {data.categories.length === 0 ? (
              <Box className="p-6">
                <Text className="text-sm text-gray-600">Zatiaľ nemáte žiadne kategórie.</Text>
              </Box>
            ) : (
              data.categories.map((category, index) => (
                <Box key={category.id}>
                  <HStack className="items-center justify-between p-4 bg-white">
                    <Pressable onPress={() => openEditCategory(category)} className="flex-1 pr-3">
                      <HStack className="items-center">
                        <Box className="h-10 w-10 rounded-lg bg-gray-100 items-center justify-center">
                          <Tag size={20} color="#374151" />
                        </Box>
                        <Text className="text-base font-semibold text-gray-900 ml-3">{category.name}</Text>
                      </HStack>
                    </Pressable>
                    <Pressable onPress={() => onDeleteCategory(category)} className="p-2">
                      <Trash2 size={18} color="#DC2626" />
                    </Pressable>
                  </HStack>
                  {index < data.categories.length - 1 ? <Divider className="bg-gray-100" /> : null}
                </Box>
              ))
            )}
          </VStack>
        ) : null}

        {data && activeTab === "addons" ? (
          <VStack className="bg-white rounded-xl overflow-hidden border border-gray-100">
            {data.addons.length === 0 ? (
              <Box className="p-6">
                <Text className="text-sm text-gray-600">Zatiaľ nemáte žiadne doplnky.</Text>
              </Box>
            ) : (
              data.addons.map((addon, index) => (
                <Box key={addon.id}>
                  <HStack className="items-start justify-between p-4 bg-white">
                    <Pressable onPress={() => openEditAddon(addon)} className="flex-1 pr-3">
                      <HStack className="items-start">
                        <Box className="h-10 w-10 rounded-lg bg-purple-50 items-center justify-center">
                          <Puzzle size={22} color="#7C3AED" />
                        </Box>
                        <Box className="flex-1 ml-3">
                          <Text className="text-base font-semibold text-gray-900">{addon.name}</Text>
                          <Text className="text-sm text-gray-600 mt-1">
                            {addon.duration} min • {formatPrice(addon.price)}
                          </Text>
                          {addon.description ? (
                            <Text className="text-xs text-gray-500 mt-1">{addon.description}</Text>
                          ) : null}
                        </Box>
                      </HStack>
                    </Pressable>
                    <Pressable onPress={() => onDeleteAddon(addon)} className="p-2">
                      <Trash2 size={18} color="#DC2626" />
                    </Pressable>
                  </HStack>
                  {index < data.addons.length - 1 ? <Divider className="bg-gray-100" /> : null}
                </Box>
              ))
            )}
          </VStack>
        ) : null}

        <Text className="text-xs text-gray-500 mt-4">Potiahnuť pre obnovenie.</Text>
      </ScrollView>

      <Modal
        visible={serviceModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setServiceModalOpen(false)}
      >
        <View className="flex-1 bg-black/40">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden">
            <HStack className="px-5 py-4 items-center justify-between border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                {editingService ? "Upraviť službu" : "Nová služba"}
              </Text>
              <Pressable onPress={() => setServiceModalOpen(false)} className="p-2">
                <X size={20} color="#111827" />
              </Pressable>
            </HStack>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              <VStack className="gap-6">
                <Controller
                  control={serviceForm.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormControl isInvalid={!!error}>
                      <FormControlLabel className="mb-1">
                        <FormControlLabelText>Názov</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          placeholder="Napr. Strih"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </Input>
                      <FormControlError>
                        <FormControlErrorText>{error?.message}</FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                  )}
                />

                <HStack className="gap-3">
                  <Box className="flex-1">
                    <Controller
                      control={serviceForm.control}
                      name="price"
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <FormControl isInvalid={!!error}>
                          <FormControlLabel className="mb-1">
                            <FormControlLabelText>Cena (€)</FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              placeholder="0"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={onChange}
                              value={String(value)}
                            />
                          </Input>
                          <FormControlError>
                            <FormControlErrorText>{error?.message}</FormControlErrorText>
                          </FormControlError>
                        </FormControl>
                      )}
                    />
                  </Box>
                  <Box className="flex-1">
                    <Controller
                      control={serviceForm.control}
                      name="duration"
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <FormControl isInvalid={!!error}>
                          <FormControlLabel className="mb-1">
                            <FormControlLabelText>Trvanie (min)</FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              placeholder="30"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={onChange}
                              value={String(value)}
                            />
                          </Input>
                          <FormControlError>
                            <FormControlErrorText>{error?.message}</FormControlErrorText>
                          </FormControlError>
                        </FormControl>
                      )}
                    />
                  </Box>
                </HStack>

                <Controller
                  control={serviceForm.control}
                  name="price_type"
                  render={({ field: { value, onChange } }) => (
                    <Box>
                      <Text className="text-sm font-semibold text-gray-800 mb-2">Typ ceny</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <HStack className="gap-2">
                          {priceTypes.map((type) => {
                            const selected = type === value;
                            return (
                              <Pressable
                                key={type}
                                onPress={() => onChange(type)}
                                className={`px-4 py-2 rounded-full border ${
                                  selected ? "bg-black border-black" : "bg-white border-gray-200"
                                }`}
                              >
                                <Text
                                  className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-700"}`}
                                >
                                  {priceTypeLabel(type)}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </HStack>
                      </ScrollView>
                    </Box>
                  )}
                />

                <Controller
                  control={serviceForm.control}
                  name="is_mobile"
                  render={({ field: { value, onChange } }) => (
                    <Pressable
                      onPress={() => onChange(!value)}
                      className="p-4 rounded-2xl border border-gray-200 bg-white"
                    >
                      <HStack className="items-center justify-between">
                        <Text className="font-semibold text-gray-900">Mobilná služba</Text>
                        <Box
                          className={`h-6 w-6 rounded-md border items-center justify-center ${
                            value ? "bg-black border-black" : "bg-white border-gray-300"
                          }`}
                        >
                          {value ? <Check size={16} color="#FFFFFF" /> : null}
                        </Box>
                      </HStack>
                      <Text className="text-xs text-gray-500 mt-2">
                        Označte, ak sa služba poskytuje u klienta.
                      </Text>
                    </Pressable>
                  )}
                />

                <Box>
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Kategória</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack className="gap-2">
                      <Pressable
                        onPress={() => setServiceCategoryId(null)}
                        className={`px-4 py-2 rounded-full border ${
                          serviceCategoryId === null ? "bg-black border-black" : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            serviceCategoryId === null ? "text-white" : "text-gray-700"
                          }`}
                        >
                          Bez
                        </Text>
                      </Pressable>
                      {(data?.categories ?? []).map((category) => {
                        const selected = serviceCategoryId === category.id;
                        return (
                          <Pressable
                            key={category.id}
                            onPress={() => setServiceCategoryId(category.id)}
                            className={`px-4 py-2 rounded-full border ${
                              selected ? "bg-black border-black" : "bg-white border-gray-200"
                            }`}
                          >
                            <Text
                              className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-700"}`}
                            >
                              {category.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </HStack>
                  </ScrollView>
                </Box>

                <Box>
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Typ služby</Text>
                  {(data?.subCategories ?? []).length === 0 ? (
                    <Text className="text-sm text-gray-500">
                      Typy služieb nie sú dostupné (skontrolujte kategórie firmy).
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <HStack className="gap-2">
                        <Pressable
                          onPress={() => setServiceSubCategoryId(null)}
                          className={`px-4 py-2 rounded-full border ${
                            serviceSubCategoryId === null ? "bg-black border-black" : "bg-white border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              serviceSubCategoryId === null ? "text-white" : "text-gray-700"
                            }`}
                          >
                            Bez
                          </Text>
                        </Pressable>

                        {(data?.subCategories ?? []).map((subCategory) => {
                          const selected = serviceSubCategoryId === subCategory.id;
                          return (
                            <Pressable
                              key={subCategory.id}
                              onPress={() => setServiceSubCategoryId(subCategory.id)}
                              className={`px-4 py-2 rounded-full border ${
                                selected ? "bg-black border-black" : "bg-white border-gray-200"
                              }`}
                            >
                              <Text
                                className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-700"}`}
                              >
                                {subCategory.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </HStack>
                    </ScrollView>
                  )}
                </Box>

                <Box>
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Doplnky</Text>
                  {(data?.addons ?? []).length === 0 ? (
                    <Text className="text-sm text-gray-500">Najprv si vytvorte doplnky.</Text>
                  ) : (
                    <VStack className="gap-2">
                      {(data?.addons ?? []).map((addon) => {
                        const selected = serviceAddonIds.includes(addon.id);
                        return (
                          <Pressable
                            key={addon.id}
                            onPress={() => toggleServiceAddon(addon.id)}
                            className={`p-3 rounded-2xl border ${
                              selected ? "border-black bg-black" : "border-gray-200 bg-white"
                            }`}
                          >
                            <HStack className="items-start justify-between">
                              <Box className="flex-1 pr-4">
                                <Text className={`font-semibold ${selected ? "text-white" : "text-gray-900"}`}>
                                  {addon.name}
                                </Text>
                                <Text className={`text-xs ${selected ? "text-gray-200" : "text-gray-500"}`}>
                                  {addon.duration} min • {formatPrice(addon.price)}
                                </Text>
                              </Box>
                              <Box
                                className={`h-6 w-6 rounded-md border items-center justify-center ${
                                  selected ? "bg-white border-white" : "bg-white border-gray-300"
                                }`}
                              >
                                {selected ? <Check size={16} color="#111827" /> : null}
                              </Box>
                            </HStack>
                          </Pressable>
                        );
                      })}
                    </VStack>
                  )}
                </Box>

                <HStack className="gap-3">
                  <Button variant="outline" className="flex-1" onPress={() => setServiceModalOpen(false)}>
                    <ButtonText>Zrušiť</ButtonText>
                  </Button>
                  <Button className="flex-1" onPress={onSaveService} isDisabled={serviceSaving}>
                    <ButtonText>{serviceSaving ? "Ukladám..." : "Uložiť"}</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <View className="flex-1 bg-black/40">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden">
            <HStack className="px-5 py-4 items-center justify-between border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                {editingCategory ? "Upraviť kategóriu" : "Nová kategória"}
              </Text>
              <Pressable onPress={() => setCategoryModalOpen(false)} className="p-2">
                <X size={20} color="#111827" />
              </Pressable>
            </HStack>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              <VStack className="gap-6">
                <Controller
                  control={categoryForm.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormControl isInvalid={!!error}>
                      <FormControlLabel className="mb-1">
                        <FormControlLabelText>Názov</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          placeholder="Napr. Strihy"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </Input>
                      <FormControlError>
                        <FormControlErrorText>{error?.message}</FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                  )}
                />

                <HStack className="gap-3">
                  <Button variant="outline" className="flex-1" onPress={() => setCategoryModalOpen(false)}>
                    <ButtonText>Zrušiť</ButtonText>
                  </Button>
                  <Button className="flex-1" onPress={onSaveCategory} isDisabled={categorySaving}>
                    <ButtonText>{categorySaving ? "Ukladám..." : "Uložiť"}</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addonModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAddonModalOpen(false)}
      >
        <View className="flex-1 bg-black/40">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden">
            <HStack className="px-5 py-4 items-center justify-between border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-900">
                {editingAddon ? "Upraviť doplnok" : "Nový doplnok"}
              </Text>
              <Pressable onPress={() => setAddonModalOpen(false)} className="p-2">
                <X size={20} color="#111827" />
              </Pressable>
            </HStack>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              <VStack className="gap-6">
                <Controller
                  control={addonForm.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormControl isInvalid={!!error}>
                      <FormControlLabel className="mb-1">
                        <FormControlLabelText>Názov</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          placeholder="Napr. Umývanie"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </Input>
                      <FormControlError>
                        <FormControlErrorText>{error?.message}</FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                  )}
                />

                <HStack className="gap-3">
                  <Box className="flex-1">
                    <Controller
                      control={addonForm.control}
                      name="price"
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <FormControl isInvalid={!!error}>
                          <FormControlLabel className="mb-1">
                            <FormControlLabelText>Cena (€)</FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              placeholder="0"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={onChange}
                              value={String(value)}
                            />
                          </Input>
                          <FormControlError>
                            <FormControlErrorText>{error?.message}</FormControlErrorText>
                          </FormControlError>
                        </FormControl>
                      )}
                    />
                  </Box>
                  <Box className="flex-1">
                    <Controller
                      control={addonForm.control}
                      name="duration"
                      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                        <FormControl isInvalid={!!error}>
                          <FormControlLabel className="mb-1">
                            <FormControlLabelText>Trvanie (min)</FormControlLabelText>
                          </FormControlLabel>
                          <Input>
                            <InputField
                              placeholder="10"
                              keyboardType="numeric"
                              onBlur={onBlur}
                              onChangeText={onChange}
                              value={String(value)}
                            />
                          </Input>
                          <FormControlError>
                            <FormControlErrorText>{error?.message}</FormControlErrorText>
                          </FormControlError>
                        </FormControl>
                      )}
                    />
                  </Box>
                </HStack>

                <Controller
                  control={addonForm.control}
                  name="description"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <FormControl isInvalid={!!error}>
                      <FormControlLabel className="mb-1">
                        <FormControlLabelText>Popis (voliteľné)</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          placeholder="Krátky popis"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value ?? ""}
                        />
                      </Input>
                      <FormControlError>
                        <FormControlErrorText>{error?.message}</FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                  )}
                />

                <Box>
                  <Text className="text-sm font-semibold text-gray-800 mb-2">Priradiť k službám</Text>
                  {(servicesQuery.data?.services ?? []).length === 0 ? (
                    <Text className="text-sm text-gray-500">Najprv si pridajte služby.</Text>
                  ) : (
                    <VStack className="gap-2">
                      {(servicesQuery.data?.services ?? []).map((service) => {
                        const selected = addonServiceIds.includes(service.id);
                        return (
                          <Pressable
                            key={service.id}
                            onPress={() =>
                              setAddonServiceIds((prev) => {
                                if (prev.includes(service.id)) return prev.filter((id) => id !== service.id);
                                return [...prev, service.id];
                              })
                            }
                            className={`p-3 rounded-2xl border ${
                              selected ? "border-black bg-black" : "border-gray-200 bg-white"
                            }`}
                          >
                            <HStack className="items-start justify-between">
                              <Box className="flex-1 pr-4">
                                <Text className={`font-semibold ${selected ? "text-white" : "text-gray-900"}`}>
                                  {service.name}
                                </Text>
                                <Text className={`text-xs ${selected ? "text-gray-200" : "text-gray-500"}`}>
                                  {service.duration} min • {formatPrice(service.price)}
                                </Text>
                              </Box>
                              <Box
                                className={`h-6 w-6 rounded-md border items-center justify-center ${
                                  selected ? "bg-white border-white" : "bg-white border-gray-300"
                                }`}
                              >
                                {selected ? <Check size={16} color="#111827" /> : null}
                              </Box>
                            </HStack>
                          </Pressable>
                        );
                      })}
                    </VStack>
                  )}
                </Box>

                <HStack className="gap-3">
                  <Button variant="outline" className="flex-1" onPress={() => setAddonModalOpen(false)}>
                    <ButtonText>Zrušiť</ButtonText>
                  </Button>
                  <Button className="flex-1" onPress={onSaveAddon} isDisabled={addonSaving}>
                    <ButtonText>{addonSaving ? "Ukladám..." : "Uložiť"}</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </Box>
  );
}
