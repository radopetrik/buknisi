import { Alert, ScrollView, Linking, Image } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ExternalLink, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/lib/supabase";

import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const COMPANY_PHOTOS_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_COMPANY_PHOTOS_BUCKET ?? "company_photos";

const dayOptions: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Pondelok" },
  { value: "tuesday", label: "Utorok" },
  { value: "wednesday", label: "Streda" },
  { value: "thursday", label: "Štvrtok" },
  { value: "friday", label: "Piatok" },
  { value: "saturday", label: "Sobota" },
  { value: "sunday", label: "Nedeľa" },
];

type ProfileTab = "overview" | "basic" | "amenities" | "hours" | "extras" | "photos";

type CategoryOption = { id: string; name: string; slug: string };
type CityOption = { id: string; name: string; slug: string };
type AmenityOption = { id: string; name: string; icon: string | null };

type BusinessHourRow = {
  id: string;
  day_in_week: DayOfWeek;
  from_time: string;
  to_time: string;
  break_from_time: string | null;
  break_to_time: string | null;
};

type BusinessHourExtraRow = {
  id: string;
  date: string; // YYYY-MM-DD
  message: string | null;
  from_hour: string | null;
  to_hour: string | null;
  break_from: string | null;
  break_to: string | null;
};

type PhotoRow = {
  id: string;
  ordering: number | null;
  url: string;
};

type CompanyProfileRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  contact_phone: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
  address_text: string | null;
  city_id: string | null;
  category_id: string | null;
  is_mobile: boolean | null;
};

type ProfileData = {
  company: CompanyProfileRow;
  categories: CategoryOption[];
  cities: CityOption[];
  amenities: AmenityOption[];
  selectedAmenityIds: string[];
  selectedExtraCategoryIds: string[];
  businessHours: BusinessHourRow[];
  businessHourExtras: BusinessHourExtraRow[];
  photos: PhotoRow[];
};

type DayState = {
  enabled: boolean;
  from: string;
  to: string;
  breakFrom: string;
  breakTo: string;
};

function toInput(value: string | null | undefined) {
  return value ?? "";
}

function toNullIfEmpty(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeTime(value: string) {
  return value.trim();
}

function toSupabaseTime(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const base = trimmed.includes(":") ? trimmed : `${trimmed}:00`;
  return `${base}:00`.slice(0, 8);
}

function prepareInitialDayState(businessHours: BusinessHourRow[]): Record<DayOfWeek, DayState> {
  const base: Record<DayOfWeek, DayState> = {
    monday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    tuesday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    wednesday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    thursday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    friday: { enabled: false, from: "09:00", to: "17:00", breakFrom: "", breakTo: "" },
    saturday: { enabled: false, from: "09:00", to: "13:00", breakFrom: "", breakTo: "" },
    sunday: { enabled: false, from: "09:00", to: "13:00", breakFrom: "", breakTo: "" },
  };

  for (const row of businessHours) {
    base[row.day_in_week] = {
      enabled: true,
      from: row.from_time?.slice(0, 5) ?? base[row.day_in_week].from,
      to: row.to_time?.slice(0, 5) ?? base[row.day_in_week].to,
      breakFrom: row.break_from_time?.slice(0, 5) ?? "",
      breakTo: row.break_to_time?.slice(0, 5) ?? "",
    };
  }

  return base;
}

function normalizePhotos(photos: PhotoRow[]) {
  return [...photos].sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));
}

function guessExtension(fileNameOrUri: string | null | undefined) {
  const source = (fileNameOrUri ?? "").trim();
  const match = source.match(/\.([a-zA-Z0-9]{2,6})(\?|$)/);
  return match ? match[1].toLowerCase() : "jpg";
}

async function uploadCompanyPhotoFromAsset(params: {
  companyId: string;
  asset: ImagePicker.ImagePickerAsset;
  currentOrdering: number;
}) {
  const { companyId, asset, currentOrdering } = params;

  const fileExt = guessExtension(asset.fileName ?? asset.uri);
  const safeExt = fileExt.replace(/[^a-z0-9]/g, "") || "jpg";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `${companyId}/${uniqueId}.${safeExt}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const uploadResult = await supabase.storage.from(COMPANY_PHOTOS_BUCKET).upload(storagePath, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: asset.mimeType ?? blob.type ?? undefined,
  });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const { data: publicUrlData } = supabase.storage.from(COMPANY_PHOTOS_BUCKET).getPublicUrl(storagePath);
  const publicUrl = publicUrlData.publicUrl;
  if (!publicUrl) {
    await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([storagePath]);
    throw new Error("Nepodarilo sa získať URL fotografie");
  }

  const insertResult = await supabase.from("photos").insert({ company_id: companyId, url: publicUrl, ordering: currentOrdering });
  if (insertResult.error) {
    await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([storagePath]);
    throw insertResult.error;
  }

  return publicUrl;
}

function getStorageRefFromPhotoUrl(url: string) {
  const decoded = decodeURIComponent(url);

  // Matches both public and signed URLs:
  // .../storage/v1/object/public/<bucket>/<path>
  // .../storage/v1/object/sign/<bucket>/<path>?token=...
  const match = decoded.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
  if (!match) return null;

  const bucket = match[1];
  const remainder = match[2];
  const path = remainder.split("?")[0];
  if (!bucket || !path) return null;

  return { bucket, path } as const;
}

async function removeCompanyPhotoFromStorage(url: string) {
  const ref = getStorageRefFromPhotoUrl(url);
  if (!ref) return;

  const removeResult = await supabase.storage.from(ref.bucket).remove([ref.path]);
  if (removeResult.error) {
    throw removeResult.error;
  }
}

async function fetchProfileData(companyId: string): Promise<ProfileData> {
  const [
    companyResult,
    categoriesResult,
    citiesResult,
    amenitiesResult,
    companyAmenitiesResult,
    companyExtraCategoriesResult,
    businessHoursResult,
    extrasResult,
    photosResult,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, name, slug, description, phone, contact_phone, email, facebook, instagram, website, address_text, city_id, category_id, is_mobile",
      )
      .eq("id", companyId)
      .single(),
    supabase.from("categories").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("cities").select("id, name, slug").order("name", { ascending: true }),
    supabase.from("amenities").select("id, name, icon").order("name", { ascending: true }),
    supabase.from("company_amenities").select("amenity_id").eq("company_id", companyId),
    supabase.from("company_extra_categories").select("category_id").eq("company_id", companyId),
    supabase
      .from("company_business_hours")
      .select("id, day_in_week, from_time, to_time, break_from_time, break_to_time")
      .eq("company_id", companyId),
    supabase
      .from("company_business_hours_extras")
      .select("id, date, message, from_hour, to_hour, break_from, break_to")
      .eq("company_id", companyId)
      .order("date", { ascending: true }),
    supabase.from("photos").select("id, ordering, url").eq("company_id", companyId).order("ordering", { ascending: true }),
  ]);

  if (companyResult.error) throw companyResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (citiesResult.error) throw citiesResult.error;
  if (amenitiesResult.error) throw amenitiesResult.error;
  if (companyAmenitiesResult.error) throw companyAmenitiesResult.error;
  if (companyExtraCategoriesResult.error) throw companyExtraCategoriesResult.error;
  if (businessHoursResult.error) throw businessHoursResult.error;
  if (extrasResult.error) throw extrasResult.error;
  if (photosResult.error) throw photosResult.error;

  const company = companyResult.data;
  if (!company) throw new Error("Company not found");

  return {
    company: company as CompanyProfileRow,
    categories: (categoriesResult.data ?? []) as CategoryOption[],
    cities: (citiesResult.data ?? []) as CityOption[],
    amenities: (amenitiesResult.data ?? []) as AmenityOption[],
    selectedAmenityIds: (companyAmenitiesResult.data ?? []).map((row: any) => row.amenity_id as string),
    selectedExtraCategoryIds: (companyExtraCategoriesResult.data ?? []).map((row: any) => row.category_id as string),
    businessHours: (businessHoursResult.data ?? []) as BusinessHourRow[],
    businessHourExtras: (extrasResult.data ?? []) as BusinessHourExtraRow[],
    photos: (photosResult.data ?? []) as PhotoRow[],
  };
}

async function persistPhotoOrder(companyId: string, orderedPhotoIds: string[]) {
  const rpcResult = await supabase.rpc("reorder_photos", {
    p_company_id: companyId,
    p_photo_ids: orderedPhotoIds,
  });

  if (!rpcResult.error) {
    return;
  }

  // Fallback if the RPC is missing/not allowed.
  const updates = orderedPhotoIds.map((photoId, index) =>
    supabase.from("photos").update({ ordering: index }).eq("id", photoId),
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  if (firstError) throw firstError;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: company } = useCompany();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["companyProfile", company?.id],
    enabled: !!company?.id,
    queryFn: () => fetchProfileData(company!.id),
  });

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const [hydrated, setHydrated] = useState(false);

  const [draft, setDraft] = useState<CompanyProfileRow | null>(null);
  const [amenityIds, setAmenityIds] = useState<string[]>([]);
  const [extraCategoryIds, setExtraCategoryIds] = useState<string[]>([]);
  const [hoursState, setHoursState] = useState<Record<DayOfWeek, DayState>>(() => prepareInitialDayState([]));
  const [extras, setExtras] = useState<BusinessHourExtraRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAmenities, setSavingAmenities] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savingExtra, setSavingExtra] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);

  const [photoDisplayUrls, setPhotoDisplayUrls] = useState<Record<string, string>>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extras form state
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [extraDate, setExtraDate] = useState("");
  const [extraMessage, setExtraMessage] = useState("");
  const [extraFrom, setExtraFrom] = useState("");
  const [extraTo, setExtraTo] = useState("");
  const [extraBreakFrom, setExtraBreakFrom] = useState("");
  const [extraBreakTo, setExtraBreakTo] = useState("");


  useEffect(() => {
    if (!data || hydrated) return;

    setDraft(data.company);
    setAmenityIds(data.selectedAmenityIds);
    setExtraCategoryIds(data.selectedExtraCategoryIds);
    setHoursState(prepareInitialDayState(data.businessHours));
    setExtras([...data.businessHourExtras].sort((a, b) => a.date.localeCompare(b.date)));
    setPhotos(normalizePhotos(data.photos));

    setHydrated(true);
  }, [data, hydrated]);

  useEffect(() => {
    if (!company?.id) return;
    if (photos.length === 0) {
      setPhotoDisplayUrls({});
      return;
    }

    let cancelled = false;

    void (async () => {
      let firstError: string | null = null;

      const entries = await Promise.all(
        photos.map(async (photo) => {
          const ref = getStorageRefFromPhotoUrl(photo.url);
          if (!ref) return [photo.id, photo.url] as const;

          const signed = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
          if (signed.error || !signed.data?.signedUrl) {
            if (!firstError && signed.error?.message) {
              firstError = signed.error.message;
            }
            return [photo.id, photo.url] as const;
          }

          return [photo.id, signed.data.signedUrl] as const;
        }),
      );

      if (cancelled) return;

      setPhotoDisplayUrls((prev) => {
        const next: Record<string, string> = { ...prev };
        for (const [id, url] of entries) {
          next[id] = url;
        }
        return next;
      });

      if (firstError) {
        setErrorMessage((prev) =>
          prev ?? `Nepodarilo sa načítať náhľad fotiek (storage): ${firstError}`
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [company?.id, photos]);

  const tabItems = useMemo(
    () =>
      [
        { key: "overview" as const, label: "Náhľad" },
        { key: "basic" as const, label: "Základ" },
        { key: "amenities" as const, label: "Vybavenie" },
        { key: "hours" as const, label: "Hodiny" },
        { key: "extras" as const, label: "Špeciálne" },
        { key: "photos" as const, label: "Fotky" },
      ] satisfies { key: ProfileTab; label: string }[], 
    [],
  );

  const canSaveProfile = useMemo(() => {
    if (!company?.id) return false;
    if (!draft) return false;
    if (!draft.name.trim()) return false;
    if (!draft.slug.trim()) return false;
    if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) return false;
    if (savingProfile) return false;
    return true;
  }, [company?.id, draft, savingProfile]);

  const handleSaveProfile = async () => {
    if (!company?.id || !draft) return;

    setSavingProfile(true);
    setErrorMessage(null);

    try {
      const mainCategoryId = toNullIfEmpty(draft.category_id);

      const payload = {
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        description: toNullIfEmpty(draft.description),
        phone: toNullIfEmpty(draft.phone),
        contact_phone: toNullIfEmpty(draft.contact_phone),
        email: toNullIfEmpty(draft.email),
        facebook: toNullIfEmpty(draft.facebook),
        instagram: toNullIfEmpty(draft.instagram),
        website: toNullIfEmpty(draft.website),
        address_text: toNullIfEmpty(draft.address_text),
        city_id: toNullIfEmpty(draft.city_id),
        category_id: mainCategoryId,
        is_mobile: Boolean(draft.is_mobile),
      } as const;

      const normalizedExtraCategories = mainCategoryId
        ? Array.from(new Set(extraCategoryIds)).filter((categoryId) => categoryId && categoryId !== mainCategoryId)
        : [];

      const updateResult = await supabase
        .from("companies")
        .update(payload)
        .eq("id", company.id)
        .select(
          "id, name, slug, description, phone, contact_phone, email, facebook, instagram, website, address_text, city_id, category_id, is_mobile",
        )
        .single();

      if (updateResult.error) throw updateResult.error;
      if (!updateResult.data) throw new Error("Nepodarilo sa uložiť profil.");

      const deleteExtraResult = await supabase.from("company_extra_categories").delete().eq("company_id", company.id);
      if (deleteExtraResult.error) throw deleteExtraResult.error;

      if (normalizedExtraCategories.length > 0) {
        const insertResult = await supabase
          .from("company_extra_categories")
          .insert(normalizedExtraCategories.map((categoryId) => ({ company_id: company.id, category_id: categoryId })));
        if (insertResult.error) throw insertResult.error;
      }

      setDraft(updateResult.data as CompanyProfileRow);
      setExtraCategoryIds(normalizedExtraCategories);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["company"] }),
        queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] }),
      ]);

      Alert.alert("Uložené", "Profil uložený.");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa uložiť profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setAmenityIds((prev) => (prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]));
  };

  const toggleExtraCategory = (categoryId: string) => {
    setExtraCategoryIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]));
  };

  const handleSaveAmenities = async () => {
    if (!company?.id || !draft) return;

    setSavingAmenities(true);
    setErrorMessage(null);

    try {
      const selected = Array.from(new Set(amenityIds));

      const deleteResult = await supabase.from("company_amenities").delete().eq("company_id", company.id);
      if (deleteResult.error) throw deleteResult.error;

      if (selected.length > 0) {
        const insertResult = await supabase
          .from("company_amenities")
          .insert(selected.map((amenityId) => ({ company_id: company.id, amenity_id: amenityId })));
        if (insertResult.error) throw insertResult.error;
      }

      await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
      Alert.alert("Uložené", "Vybavenie uložené.");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa uložiť vybavenie.");
    } finally {
      setSavingAmenities(false);
    }
  };

  const updateDayState = (day: DayOfWeek, updater: (prev: DayState) => DayState) => {
    setHoursState((prev) => ({
      ...prev,
      [day]: updater(prev[day]),
    }));
  };

  const handleSaveHours = async () => {
    if (!company?.id) return;

    setSavingHours(true);
    setErrorMessage(null);

    try {
      const enabledDays = dayOptions
        .map((day) => ({ day: day.value, state: hoursState[day.value] }))
        .filter((row) => row.state.enabled);

      const payload = enabledDays.map(({ day, state }) => {
        const from = normalizeTime(state.from);
        const to = normalizeTime(state.to);
        if (!from || !to) {
          throw new Error("Vyplňte čas Od/Do pre všetky zapnuté dni.");
        }
        if (from >= to) {
          throw new Error("Skontrolujte čas Od/Do – začiatok musí byť skôr ako koniec.");
        }

        const breakFrom = normalizeTime(state.breakFrom);
        const breakTo = normalizeTime(state.breakTo);

        if ((breakFrom && !breakTo) || (!breakFrom && breakTo)) {
          throw new Error("Vyplňte prestávku Od aj Do (alebo nechajte obe prázdne).");
        }
        if (breakFrom && breakTo) {
          if (breakFrom >= breakTo) throw new Error("Prestávka musí mať správne poradie.");
          if (breakFrom <= from || breakTo >= to) {
            throw new Error("Prestávka musí byť medzi otváracími hodinami.");
          }
        }

        return {
          company_id: company.id,
          day_in_week: day,
          from_time: toSupabaseTime(from)!,
          to_time: toSupabaseTime(to)!,
          break_from_time: breakFrom ? toSupabaseTime(breakFrom) : null,
          break_to_time: breakTo ? toSupabaseTime(breakTo) : null,
        };
      });

      const disabledDays = dayOptions.map((d) => d.value).filter((d) => !hoursState[d].enabled);

      if (payload.length > 0) {
        const upsertResult = await supabase.from("company_business_hours").upsert(payload, { onConflict: "company_id,day_in_week" });
        if (upsertResult.error) throw upsertResult.error;
      }

      if (disabledDays.length > 0) {
        const deleteResult = await supabase
          .from("company_business_hours")
          .delete()
          .eq("company_id", company.id)
          .in("day_in_week", disabledDays);
        if (deleteResult.error) throw deleteResult.error;
      }

      await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
      Alert.alert("Uložené", "Otváracie hodiny uložené.");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa uložiť otváracie hodiny.");
    } finally {
      setSavingHours(false);
    }
  };

  const resetExtraForm = () => {
    setEditingExtraId(null);
    setExtraDate("");
    setExtraMessage("");
    setExtraFrom("");
    setExtraTo("");
    setExtraBreakFrom("");
    setExtraBreakTo("");
  };

  const openExtraForEdit = (row: BusinessHourExtraRow) => {
    setEditingExtraId(row.id);
    setExtraDate(row.date ?? "");
    setExtraMessage(toInput(row.message));
    setExtraFrom(row.from_hour?.slice(0, 5) ?? "");
    setExtraTo(row.to_hour?.slice(0, 5) ?? "");
    setExtraBreakFrom(row.break_from?.slice(0, 5) ?? "");
    setExtraBreakTo(row.break_to?.slice(0, 5) ?? "");
  };

  const handleSaveExtra = async () => {
    if (!company?.id) return;

    setSavingExtra(true);
    setErrorMessage(null);

    try {
      const date = extraDate.trim();
      if (!date) throw new Error("Dátum je povinný.");

      const from = normalizeTime(extraFrom);
      const to = normalizeTime(extraTo);
      const breakFrom = normalizeTime(extraBreakFrom);
      const breakTo = normalizeTime(extraBreakTo);

      if ((from && !to) || (!from && to)) throw new Error("Vyplňte čas Od aj Do (alebo nechajte prázdne pre Zatvorené).");
      if (from && to && from >= to) throw new Error("Začiatok musí byť skôr ako koniec.");

      if ((breakFrom && !breakTo) || (!breakFrom && breakTo)) throw new Error("Vyplňte prestávku Od aj Do (alebo nechajte obe prázdne).");
      if (breakFrom && breakTo && breakFrom >= breakTo) throw new Error("Prestávka musí mať správne poradie.");

      const payload = {
        company_id: company.id,
        date,
        message: toNullIfEmpty(extraMessage),
        from_hour: toSupabaseTime(from),
        to_hour: toSupabaseTime(to),
        break_from: toSupabaseTime(breakFrom),
        break_to: toSupabaseTime(breakTo),
      };

      const result = editingExtraId
        ? await supabase.from("company_business_hours_extras").update(payload).eq("id", editingExtraId)
        : await supabase.from("company_business_hours_extras").insert(payload);

      if (result.error) throw result.error;

      const refreshed = await supabase
        .from("company_business_hours_extras")
        .select("id, date, message, from_hour, to_hour, break_from, break_to")
        .eq("company_id", company.id)
        .order("date", { ascending: true });
      if (refreshed.error) throw refreshed.error;

      setExtras((refreshed.data ?? []) as BusinessHourExtraRow[]);
      resetExtraForm();
      await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
      Alert.alert("Uložené", "Špeciálny deň uložený.");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa uložiť špeciálny deň.");
    } finally {
      setSavingExtra(false);
    }
  };

  const handleDeleteExtra = (id: string) => {
    Alert.alert("Odstrániť", "Naozaj chcete odstrániť tento špeciálny deň?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          if (!company?.id) return;
          try {
            const result = await supabase.from("company_business_hours_extras").delete().eq("id", id);
            if (result.error) throw result.error;

            setExtras((prev) => prev.filter((x) => x.id !== id));
            await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
          } catch (err: any) {
            Alert.alert("Chyba", err?.message ?? "Nepodarilo sa odstrániť záznam.");
          }
        },
      },
    ]);
  };

  const handlePickAndUploadPhoto = async () => {
    if (!company?.id) return;

    setSavingPhotos(true);
    setErrorMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Potrebujem povolenie na prístup ku galérii.");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error("Nepodarilo sa načítať vybraný obrázok.");
      }

      const ordering = normalizePhotos(photos).length;
      await uploadCompanyPhotoFromAsset({ companyId: company.id, asset, currentOrdering: ordering });

      const refreshed = await supabase
        .from("photos")
        .select("id, ordering, url")
        .eq("company_id", company.id)
        .order("ordering", { ascending: true });
      if (refreshed.error) throw refreshed.error;

      const nextPhotos = normalizePhotos((refreshed.data ?? []) as PhotoRow[]);
      setPhotos(nextPhotos);
      await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
      Alert.alert("Uložené", "Fotka pridaná.");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa pridať fotku.");
    } finally {
      setSavingPhotos(false);
    }
  };


  const handleDeletePhoto = (photoId: string) => {
    Alert.alert("Odstrániť", "Naozaj chcete odstrániť túto fotku?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          if (!company?.id) return;

          setSavingPhotos(true);
          setErrorMessage(null);

          try {
            const target = normalizePhotos(photos).find((p) => p.id === photoId) ?? null;

            const result = await supabase.from("photos").delete().eq("id", photoId);
            if (result.error) throw result.error;

            let storageError: string | null = null;
            if (target) {
              try {
                await removeCompanyPhotoFromStorage(target.url);
              } catch (storageErr: any) {
                storageError = storageErr?.message ?? "Nepodarilo sa odstrániť súbor v úložisku.";
              }
            }

            const remaining = normalizePhotos(photos).filter((p) => p.id !== photoId);
            const ordered = remaining.map((p, index) => ({ ...p, ordering: index }));
            await persistPhotoOrder(company.id, ordered.map((p) => p.id));
            setPhotos(ordered);

            await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
            if (storageError) {
              setErrorMessage(storageError);
            }
          } catch (err: any) {
            setErrorMessage(err?.message ?? "Nepodarilo sa odstrániť fotku.");
          } finally {
            setSavingPhotos(false);
          }
        },
      },
    ]);
  };

  const handleMovePhoto = async (photoId: string, direction: -1 | 1) => {
    if (!company?.id) return;

    setSavingPhotos(true);
    setErrorMessage(null);

    try {
      const sorted = normalizePhotos(photos);
      const index = sorted.findIndex((p) => p.id === photoId);
      if (index === -1) return;

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= sorted.length) return;

      const next = [...sorted];
      const [removed] = next.splice(index, 1);
      next.splice(nextIndex, 0, removed);

      await persistPhotoOrder(company.id, next.map((p) => p.id));

      setPhotos(next.map((p, i) => ({ ...p, ordering: i })));
      await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa zmeniť poradie.");
    } finally {
      setSavingPhotos(false);
    }
  };

  const handleSetCover = async (photoId: string) => {
    if (!company?.id) return;

    setSavingPhotos(true);
    setErrorMessage(null);

    try {
      const sorted = normalizePhotos(photos);
      const target = sorted.find((p) => p.id === photoId);
      if (!target) return;

      const others = sorted.filter((p) => p.id !== photoId);
      const next = [target, ...others];

      await persistPhotoOrder(company.id, next.map((p) => p.id));

      setPhotos(next.map((p, i) => ({ ...p, ordering: i })));
      await queryClient.invalidateQueries({ queryKey: ["companyProfile", company.id] });
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa nastaviť titulnú fotku.");
    } finally {
      setSavingPhotos(false);
    }
  };

  const companyUrl = useMemo(() => {
    if (!data || !draft) return null;

    const city = data.cities.find((c) => c.id === draft.city_id);
    const category = data.categories.find((c) => c.id === draft.category_id);
    if (!city || !category || !draft.slug) return null;

    return `https://buknisi.sk/${city.slug}/${category.slug}/c/${draft.slug}/`;
  }, [data, draft]);

  const renderTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
      <HStack className="gap-2">
        {tabItems.map((tab) => {
          const selected = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={
                selected
                  ? "px-3 py-2 rounded-full bg-gray-900"
                  : "px-3 py-2 rounded-full bg-gray-100"
              }
            >
              <Text className={selected ? "text-white" : "text-gray-800"}>{tab.label}</Text>
            </Pressable>
          );
        })}

      </HStack>
    </ScrollView>
  );

  if (isLoading || !company?.id) {
    return (
      <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
        <Stack.Screen options={{ headerShown: false }} />

        <Box className="bg-white border-b border-gray-200 px-4 py-3">
          <HStack className="items-center justify-between">
            <HStack className="items-center">
              <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                <ChevronLeft size={22} color="#111827" />
              </Pressable>
              <Text className="text-base font-semibold text-gray-900">Profil</Text>
            </HStack>
          </HStack>
        </Box>

        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
        <Stack.Screen options={{ headerShown: false }} />

        <Box className="bg-white border-b border-gray-200 px-4 py-3">
          <HStack className="items-center justify-between">
            <HStack className="items-center">
              <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                <ChevronLeft size={22} color="#111827" />
              </Pressable>
              <Text className="text-base font-semibold text-gray-900">Profil</Text>
            </HStack>
          </HStack>
        </Box>

        <Box className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-700 text-center">{(error as any)?.message ?? "Nepodarilo sa načítať profil."}</Text>
        </Box>
      </Box>
    );
  }

  if (!data || !draft) {
    return (
      <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
        <Stack.Screen options={{ headerShown: false }} />
        <Box className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-700 text-center">Profil nie je dostupný.</Text>
        </Box>
      </Box>
    );
  }

  const renderOverviewTab = () => (
    <VStack className="gap-4">
      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <HStack className="items-start justify-between">
          <Box className="flex-1 pr-3">
            <Text className="text-lg font-semibold text-gray-900">{draft.name}</Text>
            <Text className="text-gray-600 mt-1">buknisi.sk/{draft.slug}</Text>
            <Text className="text-gray-600 mt-2">{draft.description?.trim() ? draft.description : "Bez popisu"}</Text>
          </Box>

          {companyUrl ? (
            <Pressable
              onPress={() => {
                void Linking.openURL(companyUrl);
              }}
              className="px-3 py-2 rounded bg-gray-900"
            >
              <HStack className="items-center gap-2">
                <ExternalLink size={16} color="#ffffff" />
                <Text className="text-white">Web</Text>
              </HStack>
            </Pressable>
          ) : null}
        </HStack>

        <Box className="mt-4">
          <Text className="text-sm text-gray-500">Hlavná kategória</Text>
          <Text className="text-gray-900 mt-1">
            {data.categories.find((c) => c.id === draft.category_id)?.name ?? "Nevybraté"}
          </Text>
        </Box>

        <Box className="mt-4">
          <Text className="text-sm text-gray-500">Mesto</Text>
          <Text className="text-gray-900 mt-1">{data.cities.find((c) => c.id === draft.city_id)?.name ?? "Nevybraté"}</Text>
        </Box>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Rýchle akcie</Text>
        <VStack className="gap-2 mt-3">
          <Pressable onPress={() => setActiveTab("basic")} className="px-3 py-3 rounded border border-gray-200 bg-white">
            <Text className="text-gray-900">Upraviť profil</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab("photos")} className="px-3 py-3 rounded border border-gray-200 bg-white">
            <Text className="text-gray-900">Spravovať fotky</Text>
          </Pressable>
        </VStack>
      </Box>
    </VStack>
  );

  const renderBasicTab = () => (
    <VStack className="gap-4">
      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Základné informácie</Text>

        <VStack className="gap-3 mt-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Názov</Text>
            <Input className="bg-white">
              <InputField value={draft.name} onChangeText={(value) => setDraft({ ...draft, name: value })} placeholder="Napr. Studio Belle" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Slug (malé písmená, čísla, -)</Text>
            <Input className="bg-white">
              <InputField
                value={draft.slug}
                onChangeText={(value) => setDraft({ ...draft, slug: value })}
                placeholder="studio-belle"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Popis (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.description)}
                onChangeText={(value) => setDraft({ ...draft, description: value })}
                placeholder="O nás..."
                multiline
                className="min-h-[96px]"
              />
            </Input>
          </Box>
        </VStack>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Kontakt</Text>

        <VStack className="gap-3 mt-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Telefón (verejný)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.phone)}
                onChangeText={(value) => setDraft({ ...draft, phone: value })}
                placeholder="+421 9xx xxx xxx"
                keyboardType="phone-pad"
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Kontaktný telefón (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.contact_phone)}
                onChangeText={(value) => setDraft({ ...draft, contact_phone: value })}
                placeholder="+421 9xx xxx xxx"
                keyboardType="phone-pad"
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Email (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.email)}
                onChangeText={(value) => setDraft({ ...draft, email: value })}
                placeholder="info@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Web (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.website)}
                onChangeText={(value) => setDraft({ ...draft, website: value })}
                placeholder="https://..."
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>
        </VStack>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Sociálne siete</Text>

        <VStack className="gap-3 mt-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Facebook (URL)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.facebook)}
                onChangeText={(value) => setDraft({ ...draft, facebook: value })}
                placeholder="https://facebook.com/..."
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Instagram (URL)</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.instagram)}
                onChangeText={(value) => setDraft({ ...draft, instagram: value })}
                placeholder="https://instagram.com/..."
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>
        </VStack>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Adresa</Text>

        <VStack className="gap-3 mt-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Ulica a číslo</Text>
            <Input className="bg-white">
              <InputField
                value={toInput(draft.address_text)}
                onChangeText={(value) => setDraft({ ...draft, address_text: value })}
                placeholder="Hlavná 123"
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-2">Mesto</Text>
            <VStack className="gap-2">
              {(data.cities ?? []).map((city) => {
                const selected = draft.city_id === city.id;
                return (
                  <Pressable
                    key={city.id}
                    onPress={() => setDraft({ ...draft, city_id: city.id })}
                    className={
                      selected
                        ? "px-3 py-3 rounded border border-gray-900 bg-gray-900"
                        : "px-3 py-3 rounded border border-gray-200 bg-white"
                    }
                  >
                    <Text className={selected ? "text-white" : "text-gray-900"}>{city.name}</Text>
                  </Pressable>
                );
              })}
            </VStack>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-2">Mobilná prevádzka</Text>
            <HStack className="gap-2">
              <Pressable
                onPress={() => setDraft({ ...draft, is_mobile: false })}
                className={
                  !draft.is_mobile
                    ? "flex-1 px-3 py-3 rounded border border-gray-900 bg-gray-900"
                    : "flex-1 px-3 py-3 rounded border border-gray-200 bg-white"
                }
              >
                <Text className={!draft.is_mobile ? "text-white text-center" : "text-gray-900 text-center"}>Nie</Text>
              </Pressable>
              <Pressable
                onPress={() => setDraft({ ...draft, is_mobile: true })}
                className={
                  draft.is_mobile
                    ? "flex-1 px-3 py-3 rounded border border-gray-900 bg-gray-900"
                    : "flex-1 px-3 py-3 rounded border border-gray-200 bg-white"
                }
              >
                <Text className={draft.is_mobile ? "text-white text-center" : "text-gray-900 text-center"}>Áno</Text>
              </Pressable>
            </HStack>
          </Box>
        </VStack>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Kategórie</Text>

        <VStack className="gap-2 mt-3">
          <Text className="text-sm text-gray-600">Hlavná kategória</Text>
          {(data.categories ?? []).map((category) => {
            const selected = draft.category_id === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => setDraft({ ...draft, category_id: category.id })}
                className={
                  selected
                    ? "px-3 py-3 rounded border border-gray-900 bg-gray-900"
                    : "px-3 py-3 rounded border border-gray-200 bg-white"
                }
              >
                <Text className={selected ? "text-white" : "text-gray-900"}>{category.name}</Text>
              </Pressable>
            );
          })}
        </VStack>

        <Box className="mt-4">
          <Text className="text-sm text-gray-600">Extra kategórie</Text>
          {!draft.category_id ? (
            <Text className="text-gray-500 mt-2">Najprv vyberte hlavnú kategóriu.</Text>
          ) : (
            <VStack className="gap-2 mt-2">
              {data.categories
                .filter((c) => c.id !== draft.category_id)
                .map((category) => {
                  const selected = extraCategoryIds.includes(category.id);
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => toggleExtraCategory(category.id)}
                      className={
                        selected
                          ? "px-3 py-3 rounded border border-gray-900 bg-gray-900"
                          : "px-3 py-3 rounded border border-gray-200 bg-white"
                      }
                    >
                      <Text className={selected ? "text-white" : "text-gray-900"}>{category.name}</Text>
                    </Pressable>
                  );
                })}
            </VStack>
          )}
        </Box>
      </Box>

      {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

      <Button className="w-full" disabled={!canSaveProfile} onPress={handleSaveProfile}>
        {savingProfile ? <ButtonSpinner /> : null}
        <ButtonText>{savingProfile ? "Ukladám..." : "Uložiť"}</ButtonText>
      </Button>
    </VStack>
  );

  const renderAmenitiesTab = () => (
    <VStack className="gap-4">
      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Vybavenie</Text>
        <Text className="text-sm text-gray-500 mt-1">Vyberte všetko, čo máte k dispozícii.</Text>

        {(data.amenities ?? []).length === 0 ? (
          <Box className="py-6">
            <Text className="text-gray-600">Žiadne možnosti.</Text>
          </Box>
        ) : (
          <VStack className="gap-2 mt-4">
            {data.amenities.map((amenity) => {
              const selected = amenityIds.includes(amenity.id);
              return (
                <Pressable
                  key={amenity.id}
                  onPress={() => toggleAmenity(amenity.id)}
                  className={
                    selected
                      ? "px-3 py-3 rounded border border-gray-900 bg-gray-900"
                      : "px-3 py-3 rounded border border-gray-200 bg-white"
                  }
                >
                  <HStack className="items-center justify-between">
                    <Text className={selected ? "text-white" : "text-gray-900"}>{amenity.name}</Text>
                    {amenity.icon ? <Text className={selected ? "text-white/80" : "text-gray-500"}>{amenity.icon}</Text> : null}
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
        )}
      </Box>

      {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

      <Button className="w-full" disabled={!company?.id || savingAmenities} onPress={handleSaveAmenities}>
        {savingAmenities ? <ButtonSpinner /> : null}
        <ButtonText>{savingAmenities ? "Ukladám..." : "Uložiť vybavenie"}</ButtonText>
      </Button>
    </VStack>
  );

  const renderHoursTab = () => (
    <VStack className="gap-4">
      <Text className="text-sm text-gray-600">Zapnite dni a nastavte čas v tvare HH:MM (napr. 09:00).</Text>

      {dayOptions.map((day) => {
        const state = hoursState[day.value];
        return (
          <Box key={day.value} className="bg-white rounded-xl border border-gray-100 p-4">
            <HStack className="items-center justify-between">
              <Text className="text-base font-semibold text-gray-900">{day.label}</Text>
              <Pressable
                onPress={() => updateDayState(day.value, (prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={state.enabled ? "px-3 py-2 rounded bg-emerald-600" : "px-3 py-2 rounded bg-gray-200"}
              >
                <Text className={state.enabled ? "text-white" : "text-gray-800"}>{state.enabled ? "Zapnuté" : "Vypnuté"}</Text>
              </Pressable>
            </HStack>

            {state.enabled ? (
              <VStack className="gap-3 mt-4">
                <HStack className="gap-3">
                  <Box className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">Od</Text>
                    <Input className="bg-white">
                      <InputField
                        value={state.from}
                        onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, from: value }))}
                        placeholder="09:00"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </Input>
                  </Box>
                  <Box className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">Do</Text>
                    <Input className="bg-white">
                      <InputField
                        value={state.to}
                        onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, to: value }))}
                        placeholder="17:00"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </Input>
                  </Box>
                </HStack>

                <HStack className="gap-3">
                  <Box className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">Pauza od (voliteľné)</Text>
                    <Input className="bg-white">
                      <InputField
                        value={state.breakFrom}
                        onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, breakFrom: value }))}
                        placeholder="12:00"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </Input>
                  </Box>
                  <Box className="flex-1">
                    <Text className="text-xs text-gray-600 mb-1">Pauza do (voliteľné)</Text>
                    <Input className="bg-white">
                      <InputField
                        value={state.breakTo}
                        onChangeText={(value) => updateDayState(day.value, (prev) => ({ ...prev, breakTo: value }))}
                        placeholder="13:00"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </Input>
                  </Box>
                </HStack>
              </VStack>
            ) : null}
          </Box>
        );
      })}

      {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

      <Button className="w-full" disabled={!company?.id || savingHours} onPress={handleSaveHours}>
        {savingHours ? <ButtonSpinner /> : null}
        <ButtonText>{savingHours ? "Ukladám..." : "Uložiť hodiny"}</ButtonText>
      </Button>
    </VStack>
  );

  const renderExtrasTab = () => (
    <VStack className="gap-4">
      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Pridať / upraviť špeciálny deň</Text>
        <Text className="text-sm text-gray-500 mt-1">Dátum (YYYY-MM-DD). Nechajte časy prázdne pre „Zatvorené“.</Text>

        <VStack className="gap-3 mt-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Dátum</Text>
            <Input className="bg-white">
              <InputField value={extraDate} onChangeText={setExtraDate} placeholder="2026-01-17" autoCapitalize="none" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Dôvod (voliteľné)</Text>
            <Input className="bg-white">
              <InputField value={extraMessage} onChangeText={setExtraMessage} placeholder="Napr. Dovolenka" />
            </Input>
          </Box>

          <HStack className="gap-3">
            <Box className="flex-1">
              <Text className="text-xs text-gray-600 mb-1">Od</Text>
              <Input className="bg-white">
                <InputField value={extraFrom} onChangeText={setExtraFrom} placeholder="09:00" autoCapitalize="none" />
              </Input>
            </Box>
            <Box className="flex-1">
              <Text className="text-xs text-gray-600 mb-1">Do</Text>
              <Input className="bg-white">
                <InputField value={extraTo} onChangeText={setExtraTo} placeholder="13:00" autoCapitalize="none" />
              </Input>
            </Box>
          </HStack>

          <HStack className="gap-3">
            <Box className="flex-1">
              <Text className="text-xs text-gray-600 mb-1">Pauza od</Text>
              <Input className="bg-white">
                <InputField value={extraBreakFrom} onChangeText={setExtraBreakFrom} placeholder="" autoCapitalize="none" />
              </Input>
            </Box>
            <Box className="flex-1">
              <Text className="text-xs text-gray-600 mb-1">Pauza do</Text>
              <Input className="bg-white">
                <InputField value={extraBreakTo} onChangeText={setExtraBreakTo} placeholder="" autoCapitalize="none" />
              </Input>
            </Box>
          </HStack>

          <HStack className="gap-2">
            {editingExtraId ? (
              <Pressable onPress={resetExtraForm} className="flex-1 px-3 py-3 rounded border border-gray-200 bg-white">
                <Text className="text-center text-gray-900">Zrušiť úpravu</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => void handleSaveExtra()}
              className={savingExtra ? "flex-1 px-3 py-3 rounded bg-gray-200" : "flex-1 px-3 py-3 rounded bg-gray-900"}
            >
              <Text className={savingExtra ? "text-center text-gray-800" : "text-center text-white"}>
                {savingExtra ? "Ukladám..." : editingExtraId ? "Uložiť zmeny" : "Pridať"}
              </Text>
            </Pressable>
          </HStack>
        </VStack>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Zoznam špeciálnych dní</Text>

        {(extras ?? []).length === 0 ? (
          <Box className="py-6">
            <Text className="text-gray-600">Žiadne záznamy.</Text>
          </Box>
        ) : (
          <VStack className="gap-2 mt-4">
            {extras.map((row) => (
              <Pressable key={row.id} onPress={() => openExtraForEdit(row)} className="px-3 py-3 rounded border border-gray-100 bg-white">
                <HStack className="items-center justify-between">
                  <Box className="pr-3 flex-1">
                    <Text className="text-gray-900 font-medium">{row.date}</Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      {row.from_hour && row.to_hour
                        ? `${row.from_hour.slice(0, 5)} - ${row.to_hour.slice(0, 5)}`
                        : "Zatvorené"}
                      {row.message ? ` • ${row.message}` : ""}
                    </Text>
                  </Box>
                  <Pressable onPress={() => handleDeleteExtra(row.id)} className="p-2" hitSlop={8}>
                    <Trash2 size={18} color="#6b7280" />
                  </Pressable>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        )}
      </Box>

      {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}
    </VStack>
  );

  const renderPhotosTab = () => (
    <VStack className="gap-4">
      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Pridať fotku</Text>

        <VStack className="gap-3 mt-4">
          <Button className="w-full" disabled={savingPhotos} onPress={handlePickAndUploadPhoto}>
            {savingPhotos ? <ButtonSpinner /> : null}
            <ButtonText>{savingPhotos ? "Nahrávam..." : "Vybrať z galérie"}</ButtonText>
          </Button>
        </VStack>
      </Box>

      <Box className="bg-white rounded-xl border border-gray-100 p-4">
        <Text className="text-base font-semibold text-gray-900">Fotogaléria</Text>

        {photos.length === 0 ? (
          <Box className="py-6 items-center">
            <ImageIcon size={28} color="#9ca3af" />
            <Text className="text-gray-600 mt-2">Žiadne fotky.</Text>
          </Box>
          ) : (
          <VStack className="gap-3 mt-4">
            {(() => {
              const sortedPhotos = normalizePhotos(photos);
              return sortedPhotos.map((photo, index) => {
                const isCover = index === 0;
                const canSetCover = !isCover && !savingPhotos;
                const canMoveUp = index > 0 && !savingPhotos;
                const canMoveDown = index < sortedPhotos.length - 1 && !savingPhotos;

                return (
                  <Box key={photo.id} className="rounded-xl border border-gray-100 overflow-hidden bg-white">
                    <Box className="bg-gray-50">
                      <Box className="w-full h-[160px] bg-gray-100">
                        <Image
                          source={{ uri: photoDisplayUrls[photo.id] ?? photo.url }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </Box>
                    </Box>

                    <Box className="p-3">
                      <HStack className="items-center justify-between">
                        <Text className="text-gray-900 font-medium">{isCover ? "Titulná fotka" : `Fotka #${index + 1}`}</Text>
                        <Pressable
                          onPress={() => handleDeletePhoto(photo.id)}
                          className="p-2"
                          hitSlop={8}
                          disabled={savingPhotos}
                        >
                          <Trash2 size={18} color={savingPhotos ? "#d1d5db" : "#6b7280"} />
                        </Pressable>
                      </HStack>

                      <HStack className="gap-2 mt-2">
                        <Pressable
                          onPress={() => void handleSetCover(photo.id)}
                          disabled={!canSetCover}
                          className={
                            canSetCover
                              ? "flex-1 px-3 py-2 rounded bg-gray-900"
                              : "flex-1 px-3 py-2 rounded bg-gray-200"
                          }
                        >
                          <Text className={canSetCover ? "text-center text-white" : "text-center text-gray-800"}>
                            {isCover ? "Titulná ✓" : "Titulná"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void handleMovePhoto(photo.id, -1)}
                          disabled={!canMoveUp}
                          className={
                            canMoveUp
                              ? "flex-1 px-3 py-2 rounded border border-gray-200 bg-white"
                              : "flex-1 px-3 py-2 rounded border border-gray-200 bg-gray-100"
                          }
                        >
                          <Text className={canMoveUp ? "text-center text-gray-900" : "text-center text-gray-400"}>
                            Hore
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void handleMovePhoto(photo.id, 1)}
                          disabled={!canMoveDown}
                          className={
                            canMoveDown
                              ? "flex-1 px-3 py-2 rounded border border-gray-200 bg-white"
                              : "flex-1 px-3 py-2 rounded border border-gray-200 bg-gray-100"
                          }
                        >
                          <Text className={canMoveDown ? "text-center text-gray-900" : "text-center text-gray-400"}>
                            Dole
                          </Text>
                        </Pressable>
                      </HStack>
                    </Box>
                  </Box>
                );
              });
            })()}
          </VStack>
        )}
      </Box>

      {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}
    </VStack>
  );

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={22} color="#111827" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">Profil</Text>
          </HStack>
        </HStack>
      </Box>

      <Box className="py-3">{renderTabs()}</Box>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        {activeTab === "overview" ? renderOverviewTab() : null}
        {activeTab === "basic" ? renderBasicTab() : null}
        {activeTab === "amenities" ? renderAmenitiesTab() : null}
        {activeTab === "hours" ? renderHoursTab() : null}
        {activeTab === "extras" ? renderExtrasTab() : null}
        {activeTab === "photos" ? renderPhotosTab() : null}
      </ScrollView>
    </Box>
  );
}
