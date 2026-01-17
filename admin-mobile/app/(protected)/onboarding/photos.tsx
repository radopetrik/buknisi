import { Alert, Image, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const COMPANY_PHOTOS_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_COMPANY_PHOTOS_BUCKET ?? "company_photos";

type PhotoRow = {
  id: string;
  ordering: number | null;
  url: string;
};

function guessExtension(fileNameOrUri: string | null | undefined) {
  const source = (fileNameOrUri ?? "").trim();
  const match = source.match(/\.([a-zA-Z0-9]{2,6})(\?|$)/);
  return match ? match[1].toLowerCase() : "jpg";
}

function getStorageRefFromPhotoUrl(url: string) {
  const decoded = decodeURIComponent(url);
  const match = decoded.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
  if (!match) return null;

  const bucket = match[1];
  const remainder = match[2];
  const path = remainder.split("?")[0];
  if (!bucket || !path) return null;

  return { bucket, path } as const;
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

async function removeCompanyPhotoFromStorage(url: string) {
  const ref = getStorageRefFromPhotoUrl(url);
  if (!ref) return;

  const removeResult = await supabase.storage.from(ref.bucket).remove([ref.path]);
  if (removeResult.error) {
    throw removeResult.error;
  }
}

export default function OnboardingPhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ companyId?: string }>();
  const { data: companyFromHook } = useCompany();

  const companyId = typeof params.companyId === "string" ? params.companyId : companyFromHook?.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["onboardingPhotos", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const result = await supabase
        .from("photos")
        .select("id, ordering, url")
        .eq("company_id", companyId!)
        .order("ordering", { ascending: true });

      if (result.error) throw result.error;
      return (result.data ?? []) as PhotoRow[];
    },
  });

  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [photoDisplayUrls, setPhotoDisplayUrls] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data || hydrated) return;
    setPhotos(data);
    setHydrated(true);
  }, [data, hydrated]);

  useEffect(() => {
    if (!companyId) return;
    if (photos.length === 0) {
      setPhotoDisplayUrls({});
      return;
    }

    let cancelled = false;

    void (async () => {
      const entries = await Promise.all(
        photos.map(async (photo) => {
          const ref = getStorageRefFromPhotoUrl(photo.url);
          if (!ref) return [photo.id, photo.url] as const;

          const signed = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60);
          if (signed.error || !signed.data?.signedUrl) {
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
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, photos]);

  const handlePickAndUploadPhoto = async () => {
    if (!companyId) return;

    setSaving(true);
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

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        throw new Error("Nepodarilo sa načítať vybraný obrázok.");
      }

      const ordering = photos.length;
      await uploadCompanyPhotoFromAsset({ companyId, asset, currentOrdering: ordering });

      const refreshed = await supabase
        .from("photos")
        .select("id, ordering, url")
        .eq("company_id", companyId)
        .order("ordering", { ascending: true });
      if (refreshed.error) throw refreshed.error;

      setPhotos((refreshed.data ?? []) as PhotoRow[]);
      Alert.alert("Hotovo", "Fotka bola pridaná.");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa pridať fotku.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = (photo: PhotoRow) => {
    Alert.alert("Odstrániť", "Naozaj chcete odstrániť túto fotku?", [
      { text: "Zrušiť", style: "cancel" },
      {
        text: "Odstrániť",
        style: "destructive",
        onPress: async () => {
          if (!companyId) return;

          setSaving(true);
          setErrorMessage(null);

          try {
            const deleteRow = await supabase.from("photos").delete().eq("id", photo.id);
            if (deleteRow.error) throw deleteRow.error;

            await removeCompanyPhotoFromStorage(photo.url);

            const refreshed = await supabase
              .from("photos")
              .select("id, ordering, url")
              .eq("company_id", companyId)
              .order("ordering", { ascending: true });
            if (refreshed.error) throw refreshed.error;

            setPhotos((refreshed.data ?? []) as PhotoRow[]);
          } catch (err: any) {
            setErrorMessage(err?.message ?? "Nepodarilo sa odstrániť fotku.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const finish = () => {
    router.replace("/(protected)/calendar");
  };

  if (!companyId || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Stack.Screen options={{ headerShown: false }} />
        <Spinner size="large" color="black" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-gray-700 text-center">{(error as any)?.message ?? "Chyba načítania"}</Text>
        <Button className="mt-4" onPress={() => refetch()}>
          <ButtonText>Skúsiť znovu</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton
            label="Späť"
            onPress={() => router.replace({ pathname: "/(protected)/onboarding/hours", params: { companyId } })}
          />
          <Text className="text-base font-semibold text-gray-900">Fotky (3/3)</Text>
          <Pressable onPress={finish} className="px-3 py-2">
            <Text className="text-gray-600">Dokončiť</Text>
          </Pressable>
        </HStack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <VStack className="gap-4">
          <Box className="bg-white rounded-xl border border-gray-100 p-4">
            <Text className="text-base font-semibold text-gray-900">Pridajte fotky</Text>
            <Text className="text-sm text-gray-500 mt-1">Môžete pridať aj neskôr v sekcii Profil → Fotky.</Text>

            <Button className="mt-4" onPress={handlePickAndUploadPhoto} isDisabled={saving}>
              {saving ? <ButtonSpinner /> : null}
              <ButtonText>{saving ? "Nahrávam..." : "Pridať fotku"}</ButtonText>
            </Button>

            {errorMessage ? <Text className="text-red-600 mt-3">{errorMessage}</Text> : null}
          </Box>

          {photos.length === 0 ? (
            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-gray-700">Zatiaľ žiadne fotky.</Text>
            </Box>
          ) : (
            <VStack className="gap-3">
              {photos.map((photo) => {
                const displayUrl = photoDisplayUrls[photo.id] ?? photo.url;
                return (
                  <Box key={photo.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <Image source={{ uri: displayUrl }} style={{ width: "100%", height: 180, borderRadius: 12 }} resizeMode="cover" />
                    <HStack className="items-center justify-between mt-3">
                      <Text className="text-gray-700">#{(photo.ordering ?? 0) + 1}</Text>
                      <Pressable onPress={() => handleDeletePhoto(photo)} className="px-3 py-2">
                        <Text className="text-red-600">Odstrániť</Text>
                      </Pressable>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}

          <Button className="w-full" variant="outline" onPress={finish}>
            <ButtonText>Dokončiť</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </View>
  );
}
