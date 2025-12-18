"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Calendar,
  Camera,
  Check,
  Clock,
  ExternalLink,
  Facebook,
  Globe,
  Image as ImageIcon,
  Info,
  Instagram,
  LayoutTemplate,
  Mail,
  MapPin,
  Phone,
  Plus,
  Settings2,
  Store,
  Trash2,
  Wifi,
  AlertTriangle,
} from "lucide-react";

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


type StatusMessage = { text: string; type: "success" | "error" } | null;

export function ProfileManager({ initialData }: ProfileManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<"overview" | "basic" | "amenities" | "hours" | "extras" | "photos">("overview");
  const [company, setCompany] = useState<CompanyProfile>(initialData.company);
  const [amenityState, setAmenityState] = useState<string[]>(initialData.selectedAmenityIds);
  const [businessHoursState, setBusinessHoursState] = useState<Record<DayOfWeek, DayHoursState>>(
    () => prepareInitialDayState(initialData.businessHours),
  );
  const [extras, setExtras] = useState<BusinessHourExtra[]>([...initialData.businessHourExtras].sort((a, b) => a.date.localeCompare(b.date)));
  const [photos, setPhotos] = useState<CompanyPhoto[]>(() => normalizePhotos(initialData.photos));

  const tabItems = [
    { key: "overview" as const, label: "Náhľad", icon: LayoutTemplate },
    { key: "basic" as const, label: "Základ", icon: Store },
    { key: "amenities" as const, label: "Vybavenie", icon: Wifi },
    { key: "hours" as const, label: "Hodiny", icon: Clock },
    { key: "extras" as const, label: "Špeciálne dni", icon: Calendar },
    { key: "photos" as const, label: "Fotky", icon: ImageIcon },
  ];

  const [overviewMessage, setOverviewMessage] = useState<StatusMessage>(null);
  const [amenityMessage, setAmenityMessage] = useState<StatusMessage>(null);
  const [hoursMessage, setHoursMessage] = useState<StatusMessage>(null);
  const [extrasMessage, setExtrasMessage] = useState<StatusMessage>(null);
  const [photosMessage, setPhotosMessage] = useState<StatusMessage>(null);

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
            setOverviewMessage({ text: error.message, type: "error" });
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
            setOverviewMessage({ text: "Profil uložený", type: "success" });
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
        setAmenityMessage({ text: deleteResult.error.message, type: "error" });
        return;
      }

      if (selected.length > 0) {
        const insertResult = await supabase
          .from("company_amenities")
          .insert(selected.map((amenityId) => ({ company_id: company.id, amenity_id: amenityId })));
        if (insertResult.error) {
          setAmenityMessage({ text: insertResult.error.message, type: "error" });
          return;
        }
      }

      setAmenityMessage({ text: "Vybavenie uložené", type: "success" });
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
        setHoursMessage({ text: "Skontrolujte čas od/do – začiatok musí byť skôr ako koniec.", type: "error" });
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
        setHoursMessage({ text: "Prestávka musí byť medzi otváracími hodinami a v správnom poradí.", type: "error" });
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
        // Do not include 'id' in the payload for upsert. Rely on onConflict.
        return base;
      });

      const closedDays = dayOptions
        .map(({ value }) => ({ day: value, state: businessHoursState[value] }))
        .filter(({ state }) => !state.open && state.id)
        .map(({ day }) => day);

      const upsertResult = await supabase
        .from("company_business_hours")
        .upsert(payload, { onConflict: "company_id,day_in_week" });

      if (upsertResult.error) {
        const message = upsertResult.error.message.includes("violates row-level security policy")
          ? "Nemáte oprávnenie upravovať otváracie hodiny pre túto firmu."
          : upsertResult.error.message;
        setHoursMessage({ text: message, type: "error" });
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
          setHoursMessage({ text: message, type: "error" });
          return;
        }
      }

      const { data: refreshedHours, error: fetchHoursError } = await supabase
        .from("company_business_hours")
        .select("id, day_in_week, from_time, to_time, break_from_time, break_to_time")
        .eq("company_id", company.id);

      if (fetchHoursError) {
        setHoursMessage({ text: fetchHoursError.message, type: "error" });
        return;
      }

      const refreshedState = prepareInitialDayState((refreshedHours ?? []) as BusinessHour[]);
      closedDays.forEach((day) => {
        refreshedState[day].open = false;
        refreshedState[day].id = null;
      });
      setBusinessHoursState(refreshedState);
      setHoursMessage({ text: "Otváracie hodiny uložené", type: "success" });
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
        setExtrasMessage({ text: "Začiatok musí byť skôr ako koniec", type: "error" });
        return;
      }
      if (values.break_from && values.break_to && values.break_from >= values.break_to) {
        setExtrasMessage({ text: "Prestávka musí mať správne poradie", type: "error" });
        return;
      }

      const result = values.id
        ? await supabase
            .from("company_business_hours_extras")
            .update(payload)
            .eq("id", values.id)
        : await supabase
            .from("company_business_hours_extras")
            .insert(payload);

      if (result.error) {
        const message = result.error.message.includes("violates row-level security policy")
          ? "Nemáte oprávnenie upravovať špeciálne dni pre túto firmu."
          : result.error.message;
        setExtrasMessage({ text: message, type: "error" });
        return;
      }

      const { data: refreshedExtras, error: fetchError } = await supabase
        .from("company_business_hours_extras")
        .select("id, date, message, from_hour, to_hour, break_from, break_to")
        .eq("company_id", company.id)
        .order("date", { ascending: true });

      if (fetchError) {
        setExtrasMessage({ text: fetchError.message, type: "error" });
        return;
      }

      setExtras((refreshedExtras ?? []) as BusinessHourExtra[]);
      setExtrasMessage({ text: "Špeciálny deň uložený", type: "success" });
      closeExtraDialog();
      router.refresh();
    });
  };

  const handleExtraDelete = (extraId: string) => {
    setExtrasMessage(null);
    startExtrasTransition(async () => {
      const result = await supabase.from("company_business_hours_extras").delete().eq("id", extraId);
      if (result.error) {
        setExtrasMessage({ text: result.error.message, type: "error" });
        return;
      }
      setExtras((prev) => prev.filter((item) => item.id !== extraId));
      setExtrasMessage({ text: "Záznam odstránený", type: "success" });
      router.refresh();
    });
  };

  const handleUploadPhoto = () => {
    if (!photoFile) {
      setPhotosMessage({ text: "Vyberte súbor fotografie", type: "error" });
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
        setPhotosMessage({ text: message, type: "error" });
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(COMPANY_PHOTOS_BUCKET).getPublicUrl(storagePath);
      const publicUrl = publicUrlData.publicUrl;
      if (!publicUrl) {
        setPhotosMessage({ text: "Nepodarilo sa získať URL fotografie", type: "error" });
        await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([storagePath]);
        return;
      }

      const ordering = photos.length;
      const insertResult = await supabase
        .from("photos")
        .insert({ company_id: company.id, url: publicUrl, ordering });

      if (insertResult.error) {
        const message = insertResult.error.message.includes("violates row-level security policy")
          ? "Nemáte oprávnenie pridávať fotografie pre túto firmu. Skontrolujte RLS politiky."
          : insertResult.error.message;
        setPhotosMessage({ text: message, type: "error" });
        await supabase.storage.from(COMPANY_PHOTOS_BUCKET).remove([storagePath]);
        return;
      }

      const { data: refreshedPhotos, error: fetchError } = await supabase
        .from("photos")
        .select("id, ordering, url")
        .eq("company_id", company.id)
        .order("ordering", { ascending: true });

      if (fetchError) {
        setPhotosMessage({ text: fetchError.message, type: "error" });
        return;
      }

      const nextPhotos = (refreshedPhotos ?? []) as CompanyPhoto[];
      setPhotos(normalizePhotos(nextPhotos));
      setPhotosMessage({ text: "Fotografia pridaná", type: "success" });
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
        setPhotosMessage({ text: result.error.message, type: "error" });
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
        setPhotosMessage({ text: removalError ?? "Fotografia odstránená", type: removalError ? "error" : "success" });
      } else if (removalError) {
        setPhotosMessage({ text: removalError, type: "error" });
      }
    });
  };

  const reorderAndPersistPhotos = async (nextOrder: CompanyPhoto[]) => {
    const { error } = await supabase.rpc("reorder_photos", {
      p_company_id: company.id,
      p_photo_ids: nextOrder.map((p) => p.id),
    });

    if (error) {
      setPhotosMessage({ text: error.message, type: "error" });
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
        setPhotosMessage({ text: "Fotografia nastavená ako titulná", type: "success" });
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
        setPhotosMessage({ text: "Poradie aktualizované", type: "success" });
      }
    });
  };

  const renderBasicTab = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Základné informácie
            </CardTitle>
            <CardDescription>
              Tieto údaje definujú vašu značku a viditeľnosť.
            </CardDescription>
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
                        <FormLabel>Webová adresa (slug)</FormLabel>
                        <div className="flex rounded-md shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                          <span className="flex select-none items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                            buknisi.sk/
                          </span>
                          <FormControl>
                            <Input
                              placeholder="studio-belle"
                              {...field}
                              className="rounded-l-none"
                            />
                          </FormControl>
                        </div>
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
                      <FormLabel>O nás</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Napíšte pútavý príbeh o vašej firme..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4" /> Kontakt
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefón (verejný)</FormLabel>
                          <FormControl>
                            <Input placeholder="+421 9xx xxx xxx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (verejný)</FormLabel>
                          <FormControl>
                            <Input placeholder="info@example.com" {...field} />
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
                          <FormLabel>Webstránka</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" /> Adresa a lokalita
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="address_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ulica a číslo</FormLabel>
                          <FormControl>
                            <Input placeholder="Hlavná 123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="city_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mesto</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Vyberte mesto</option>
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
                  </div>
                  <FormField
                    control={companyForm.control}
                    name="is_mobile"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Mobilná prevádzka
                          </FormLabel>
                          <CardDescription>
                            Služby poskytujem priamo u klienta (nemám kamennú prevádzku).
                          </CardDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Globe className="h-4 w-4" /> Sociálne siete
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <div className="relative">
                            <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input className="pl-9" placeholder="https://facebook.com/..." {...field} />
                            </FormControl>
                          </div>
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
                          <div className="relative">
                            <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                              <Input className="pl-9" placeholder="https://instagram.com/..." {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  {overviewMessage ? (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                        overviewMessage.type === "success"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                      )}
                    >
                      {overviewMessage.type === "success" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {overviewMessage.text}
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isOverviewPending} size="lg">
                      {isOverviewPending ? "Ukladám..." : "Uložiť zmeny"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Kategória</CardTitle>
            <CardDescription>
              Zaraďte vašu firmu správne, aby vás klienti našli.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={companyForm.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="grid gap-2">
                      {initialData.categories.map((category) => (
                        <label
                          key={category.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-md border p-3 transition-all hover:bg-background",
                            field.value === category.id
                              ? "border-primary bg-background ring-1 ring-primary"
                              : "bg-card"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={field.value === category.id}
                            onChange={() => field.onChange(category.id)}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4" /> Tip pre lepší profil
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-600/80 dark:text-blue-400/80">
            <p>
              Vyplňte všetky kontaktné údaje vrátane sociálnych sietí.
              Profily s kompletnými informáciami majú o <strong>40% viac rezervácií</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOverviewTab = () => {
    const city = initialData.cities.find((c) => c.id === overviewValues.city_id);
    const category = initialData.categories.find((c) => c.id === overviewValues.category_id);
    const catalogUrl = "http://localhost:3004";
    const companyUrl =
      city && category && overviewValues.slug
        ? `${catalogUrl}/${city.slug}/${category.slug}/c/${overviewValues.slug}/`
        : null;

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" />
                Náhľad profilu
              </CardTitle>
              <CardDescription>Takto približne uvidia váš profil klienti v katalógu.</CardDescription>
            </div>
            {companyUrl && (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <a href={companyUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Pozrieť na webe
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="relative aspect-video w-full bg-muted">
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0].url}
                  alt={overviewValues.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 opacity-20" />
                  <span className="text-sm">Bez titulnej fotografie</span>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                 {overviewValues.is_mobile && (
                    <span className="rounded-full bg-blue-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                      Mobilné služby
                    </span>
                 )}
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                 <h2 className="text-xl font-bold tracking-tight">{overviewValues.name}</h2>
                 <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{previewAddressParts || "Adresa nie je vyplnená"}</span>
                 </div>
              </div>

              <div className="flex flex-wrap gap-2">
                 {selectedAmenities.slice(0, 5).map((name) => (
                    <span key={name} className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                       {name}
                    </span>
                 ))}
                 {selectedAmenities.length > 5 && (
                    <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                       +{selectedAmenities.length - 5} ďalšie
                    </span>
                 )}
              </div>

              <div className="space-y-3 border-t pt-4">
                 <h4 className="text-sm font-semibold">O nás</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   {overviewValues.description || "Zatiaľ bez popisu..."}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                 <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Kontakt</span>
                    <div className="flex flex-col gap-1">
                       {overviewValues.phone && (
                          <div className="flex items-center gap-2">
                             <Phone className="h-3.5 w-3.5 text-primary" />
                             <span>{overviewValues.phone}</span>
                          </div>
                       )}
                       {overviewValues.email && (
                          <div className="flex items-center gap-2">
                             <Mail className="h-3.5 w-3.5 text-primary" />
                             <span className="truncate">{overviewValues.email}</span>
                          </div>
                       )}
                    </div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Sociálne siete</span>
                    <div className="flex gap-2">
                       {overviewValues.facebook && (
                          <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                             <Facebook className="h-4 w-4" />
                          </a>
                       )}
                       {overviewValues.instagram && (
                          <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400">
                             <Instagram className="h-4 w-4" />
                          </a>
                       )}
                       {overviewValues.website && (
                          <a href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400">
                             <Globe className="h-4 w-4" />
                          </a>
                       )}
                       {!overviewValues.facebook && !overviewValues.instagram && !overviewValues.website && (
                          <span className="text-muted-foreground italic text-xs">Žiadne odkazy</span>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
         <Card>
            <CardHeader>
               <CardTitle className="text-base">Stav vyplnenia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Adresa a kontakt</span>
                     <span className={overviewValues.phone ? "text-green-600" : "text-amber-600"}>
                        {overviewValues.phone ? "Vyplnené" : "Chýba telefón"}
                     </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                     <div className={cn("h-full bg-primary transition-all", overviewValues.phone && overviewValues.address_text ? "w-full" : "w-1/2")} />
                  </div>
               </div>
               
               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Titulná fotka</span>
                     <span className={photos.length > 0 ? "text-green-600" : "text-red-600"}>
                        {photos.length > 0 ? "Nahraná" : "Chýba"}
                     </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                     <div className={cn("h-full bg-primary transition-all", photos.length > 0 ? "w-full" : "w-0")} />
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Otváracie hodiny</span>
                     <span className="text-green-600">Nastavené</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                     <div className="h-full w-full bg-primary" />
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
               <CardTitle className="flex items-center gap-2 text-base text-primary">
                  <Settings2 className="h-4 w-4" />
                  Rýchle akcie
               </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
               <Button variant="outline" className="w-full justify-start bg-background hover:bg-muted" onClick={() => setActiveTab("basic")}>
                  <Store className="mr-2 h-4 w-4" /> Upraviť údaje
               </Button>
               <Button variant="outline" className="w-full justify-start bg-background hover:bg-muted" onClick={() => setActiveTab("photos")}>
                  <Camera className="mr-2 h-4 w-4" /> Pridať fotky
               </Button>
            </CardContent>
         </Card>
      </div>
    </div>
    );
  };

  const renderAmenitiesTab = () => (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Vybavenie a služby</h3>
        <p className="text-sm text-muted-foreground">
          Vyberte všetko vybavenie, ktoré máte k dispozícii pre klientov.
          Pomôže im to pri rozhodovaní.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {initialData.amenities.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
              <Wifi className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Žiadne dostupné vybavenie
              </p>
              <p className="text-xs text-muted-foreground">
                Kontaktujte administrátora pre pridanie možností.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {initialData.amenities.map((amenity) => {
                const checked = amenityState.includes(amenity.id);
                return (
                  <label
                    key={amenity.id}
                    className={cn(
                      "group relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all hover:shadow-sm",
                      checked
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="peer h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className={cn("font-medium text-sm", checked ? "text-primary" : "text-foreground")}>
                        {amenity.name}
                      </span>
                      {amenity.icon && (
                        <span className="text-xs text-muted-foreground">
                          {getAmenityIcon(amenity)}
                        </span>
                      )}
                    </div>
                    {checked && (
                      <div className="absolute right-3 top-3 text-primary animate-in zoom-in-50 duration-200">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col items-end gap-2 border-t pt-4">
            {amenityMessage && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  amenityMessage.type === "success"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {amenityMessage.type === "error" && <AlertTriangle className="h-4 w-4" />}
                {amenityMessage.text}
              </div>
            )}
            <Button 
              type="button" 
              onClick={handleSaveAmenities} 
              disabled={isAmenityPending}
              size="lg"
            >
              {isAmenityPending ? "Ukladám..." : "Uložiť výber"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHoursTab = () => (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Otváracie hodiny
            </CardTitle>
            <CardDescription>
              Nastavte, kedy je vaša prevádzka otvorená.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {dayOptions.map(({ value, label }) => {
                const state = businessHoursState[value];
                return (
                  <div
                    key={value}
                    className={cn(
                      "flex flex-col gap-4 rounded-lg border p-4 transition-all sm:flex-row sm:items-center sm:justify-between",
                      state.open ? "bg-card border-border" : "bg-muted/30 border-dashed"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-[140px]">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={state.open}
                            onChange={(event) =>
                              updateDayState(value, (prevState) => ({
                                ...prevState,
                                open: event.target.checked,
                              }))
                            }
                          />
                          <div className={cn(
                            "h-5 w-9 rounded-full transition-colors",
                            state.open ? "bg-primary" : "bg-input"
                          )}>
                            <div className={cn(
                              "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                              state.open ? "translate-x-5" : "translate-x-0.5"
                            )} />
                          </div>
                        </label>
                        <span className={cn("font-medium", state.open ? "text-foreground" : "text-muted-foreground")}>
                          {label}
                        </span>
                      </div>
                    </div>

                      {state.open ? (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Od</Label>
                            <input
                              type="time"
                              value={state.from}
                              onChange={(event) =>
                                updateDayState(value, (prevState) => ({
                                  ...prevState,
                                  from: event.target.value,
                                }))
                              }
                              className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                          <span className="text-muted-foreground font-medium">–</span>
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Do</Label>
                            <input
                              type="time"
                              value={state.to}
                              onChange={(event) =>
                                updateDayState(value, (prevState) => ({
                                  ...prevState,
                                  to: event.target.value,
                                }))
                              }
                              className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </div>
                        </div>

                        <div className="h-8 w-px bg-border hidden sm:block mx-2" />

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          {!state.hasBreak ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                updateDayState(value, (prevState) => ({
                                  ...prevState,
                                  hasBreak: true,
                                  breakFrom: prevState.breakFrom || "12:00",
                                  breakTo: prevState.breakTo || "12:30",
                                }))
                              }
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Obed
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1.5">
                                <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-muted-foreground px-1">OBED</span>
                                <input
                                  type="time"
                                  value={state.breakFrom}
                                  onChange={(event) =>
                                    updateDayState(value, (prevState) => ({
                                      ...prevState,
                                      breakFrom: event.target.value,
                                    }))
                                  }
                                  className="h-7 w-24 rounded border border-input bg-background px-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                                <span className="text-muted-foreground">–</span>
                                <input
                                  type="time"
                                  value={state.breakTo}
                                  onChange={(event) =>
                                    updateDayState(value, (prevState) => ({
                                      ...prevState,
                                      breakTo: event.target.value,
                                    }))
                                  }
                                  className="h-7 w-24 rounded border border-input bg-background px-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  updateDayState(value, (prevState) => ({
                                    ...prevState,
                                    hasBreak: false,
                                  }))
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground italic">
                        Zatvorené
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              {hoursMessage ? (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    hoursMessage.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                  )}
                >
                  {hoursMessage.type === "success" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {hoursMessage.text}
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button type="button" onClick={handleSaveHours} disabled={isHoursPending} size="lg">
                  {isHoursPending ? "Ukladám..." : "Uložiť otváracie hodiny"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-muted/50">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Rýchly náhľad</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <div className="space-y-2 text-xs">
                {dayOptions.map(({ value, shortLabel }) => {
                  const state = businessHoursState[value];
                  return (
                    <div key={value} className="flex justify-between border-b border-border/50 pb-1 last:border-0 last:pb-0">
                      <span className="font-medium text-muted-foreground">{shortLabel}</span>
                      <span className={state.open ? "text-foreground" : "text-muted-foreground/60 italic"}>
                        {state.open 
                          ? `${state.from} - ${state.to}` 
                          : "Zatvorené"
                        }
                      </span>
                    </div>
                  );
                })}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExtrasTab = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Špeciálne dni
              </CardTitle>
              <CardDescription>
                Výnimky z bežných otváracích hodín (sviatky, dovolenky).
              </CardDescription>
            </div>
            <Button onClick={() => openExtraDialog(null)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Pridať
            </Button>
          </CardHeader>
          <CardContent className="mt-4">
            {extras.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <Calendar className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium text-muted-foreground">Žiadne špeciálne dni</p>
                <p className="text-xs text-muted-foreground">
                  Pridajte výnimky pre sviatky alebo dovolenky.
                </p>
                <Button variant="link" onClick={() => openExtraDialog(null)} className="mt-1 h-auto p-0">
                  Pridať prvý záznam
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="group relative flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-4">
                       <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-muted text-center border">
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                            {new Date(extra.date).toLocaleDateString("sk-SK", { month: "short" })}
                          </span>
                          <span className="text-xl font-bold leading-none">
                            {new Date(extra.date).getDate()}
                          </span>
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="font-medium">
                                {extra.message || "Bez popisu"}
                             </h4>
                             {!extra.from_hour && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                   Zatvorené
                                </span>
                             )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {extra.from_hour && extra.to_hour ? (
                               <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {extra.from_hour.slice(0, 5)} – {extra.to_hour.slice(0, 5)}
                                  {extra.break_from && extra.break_to && (
                                     <span className="ml-2 text-muted-foreground/70">
                                        (Pauza {extra.break_from.slice(0, 5)} – {extra.break_to.slice(0, 5)})
                                     </span>
                                  )}
                               </span>
                            ) : (
                               <span>Celý deň zatvorené</span>
                            )}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openExtraDialog(extra)}
                        disabled={isExtrasPending}
                      >
                        Upraviť
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleExtraDelete(extra.id)}
                        disabled={isExtrasPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {extrasMessage ? (
              <div
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  extrasMessage.type === "success"
                    ? "text-muted-foreground"
                    : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                )}
              >
                {extrasMessage.type === "error" && <AlertTriangle className="h-4 w-4" />}
                {extrasMessage.text}
              </div>
            ) : null}
          </CardContent>

          <Dialog open={extraDialogOpen} onOpenChange={(open) => (open ? setExtraDialogOpen(true) : closeExtraDialog())}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingExtra ? "Upraviť špeciálny deň" : "Nový špeciálny deň"}</DialogTitle>
                <DialogDescription>Zadajte dátum a voliteľne upravte otváraciu dobu.</DialogDescription>
              </DialogHeader>
              <Form {...extraForm}>
                <form className="space-y-4" onSubmit={extraForm.handleSubmit(handleExtraSubmit)}>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                          <FormLabel>Dôvod (voliteľné)</FormLabel>
                          <FormControl>
                            <Input placeholder="Napr. Vianoce" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />
                  
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <Label>Otváracia doba</Label>
                        <span className="text-xs text-muted-foreground">Nechajte prázdne pre &quot;Zatvorené&quot;</span>
                     </div>
                     <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={extraForm.control}
                          name="from_hour"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Od</FormLabel>
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
                              <FormLabel className="text-xs text-muted-foreground">Do</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <Label>Prestávka (voliteľné)</Label>
                     <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={extraForm.control}
                          name="break_from"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Od</FormLabel>
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
                              <FormLabel className="text-xs text-muted-foreground">Do</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                     </div>
                  </div>

                  {extrasMessage ? (
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                        extrasMessage.type === "success"
                          ? "text-muted-foreground"
                          : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                      )}
                    >
                      {extrasMessage.type === "error" && <AlertTriangle className="h-4 w-4" />}
                      {extrasMessage.text}
                    </div>
                  ) : null}

                  <DialogFooter className="gap-2 sm:gap-0">
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
      </div>

      <div className="space-y-6">
        <Card className="bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
              <Info className="h-4 w-4" /> Dôležité info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-600/80 dark:text-orange-400/80">
            <p>
              Špeciálne dni majú prednosť pred bežnými otváracími hodinami.
              Ak tu pridáte dátum a nevyplníte časy, pre tento deň bude systém považovať prevádzku za <strong>zatvorenú</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPhotosTab = () => (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Fotogaléria
            </CardTitle>
            <CardDescription>
              Pridajte kvalitné fotografie, ktoré najlepšie vystihujú vašu prácu.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => {
              setPhotosMessage(null);
              setPhotoFile(null);
              setPhotoDialogOpen(true);
            }}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Pridať fotku
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50">
            <div className="rounded-full bg-muted p-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Zatiaľ žiadne fotografie
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Nahrajte fotografie interiéru, exteriéru alebo ukážky vašej práce.
              Prvá fotka bude použitá ako titulná.
            </p>
            <Button
              variant="link"
              onClick={() => {
                setPhotosMessage(null);
                setPhotoFile(null);
                setPhotoDialogOpen(true);
              }}
              className="mt-2"
            >
              Nahrať prvú fotografiu
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt="Company photo"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  {index === 0 && (
                    <div className="absolute left-2 top-2 z-10">
                      <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-medium text-primary-foreground backdrop-blur-sm shadow-sm">
                        <Check className="h-3 w-3" /> Titulná
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      type="button"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={isPhotosPending || index === 0}
                      title="Nastaviť ako titulnú"
                    >
                      <LayoutTemplate className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={isPhotosPending}
                      title="Zmazať"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t bg-muted/30 p-2">
                   <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        type="button"
                        onClick={() => handleMovePhoto(photo.id, -1)}
                        disabled={isPhotosPending || index === 0}
                      >
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                         </svg>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        type="button"
                        onClick={() => handleMovePhoto(photo.id, 1)}
                        disabled={isPhotosPending || index === photos.length - 1}
                      >
                         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                      </Button>
                   </div>
                   <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {photosMessage && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              photosMessage.type === "success"
                ? "bg-muted text-muted-foreground"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
            )}
          >
            {photosMessage.type === "error" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            {photosMessage.text}
          </div>
        )}
      </CardContent>

      <Dialog open={photoDialogOpen} onOpenChange={(open) => (open ? setPhotoDialogOpen(true) : closePhotoDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nahrať fotografiu</DialogTitle>
            <DialogDescription>Vyberte obrázok z počítača, odporúčame pomer 16:9.</DialogDescription>
          </DialogHeader>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:bg-muted/50 transition-colors">
              <Input 
                type="file" 
                accept="image/*" 
                className="hidden"
                id="photo-upload"
                onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} 
              />
              <label htmlFor="photo-upload" className="flex flex-col items-center cursor-pointer gap-2">
                 {photoFile ? (
                    <>
                       <ImageIcon className="h-10 w-10 text-primary" />
                       <span className="text-sm font-medium text-foreground">{photoFile.name}</span>
                       <span className="text-xs text-muted-foreground">Kliknite pre zmenu</span>
                    </>
                 ) : (
                    <>
                       <div className="rounded-full bg-muted p-3">
                         <Camera className="h-6 w-6 text-muted-foreground" />
                       </div>
                       <div className="text-center">
                         <span className="text-sm font-medium text-primary">Vyberte súbor</span>
                         <span className="text-sm text-muted-foreground"> alebo ho potiahnite sem</span>
                       </div>
                       <p className="text-xs text-muted-foreground mt-1">Podporované: JPG, PNG, WEBP (max 5MB)</p>
                    </>
                 )}
              </label>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={closePhotoDialog} disabled={isPhotosPending}>
                Zrušiť
              </Button>
              <Button type="button" onClick={handleUploadPhoto} disabled={isPhotosPending || !photoFile}>
                {isPhotosPending ? "Nahrávam..." : "Nahrať"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );

  const renderTabs = () => (
    <div className="flex w-full overflow-x-auto pb-2 sm:pb-0">
      <div className="flex w-full max-w-4xl items-center gap-1 rounded-lg bg-muted p-1">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:text-sm",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Firemný Profil</h3>
          <p className="text-sm text-muted-foreground">
            Spravujte informácie, ktoré sa zobrazia vašim klientom v katalógu.
          </p>
        </div>
        {renderTabs()}
      </div>
      <Separator />

      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "basic" && renderBasicTab()}
        {activeTab === "amenities" && renderAmenitiesTab()}
        {activeTab === "hours" && renderHoursTab()}
        {activeTab === "extras" && renderExtrasTab()}
        {activeTab === "photos" && renderPhotosTab()}
      </div>
    </div>
  );
}
