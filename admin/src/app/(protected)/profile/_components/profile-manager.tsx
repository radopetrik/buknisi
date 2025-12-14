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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import type {
  AmenityOption,
  BusinessHour,
  BusinessHourExtra,
  CompanyPhoto,
  CompanyProfile,
  CompanyProfileData,
  DayOfWeek,
} from "../types";

const dayOptions: Array<{ value: DayOfWeek; label: string; shortLabel: string }> = [
  { value: "monday", label: "Pondelok", shortLabel: "Po" },
  { value: "tuesday", label: "Utorok", shortLabel: "Ut" },
  { value: "wednesday", label: "Streda", shortLabel: "St" },
  { value: "thursday", label: "Štvrtok", shortLabel: "Št" },
  { value: "friday", label: "Piatok", shortLabel: "Pi" },
  { value: "saturday", label: "Sobota", shortLabel: "So" },
  { value: "sunday", label: "Nedeľa", shortLabel: "Ne" },
];

const COMPANY_PHOTOS_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_COMPANY_PHOTOS_BUCKET ?? "company_photos";

type DayHoursState = {
  id: string | null;
  open: boolean;
  from: string;
  to: string;
  hasBreak: boolean;
  breakFrom: string;
  breakTo: string;
};

type ProfileManagerProps = {
  initialData: CompanyProfileData;
};

const companyFormSchema = z.object({
  name: z.string().min(1, "Názov je povinný").max(160, "Maximálne 160 znakov"),
  slug: z
    .string()
    .min(1, "Slug je povinný")
    .max(160, "Maximálne 160 znakov")
    .regex(/^[a-z0-9-]+$/, "Použite len malé písmená, číslice a pomlčky"),
  description: z.string().max(1000, "Maximálne 1000 znakov").optional(),
  phone: z.string().max(120, "Max 120 znakov").optional(),
  contact_phone: z.string().max(120, "Max 120 znakov").optional(),
  email: z
    .string()
    .trim()
    .email("Neplatný email")
    .or(z.literal(""))
    .optional(),
  facebook: z
    .string()
    .trim()
    .regex(/^$|^https?:\/\//, "Zadajte URL s http(s)")
    .max(200, "Max 200 znakov")
    .optional(),
  instagram: z
    .string()
    .trim()
    .regex(/^$|^https?:\/\//, "Zadajte URL s http(s)")
    .max(200, "Max 200 znakov")
    .optional(),
  website: z
    .string()
    .trim()
    .regex(/^$|^https?:\/\//, "Zadajte URL s http(s)")
    .max(200, "Max 200 znakov")
    .optional(),
  address_text: z.string().max(255, "Max 255 znakov").optional(),
  city_id: z.string().optional(),
  category_id: z.string().optional(),
  is_mobile: z.boolean(),
});

const extraFormSchema = z
  .object({
    id: z.string().uuid().optional(),
    date: z.string().min(1, "Dátum je povinný"),
    message: z.string().max(200, "Max 200 znakov").optional(),
    from_hour: z.string().optional(),
    to_hour: z.string().optional(),
    break_from: z.string().optional(),
    break_to: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.from_hour && !value.to_hour) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Doplňte koniec otváracích hodín",
        path: ["to_hour"],
      });
    }
    if (value.to_hour && !value.from_hour) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Doplňte začiatok otváracích hodín",
        path: ["from_hour"],
      });
    }
    if (value.break_from && !value.break_to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Doplňte koniec prestávky",
        path: ["break_to"],
      });
    }
    if (value.break_to && !value.break_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Doplňte začiatok prestávky",
        path: ["break_from"],
      });
    }
  });

type CompanyFormValues = z.infer<typeof companyFormSchema>;

type ExtraFormValues = z.infer<typeof extraFormSchema>;

function toInputValue(value: string | null | undefined, fallback = "") {
  if (!value) {
    return fallback;
  }
  return value;
}

function toTimeInput(value: string | null | undefined, fallback = "09:00") {
  if (!value) {
    return fallback;
  }
  return value.slice(0, 5);
}

function toNullIfEmpty(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function toSupabaseTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.includes(":") ? `${trimmed}:00`.slice(0, 8) : `${trimmed}:00`;
}

function prepareInitialDayState(businessHours: BusinessHour[]): Record<DayOfWeek, DayHoursState> {
  const baseState: Record<DayOfWeek, DayHoursState> = {
    monday: { id: null, open: false, from: "09:00", to: "17:00", hasBreak: false, breakFrom: "12:00", breakTo: "13:00" },
    tuesday: { id: null, open: false, from: "09:00", to: "17:00", hasBreak: false, breakFrom: "12:00", breakTo: "13:00" },
    wednesday: { id: null, open: false, from: "09:00", to: "17:00", hasBreak: false, breakFrom: "12:00", breakTo: "13:00" },
    thursday: { id: null, open: false, from: "09:00", to: "17:00", hasBreak: false, breakFrom: "12:00", breakTo: "13:00" },
    friday: { id: null, open: false, from: "09:00", to: "17:00", hasBreak: false, breakFrom: "12:00", breakTo: "13:00" },
    saturday: { id: null, open: false, from: "09:00", to: "13:00", hasBreak: false, breakFrom: "11:00", breakTo: "11:30" },
    sunday: { id: null, open: false, from: "09:00", to: "13:00", hasBreak: false, breakFrom: "11:00", breakTo: "11:30" },
  };

  businessHours.forEach((hour) => {
    baseState[hour.day_in_week] = {
      id: hour.id,
      open: true,
      from: toTimeInput(hour.from_time, baseState[hour.day_in_week].from),
      to: toTimeInput(hour.to_time, baseState[hour.day_in_week].to),
      hasBreak: Boolean(hour.break_from_time && hour.break_to_time),
      breakFrom: toTimeInput(hour.break_from_time, baseState[hour.day_in_week].breakFrom),
      breakTo: toTimeInput(hour.break_to_time, baseState[hour.day_in_week].breakTo),
    };
  });

  return baseState;
}

function normalizePhotos(photos: CompanyPhoto[]) {
  return [...photos].sort((a, b) => a.ordering - b.ordering);
}

function getAmenityIcon(amenity: AmenityOption) {
  if (!amenity.icon) {
    return "";
  }
  return amenity.icon;
}

export function ProfileManager({ initialData }: ProfileManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<"overview" | "basic" | "amenities" | "hours" | "extras" | "photos">("basic");
  const [company, setCompany] = useState<CompanyProfile>(initialData.company);
  const [amenityState, setAmenityState] = useState<string[]>(initialData.selectedAmenityIds);
  const [businessHoursState, setBusinessHoursState] = useState<Record<DayOfWeek, DayHoursState>>(
    () => prepareInitialDayState(initialData.businessHours),
  );
  const [extras, setExtras] = useState<BusinessHourExtra[]>([...initialData.businessHourExtras].sort((a, b) => a.date.localeCompare(b.date)));
  const [photos, setPhotos] = useState<CompanyPhoto[]>(() => normalizePhotos(initialData.photos));

  const tabItems = [
    { key: "overview" as const, label: "Náhľad" },
    { key: "basic" as const, label: "Základ" },
    { key: "amenities" as const, label: "Vybavenie" },
    { key: "hours" as const, label: "Otváracie hodiny" },
    { key: "extras" as const, label: "Špeciálne dni" },
    { key: "photos" as const, label: "Fotky" },
  ];

  const [overviewMessage, setOverviewMessage] = useState<string | null>(null);
  const [amenityMessage, setAmenityMessage] = useState<string | null>(null);
  const [hoursMessage, setHoursMessage] = useState<string | null>(null);
  const [extrasMessage, setExtrasMessage] = useState<string | null>(null);
  const [photosMessage, setPhotosMessage] = useState<string | null>(null);

  const [isOverviewPending, startOverviewTransition] = useTransition();
  const [isAmenityPending, startAmenityTransition] = useTransition();
  const [isHoursPending, startHoursTransition] = useTransition();
  const [isExtrasPending, startExtrasTransition] = useTransition();
  const [isPhotosPending, startPhotosTransition] = useTransition();

  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<BusinessHourExtra | null>(null);

  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: initialData.company.name,
      slug: initialData.company.slug,
      description: toInputValue(initialData.company.description ?? ""),
      phone: toInputValue(initialData.company.phone ?? ""),
      contact_phone: toInputValue(initialData.company.contact_phone ?? ""),
      email: toInputValue(initialData.company.email ?? ""),
      facebook: toInputValue(initialData.company.facebook ?? ""),
      instagram: toInputValue(initialData.company.instagram ?? ""),
      website: toInputValue(initialData.company.website ?? ""),
      address_text: toInputValue(initialData.company.address_text ?? ""),
      city_id: toInputValue(initialData.company.city_id ?? ""),
      category_id: toInputValue(initialData.company.category_id ?? ""),
      is_mobile: initialData.company.is_mobile,
    },
  });

  const extraForm = useForm<ExtraFormValues>({
    resolver: zodResolver(extraFormSchema),
    defaultValues: {
      id: undefined,
      date: "",
      message: "",
      from_hour: "",
      to_hour: "",
      break_from: "",
      break_to: "",
    },
  });

  const openExtraDialog = (extra: BusinessHourExtra | null = null) => {
    setExtrasMessage(null);
    setEditingExtra(extra);
    if (extra) {
      extraForm.reset({
        id: extra.id,
        date: extra.date,
        message: toInputValue(extra.message ?? ""),
        from_hour: toTimeInput(extra.from_hour, ""),
        to_hour: toTimeInput(extra.to_hour, ""),
        break_from: toTimeInput(extra.break_from, ""),
        break_to: toTimeInput(extra.break_to, ""),
      });
    } else {
      extraForm.reset({
        id: undefined,
        date: "",
        message: "",
        from_hour: "",
        to_hour: "",
        break_from: "",
        break_to: "",
      });
    }
    setExtraDialogOpen(true);
  };

  const closeExtraDialog = () => {
    setExtraDialogOpen(false);
    setEditingExtra(null);
    extraForm.reset({
      id: undefined,
      date: "",
      message: "",
      from_hour: "",
      to_hour: "",
      break_from: "",
      break_to: "",
    });
  };

  const closePhotoDialog = () => {
    setPhotoDialogOpen(false);
    setPhotoFile(null);
  };

  const overviewValues = companyForm.watch();

  const previewAddressParts = [overviewValues.address_text, initialData.cities.find((city) => city.id === overviewValues.city_id)?.name]
    .filter(Boolean)
    .join(", ");

  const selectedAmenities = useMemo(
    () =>
      initialData.amenities
        .filter((amenity) => amenityState.includes(amenity.id))
        .map((amenity) => amenity.name),
    [amenityState, initialData.amenities],
  );

  const handleOverviewSubmit = (values: CompanyFormValues) => {
    setOverviewMessage(null);
    startOverviewTransition(() => {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: toNullIfEmpty(values.description ?? null),
        phone: toNullIfEmpty(values.phone ?? null),
        contact_phone: toNullIfEmpty(values.contact_phone ?? null),
        email: toNullIfEmpty(values.email ?? null),
        facebook: toNullIfEmpty(values.facebook ?? null),
        instagram: toNullIfEmpty(values.instagram ?? null),
        website: toNullIfEmpty(values.website ?? null),
        address_text: toNullIfEmpty(values.address_text ?? null),
        city_id: toNullIfEmpty(values.city_id ?? null),
        category_id: toNullIfEmpty(values.category_id ?? null),
        is_mobile: values.is_mobile,
      } as const;

      supabase
        .from("companies")
        .update(payload)
        .eq("id", company.id)
        .select("id, name, slug, description, phone, contact_phone, email, facebook, instagram, website, address_text, city_id, category_id, is_mobile")
        .single()
        .then(({ data, error }) => {
          if (error) {
            setOverviewMessage(error.message);
            return;
          }
          if (data) {
            setCompany(data as CompanyProfile);
            companyForm.reset({
              name: data.name ?? "",
              slug: data.slug ?? "",
              description: toInputValue(data.description ?? ""),
              phone: toInputValue(data.phone ?? ""),
              contact_phone: toInputValue(data.contact_phone ?? ""),
              email: toInputValue(data.email ?? ""),
              facebook: toInputValue(data.facebook ?? ""),
              instagram: toInputValue(data.instagram ?? ""),
              website: toInputValue(data.website ?? ""),
              address_text: toInputValue(data.address_text ?? ""),
              city_id: toInputValue(data.city_id ?? ""),
              category_id: toInputValue(data.category_id ?? ""),
              is_mobile: data.is_mobile ?? false,
            });
            setOverviewMessage("Profil uložený");
            router.refresh();
          }
        });
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setAmenityState((prev) => {
      if (prev.includes(amenityId)) {
        return prev.filter((id) => id !== amenityId);
      }
      return [...prev, amenityId];
    });
  };

  const handleSaveAmenities = () => {
    setAmenityMessage(null);
    startAmenityTransition(async () => {
      const selected = Array.from(new Set(amenityState));

      const deleteResult = await supabase
        .from("company_amenities")
        .delete()
        .eq("company_id", company.id);

      if (deleteResult.error) {
        setAmenityMessage(deleteResult.error.message);
        return;
      }

      if (selected.length > 0) {
        const insertResult = await supabase
          .from("company_amenities")
          .insert(selected.map((amenityId) => ({ company_id: company.id, amenity_id: amenityId })));
        if (insertResult.error) {
          setAmenityMessage(insertResult.error.message);
          return;
        }
      }

      setAmenityMessage("Vybavenie uložené");
      router.refresh();
    });
  };

  const updateDayState = (day: DayOfWeek, updater: (state: DayHoursState) => DayHoursState) => {
    setBusinessHoursState((prev) => ({
      ...prev,
      [day]: updater(prev[day]),
    }));
  };

  const handleSaveHours = () => {
    setHoursMessage(null);
    startHoursTransition(async () => {
      const openEntries = dayOptions
        .map(({ value }) => ({ day: value, state: businessHoursState[value] }))
        .filter(({ state }) => state.open);

      const invalidEntry = openEntries.find(({ state }) => state.from >= state.to);
      if (invalidEntry) {
        setHoursMessage("Skontrolujte čas od/do – začiatok musí byť skôr ako koniec.");
        return;
      }

      const invalidBreak = openEntries.find(
        ({ state }) =>
          state.hasBreak && (
            !state.breakFrom ||
            !state.breakTo ||
            state.breakFrom >= state.breakTo ||
            state.breakFrom <= state.from ||
            state.breakTo >= state.to
          ),
      );
      if (invalidBreak) {
        setHoursMessage("Prestávka musí byť medzi otváracími hodinami a v správnom poradí.");
        return;
      }

      const payload = openEntries.map(({ day, state }) => {
        const base = {
          company_id: company.id,
          day_in_week: day,
          from_time: toSupabaseTime(state.from)!,
          to_time: toSupabaseTime(state.to)!,
          break_from_time: state.hasBreak ? toSupabaseTime(state.breakFrom) : null,
          break_to_time: state.hasBreak ? toSupabaseTime(state.breakTo) : null,
        };
        if (state.id) {
          return { ...base, id: state.id };
        }
        return base;
      });

      const closedDays = dayOptions
        .map(({ value }) => ({ day: value, state: businessHoursState[value] }))
        .filter(({ state }) => !state.open && state.id)
        .map(({ day }) => day);

      const upsertResult = await supabase
        .from("company_business_hours")
        .upsert(payload, { onConflict: "company_id,day_in_week", returning: "minimal" });

      if (upsertResult.error) {
        const message = upsertResult.error.message.includes("violates row-level security policy")
          ? "Nemáte oprávnenie upravovať otváracie hodiny pre túto firmu."
          : upsertResult.error.message;
        setHoursMessage(message);
        return;
      }

      if (closedDays.length > 0) {
        const deleteResult = await supabase
          .from("company_business_hours")
          .delete()
          .eq("company_id", company.id)
          .in("day_in_week", closedDays);
        if (deleteResult.error) {
          const message = deleteResult.error.message.includes("violates row-level security policy")
            ? "Nemáte oprávnenie upravovať otváracie hodiny pre túto firmu."
            : deleteResult.error.message;
          setHoursMessage(message);
          return;
        }
      }

      const { data: refreshedHours, error: fetchHoursError } = await supabase
        .from("company_business_hours")
        .select("id, day_in_week, from_time, to_time, break_from_time, break_to_time")
        .eq("company_id", company.id);

      if (fetchHoursError) {
        setHoursMessage(fetchHoursError.message);
        return;
      }

      const refreshedState = prepareInitialDayState((refreshedHours ?? []) as BusinessHour[]);
      closedDays.forEach((day) => {
        refreshedState[day].open = false;
        refreshedState[day].id = null;
      });
      setBusinessHoursState(refreshedState);
      setHoursMessage("Otváracie hodiny uložené");
      router.refresh();
    });
  };

  const handleExtraSubmit = (values: ExtraFormValues) => {
    setExtrasMessage(null);
    startExtrasTransition(async () => {
      const payload = {
        company_id: company.id,
        date: values.date,
        message: toNullIfEmpty(values.message ?? null),
        from_hour: toSupabaseTime(values.from_hour),
        to_hour: toSupabaseTime(values.to_hour),
        break_from: toSupabaseTime(values.break_from),
        break_to: toSupabaseTime(values.break_to),
      };

      if (values.from_hour && values.to_hour && values.from_hour >= values.to_hour) {
        setExtrasMessage("Začiatok musí byť skôr ako koniec");
        return;
      }
      if (values.break_from && values.break_to && values.break_from >= values.break_to) {
        setExtrasMessage("Prestávka musí mať správne poradie");
        return;
      }

      const result = values.id
        ? await supabase
            .from("company_business_hours_extras")
            .update(payload, { returning: "minimal" })
            .eq("id", values.id)
        : await supabase
            .from("company_business_hours_extras")
            .insert(payload, { returning: "minimal" });

      if (result.error) {
        const message = result.error.message.includes("violates row-level security policy")
          ? "Nemáte oprávnenie upravovať špeciálne dni pre túto firmu."
          : result.error.message;
        setExtrasMessage(message);
        return;
      }

      const { data: refreshedExtras, error: fetchError } = await supabase
        .from("company_business_hours_extras")
        .select("id, date, message, from_hour, to_hour, break_from, break_to")
        .eq("company_id", company.id)
        .order("date", { ascending: true });

      if (fetchError) {
        setExtrasMessage(fetchError.message);
        return;
      }

      setExtras((refreshedExtras ?? []) as BusinessHourExtra[]);
      setExtrasMessage("Špeciálny deň uložený");
      closeExtraDialog();
      router.refresh();
    });
  };

  const handleExtraDelete = (extraId: string) => {
    setExtrasMessage(null);
    startExtrasTransition(async () => {
      const result = await supabase.from("company_business_hours_extras").delete().eq("id", extraId);
      if (result.error) {
        setExtrasMessage(result.error.message);
        return;
      }
      setExtras((prev) => prev.filter((item) => item.id !== extraId));
      setExtrasMessage("Záznam odstránený");
      router.refresh();
    });
  };

  const handleUploadPhoto = () => {
    if (!photoFile) {
      setPhotosMessage("Vyberte súbor fotografie");
      return;
    }
    setPhotosMessage(null);
    startPhotosTransition(async () => {
      const file = photoFile;
      const extensionMatch = file.name?.split(".").pop();
      const extension = extensionMatch ? extensionMatch.toLowerCase() : "jpg";
      const sanitizedExtension = extension.replace(/[^a-z0-9]/gi, "") || "jpg";
      const uniqueId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const storagePath = `${company.id}/${uniqueId}.${sanitizedExtension}`;

      const uploadResult = await supabase.storage
        .from(COMPANY_PHOTOS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadResult.error) {
        const message = uploadResult.error.message.includes("Bucket not found")
          ? `Bucket "${COMPANY_PHOTOS_BUCKET}" neexistuje alebo nie je verejne prístupný.`
          : uploadResult.error.message;
        setPhotosMessage(message);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(COMPANY_PHOTOS_BUCKET).getPublicUrl(storagePath);
      const publicUrl = publicUrlData.publicUrl;
      if (!publicUrl) {
        setPhotosMessage("Nepodarilo sa získať URL fotografie");
        await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([storagePath]);
        return;
      }

      const ordering = photos.length;
      const insertResult = await supabase
        .from("photos")
        .insert({ company_id: company.id, url: publicUrl, ordering }, { returning: "minimal" });

      if (insertResult.error) {
        const message = insertResult.error.message.includes("violates row-level security policy")
          ? "Nemáte oprávnenie pridávať fotografie pre túto firmu. Skontrolujte RLS politiky."
          : insertResult.error.message;
        setPhotosMessage(message);
        await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([storagePath]);
        return;
      }

      const { data: refreshedPhotos, error: fetchError } = await supabase
        .from("photos")
        .select("id, ordering, url")
        .eq("company_id", company.id)
        .order("ordering", { ascending: true });

      if (fetchError) {
        setPhotosMessage(fetchError.message);
        return;
      }

      const nextPhotos = (refreshedPhotos ?? []) as CompanyPhoto[];
      setPhotos(normalizePhotos(nextPhotos));
      setPhotosMessage("Fotografia pridaná");
      closePhotoDialog();
      router.refresh();
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotosMessage(null);
    startPhotosTransition(async () => {
      const targetPhoto = photos.find((photo) => photo.id === photoId) ?? null;
      const result = await supabase.from("photos").delete().eq("id", photoId);
      if (result.error) {
        setPhotosMessage(result.error.message);
        return;
      }

      let removalError: string | null = null;
      if (targetPhoto) {
        const marker = `/storage/v1/object/public/${COMPANY_PHOTOS_BUCKET}/`;
        const markerIndex = targetPhoto.url.indexOf(marker);
        if (markerIndex !== -1) {
          const relativePath = decodeURIComponent(targetPhoto.url.slice(markerIndex + marker.length));
          if (relativePath) {
            const removeResult = await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([relativePath]);
            if (removeResult.error) {
              removalError = removeResult.error.message.includes("Bucket not found")
                ? `Bucket "${COMPANY_PHOTOS_BUCKET}" neexistuje alebo nie je verejne prístupný.`
                : removeResult.error.message;
            }
          }
        }
      }

      const currentPhotos = normalizePhotos(photos);
      const remaining = currentPhotos.filter((photo) => photo.id !== photoId);
      const reordered = remaining.map((photo, index) => ({ ...photo, ordering: index }));
      const success = await reorderAndPersistPhotos(reordered);
      if (success) {
        setPhotosMessage(removalError ?? "Fotografia odstránená");
      } else if (removalError) {
        setPhotosMessage(removalError);
      }
    });
  };

  const reorderAndPersistPhotos = async (nextOrder: CompanyPhoto[]) => {
    const updates = nextOrder.map((photo, index) =>
      supabase.from("photos").update({ ordering: index }).eq("id", photo.id),
    );
    const results = await Promise.all(updates);
    const error = results.find((result) => result.error)?.error;
    if (error) {
      setPhotosMessage(error.message);
      return false;
    }
    setPhotos(normalizePhotos(nextOrder.map((photo, index) => ({ ...photo, ordering: index }))));
    router.refresh();
    return true;
  };

  const handleSetCover = (photoId: string) => {
    setPhotosMessage(null);
    startPhotosTransition(async () => {
      const sorted = normalizePhotos(photos);
      const target = sorted.find((photo) => photo.id === photoId);
      if (!target) {
        return;
      }
      const others = sorted.filter((photo) => photo.id !== photoId);
      const nextOrder = [target, ...others].map((photo, index) => ({ ...photo, ordering: index }));
      const success = await reorderAndPersistPhotos(nextOrder);
      if (success) {
        setPhotosMessage("Fotografia nastavená ako titulná");
      }
    });
  };

  const handleMovePhoto = (photoId: string, direction: -1 | 1) => {
    setPhotosMessage(null);
    startPhotosTransition(async () => {
      const sorted = normalizePhotos(photos);
      const index = sorted.findIndex((photo) => photo.id === photoId);
      if (index === -1) {
        return;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= sorted.length) {
        return;
      }
      const nextOrder = [...sorted];
      const [removed] = nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, removed);
      const success = await reorderAndPersistPhotos(nextOrder);
      if (success) {
        setPhotosMessage("Poradie aktualizované");
      }
    });
  };

  const renderBasicTab = () => (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>Základné informácie</CardTitle>
        <CardDescription>Aktualizujte údaje tak, ako sa zobrazia v katalógu.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...companyForm}>
          <form className="space-y-6" onSubmit={companyForm.handleSubmit(handleOverviewSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Názov prevádzky</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Studio Belle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (adresa v katalógu)</FormLabel>
                    <FormControl>
                      <Input placeholder="studio-belle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={companyForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      placeholder="Predstavte vašu firmu, služby a prístup."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={companyForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefón na prevádzku</FormLabel>
                    <FormControl>
                      <Input placeholder="+421 999 888 777" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefón na kontakt</FormLabel>
                    <FormControl>
                      <Input placeholder="+421 999 888 111" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={companyForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="info@studiobelle.sk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://studiobelle.sk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={companyForm.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/studiobelle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/studiobelle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <FormField
              control={companyForm.control}
              name="address_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Napr. Námestie 123, Bratislava" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={companyForm.control}
                name="city_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mesto</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      >
                        <option value="">-- Vyberte mesto --</option>
                        {initialData.cities.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategória</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      >
                        <option value="">-- Vyberte kategóriu --</option>
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
              control={companyForm.control}
              name="is_mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobilná prevádzka</FormLabel>
                  <FormControl>
                    <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                      />
                      <span>Pracujem v teréne / u klienta</span>
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 border-t pt-4">
              {overviewMessage ? <p className="text-sm text-muted-foreground">{overviewMessage}</p> : null}
              <div className="flex justify-end">
                <Button type="submit" disabled={isOverviewPending}>
                  {isOverviewPending ? "Ukladám..." : "Uložiť profil"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderOverviewTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Náhľad profilu</CardTitle>
        <CardDescription>Kontrolujte, ako sa firma zobrazí v katalógu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          {photos[0] ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0].url} alt={overviewValues.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-border/60 text-sm text-muted-foreground">
              Bez titulnej fotografie
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-foreground">{overviewValues.name}</h2>
            {previewAddressParts ? <p className="text-sm text-muted-foreground">{previewAddressParts}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {overviewValues.phone ? <span className="rounded-full bg-muted px-3 py-1">Tel.: {overviewValues.phone}</span> : null}
            {overviewValues.email ? <span className="rounded-full bg-muted px-3 py-1">Email: {overviewValues.email}</span> : null}
            {overviewValues.website ? <span className="rounded-full bg-muted px-3 py-1">Web</span> : null}
            {overviewValues.facebook ? <span className="rounded-full bg-muted px-3 py-1">Facebook</span> : null}
            {overviewValues.instagram ? <span className="rounded-full bg-muted px-3 py-1">Instagram</span> : null}
            {overviewValues.is_mobile ? <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Mobilná prevádzka</span> : null}
          </div>
          {overviewValues.description ? (
            <p className="text-sm text-muted-foreground">{overviewValues.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Doplňte popis, aby klienti vedeli, čo ponúkate.</p>
          )}
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Vybavenie</p>
            {selectedAmenities.length === 0 ? (
              <p className="text-xs text-muted-foreground">Zvýraznite benefity výberom vybavenia.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedAmenities.map((name) => (
                  <span key={name} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAmenitiesTab = () => (

    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>Vybavenie</CardTitle>
        <CardDescription>Vyberte benefity, ktoré sa zobrazia klientom.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialData.amenities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žiadne dostupné vybavenie. Kontaktujte administrátora.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {initialData.amenities.map((amenity) => {
              const checked = amenityState.includes(amenity.id);
              return (
                <label
                  key={amenity.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors",
                    checked ? "border-primary/60 ring-2 ring-primary/70" : "border-border/60 hover:border-primary/40",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                  />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-foreground">{amenity.name}</span>
                    {amenity.icon ? <span className="text-xs text-muted-foreground">{getAmenityIcon(amenity)}</span> : null}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t pt-4">
          {amenityMessage ? <p className="text-sm text-muted-foreground">{amenityMessage}</p> : null}
          <div className="flex justify-end">
            <Button type="button" onClick={handleSaveAmenities} disabled={isAmenityPending}>
              {isAmenityPending ? "Ukladám..." : "Uložiť výber"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderHoursTab = () => (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>Otváracie hodiny</CardTitle>
        <CardDescription>Nastavte pravidelné hodiny pre každý deň.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {dayOptions.map(({ value, label }) => {
            const state = businessHoursState[value];
            return (
              <div
                key={value}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={state.open}
                      onChange={(event) =>
                        updateDayState(value, (prevState) => ({
                          ...prevState,
                          open: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/70"
                    />
                    <span>{label}</span>
                  </label>
                </div>
                {state.open ? (
                  <div className="flex w-full flex-col gap-3 md:w-auto">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Od</Label>
                        <input
                          type="time"
                          value={state.from}
                          onChange={(event) =>
                            updateDayState(value, (prevState) => ({
                              ...prevState,
                              from: event.target.value,
                            }))
                          }
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Do</Label>
                        <input
                          type="time"
                          value={state.to}
                          onChange={(event) =>
                            updateDayState(value, (prevState) => ({
                              ...prevState,
                              to: event.target.value,
                            }))
                          }
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateDayState(value, (prevState) => ({
                            ...prevState,
                            hasBreak: !prevState.hasBreak,
                            breakFrom: prevState.hasBreak ? prevState.breakFrom : prevState.breakFrom || "12:00",
                            breakTo: prevState.hasBreak ? prevState.breakTo : prevState.breakTo || "12:30",
                          }))
                        }
                      >
                        {state.hasBreak ? "Bez prestávky" : "Pridať prestávku"}
                      </Button>
                      {state.hasBreak ? (
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prestávka od</Label>
                            <input
                              type="time"
                              value={state.breakFrom}
                              onChange={(event) =>
                                updateDayState(value, (prevState) => ({
                                  ...prevState,
                                  breakFrom: event.target.value,
                                }))
                              }
                              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prestávka do</Label>
                            <input
                              type="time"
                              value={state.breakTo}
                              onChange={(event) =>
                                updateDayState(value, (prevState) => ({
                                  ...prevState,
                                  breakTo: event.target.value,
                                }))
                              }
                              className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Zatvorené</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          {hoursMessage ? <p className="text-sm text-muted-foreground">{hoursMessage}</p> : null}
          <div className="flex justify-end">
            <Button type="button" onClick={handleSaveHours} disabled={isHoursPending}>
              {isHoursPending ? "Ukladám..." : "Uložiť otváracie hodiny"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderExtrasTab = () => (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Špeciálne dni</CardTitle>
            <CardDescription>Pozastavenie prevádzky alebo upravené časy.</CardDescription>
          </div>
          <Button type="button" onClick={() => openExtraDialog(null)}>
            Nový záznam
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {extras.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatiaľ žiadne špeciálne dni. Pridajte prvý záznam.</p>
        ) : (
          <div className="space-y-3">
            {extras.map((extra) => (
              <div
                key={extra.id}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span>{new Date(extra.date).toLocaleDateString("sk-SK")}</span>
                    {extra.message ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{extra.message}</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {extra.from_hour && extra.to_hour
                      ? `Otvorené ${extra.from_hour.slice(0, 5)} – ${extra.to_hour.slice(0, 5)}`
                      : "Zatvorené"}
                  </p>
                  {extra.break_from && extra.break_to ? (
                    <p className="text-xs text-muted-foreground">
                      Prestávka {extra.break_from.slice(0, 5)} – {extra.break_to.slice(0, 5)}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" type="button" onClick={() => openExtraDialog(extra)} disabled={isExtrasPending}>
                    Upraviť
                  </Button>
                  <Button size="sm" variant="destructive" type="button" onClick={() => handleExtraDelete(extra.id)} disabled={isExtrasPending}>
                    Vymazať
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {extrasMessage ? <p className="text-sm text-muted-foreground">{extrasMessage}</p> : null}
      </CardContent>

      <Dialog open={extraDialogOpen} onOpenChange={(open) => (open ? setExtraDialogOpen(true) : closeExtraDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExtra ? "Upraviť špeciálny deň" : "Nový špeciálny deň"}</DialogTitle>
            <DialogDescription>Zadajte dátum a voliteľne upravte otváraciu dobu.</DialogDescription>
          </DialogHeader>
          <Form {...extraForm}>
            <form className="space-y-4" onSubmit={extraForm.handleSubmit(handleExtraSubmit)}>
              <FormField
                control={extraForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dátum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={extraForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Správa (voliteľné)</FormLabel>
                    <FormControl>
                      <Input placeholder="Napr. Štátne sviatky" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={extraForm.control}
                  name="from_hour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Od</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={extraForm.control}
                  name="to_hour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={extraForm.control}
                  name="break_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prestávka od</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={extraForm.control}
                  name="break_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prestávka do</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {extrasMessage ? <p className="text-sm text-muted-foreground">{extrasMessage}</p> : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeExtraDialog} disabled={isExtrasPending}>
                  Zrušiť
                </Button>
                <Button type="submit" disabled={isExtrasPending}>
                  {isExtrasPending ? "Ukladám..." : "Uložiť"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );

  const renderPhotosTab = () => (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Fotografie</CardTitle>
            <CardDescription>Nahrajte obrázky a nastavte titulnú fotku.</CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => {
              setPhotosMessage(null);
              setPhotoFile(null);
              setPhotoDialogOpen(true);
            }}
          >
            Nahrať fotografiu
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Zatiaľ žiadne fotografie. Pridajte prvú.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <div key={photo.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-3">
                <div className="relative h-40 w-full overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="Company photo" className="h-full w-full object-cover" />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      Titulná
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => handleMovePhoto(photo.id, -1)} disabled={isPhotosPending || index === 0}>
                    Hore
                  </Button>
                  <Button size="sm" variant="outline" type="button" onClick={() => handleMovePhoto(photo.id, 1)} disabled={isPhotosPending || index === photos.length - 1}>
                    Dole
                  </Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => handleSetCover(photo.id)} disabled={isPhotosPending || index === 0}>
                    Nastaviť titulnú
                  </Button>
                  <Button size="sm" variant="destructive" type="button" onClick={() => handleDeletePhoto(photo.id)} disabled={isPhotosPending}>
                    Zmazať
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {photosMessage ? <p className="text-sm text-muted-foreground">{photosMessage}</p> : null}
      </CardContent>

      <Dialog open={photoDialogOpen} onOpenChange={(open) => (open ? setPhotoDialogOpen(true) : closePhotoDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nahrať fotografiu</DialogTitle>
            <DialogDescription>Vyberte obrázok z počítača, odporúčame pomer 16:9.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} />
            {photoFile ? (
              <p className="text-sm text-muted-foreground">Vybrané: {photoFile.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Podporované formáty: JPG, PNG, WEBP.</p>
            )}
            {photosMessage ? <p className="text-sm text-muted-foreground">{photosMessage}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePhotoDialog} disabled={isPhotosPending}>
                Zrušiť
              </Button>
              <Button type="button" onClick={handleUploadPhoto} disabled={isPhotosPending}>
                {isPhotosPending ? "Nahrávam..." : "Nahrať"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "basic":
        return renderBasicTab();
      case "amenities":
        return renderAmenitiesTab();
      case "hours":
        return renderHoursTab();
      case "extras":
        return renderExtrasTab();
      case "photos":
        return renderPhotosTab();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {tabItems.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            size="sm"
            variant={activeTab === tab.key ? "default" : "secondary"}
            onClick={() => setActiveTab(tab.key)}
            className={cn("transition-colors", activeTab === tab.key ? "" : "bg-muted hover:bg-muted/80")}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="space-y-6">{renderActiveTab()}</div>
    </div>
  );
}
