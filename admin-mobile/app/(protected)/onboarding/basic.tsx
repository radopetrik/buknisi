import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import slugify from "slugify";

import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type CompanyDraft = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address_text: string | null;
  city_id: string | null;
  category_id: string | null;
  is_mobile: boolean | null;
};

type ScreenData = {
  company: CompanyDraft;
};

function toInput(value: string | null | undefined) {
  return value ?? "";
}

function toNullIfEmpty(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length === 0 ? null : trimmed;
}

export default function OnboardingBasicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ companyId?: string }>();
  const { data: companyFromHook } = useCompany();

  const companyId = typeof params.companyId === "string" ? params.companyId : companyFromHook?.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["onboardingBasic", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<ScreenData> => {
      const companyResult = await supabase
        .from("companies")
        .select("id, name, slug, phone, email, address_text, city_id, category_id, is_mobile")
        .eq("id", companyId!)
        .single();

      if (companyResult.error) throw companyResult.error;

      return {
        company: companyResult.data as CompanyDraft,
      };
    },
  });

  const [draft, setDraft] = useState<CompanyDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // hydrate once
  useEffect(() => {
    if (!data) return;
    if (draft) return;
    setDraft(data.company);
  }, [data, draft]);

  const canSave = useMemo(() => {
    if (!draft) return false;
    if (!draft.name.trim()) return false;
    if (!draft.slug.trim()) return false;
    if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) return false;

    if (saving) return false;
    return true;
  }, [draft, saving]);

  const handleGenerateSlug = () => {
    if (!draft) return;
    const base = slugify(draft.name, { lower: true, strict: true, trim: true }) || "firma";
    setDraft({ ...draft, slug: base });
  };

  const handleSave = async (): Promise<boolean> => {
    if (!companyId || !draft) return false;

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        phone: toNullIfEmpty(draft.phone),
        email: toNullIfEmpty(draft.email),
        address_text: toNullIfEmpty(draft.address_text),
        is_mobile: Boolean(draft.is_mobile),
      } as const;

      const result = await supabase
        .from("companies")
        .update(payload)
        .eq("id", companyId)
        .select("id, name, slug, phone, email, address_text, city_id, category_id, is_mobile")
        .single();

      if (result.error) throw result.error;
      if (!result.data) throw new Error("Nepodarilo sa uložiť.");

      setDraft(result.data as CompanyDraft);
      Alert.alert("Uložené", "Základné údaje sú uložené.");
      return true;
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Nepodarilo sa uložiť.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    router.push({ pathname: "/(protected)/onboarding/hours", params: { companyId } });
  };

  const handleSaveAndNext = async () => {
    const ok = await handleSave();
    if (ok) goNext();
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

  if (!data || !draft) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-gray-700 text-center">Profil nie je dostupný.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">Nastavenie profilu (1/3)</Text>
          <Pressable onPress={() => router.replace("/(protected)/calendar")} className="px-3 py-2">
            <Text className="text-gray-600">Neskôr</Text>
          </Pressable>
        </HStack>
      </Box>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <VStack className="gap-4">
          <Box className="bg-white rounded-xl border border-gray-100 p-4">
            <Text className="text-base font-semibold text-gray-900">Základ</Text>
            <Text className="text-sm text-gray-500 mt-1">
              Vyplňte najdôležitejšie informácie. Ostatné viete doplniť neskôr v sekcii Profil.
            </Text>

            <VStack className="gap-3 mt-4">
              <Box>
                <Text className="text-sm text-gray-600 mb-1">Názov</Text>
                <Input className="bg-white">
                  <InputField value={draft.name} onChangeText={(value) => setDraft({ ...draft, name: value })} placeholder="Napr. Studio Belle" />
                </Input>
              </Box>

              <Box>
                <HStack className="items-center justify-between mb-1">
                  <Text className="text-sm text-gray-600">Slug (URL)</Text>
                  <Pressable onPress={handleGenerateSlug} className="px-2 py-1">
                    <Text className="text-sm text-gray-700">Generovať</Text>
                  </Pressable>
                </HStack>
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
                <Text className="text-sm text-gray-600 mb-1">Telefón (voliteľné)</Text>
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
                <Text className="text-sm text-gray-600 mb-1">Adresa</Text>
                <Input className="bg-white">
                  <InputField
                    value={toInput(draft.address_text)}
                    onChangeText={(value) => setDraft({ ...draft, address_text: value })}
                    placeholder="Hlavná 123"
                  />
                </Input>
              </Box>
            </VStack>
          </Box>


          {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

          <HStack className="gap-3">
            <Button className="flex-1" variant="outline" onPress={goNext}>
              <ButtonText>Preskočiť</ButtonText>
            </Button>
            <Button className="flex-1" isDisabled={!canSave} onPress={handleSaveAndNext}>
              {saving ? <ButtonSpinner /> : null}
              <ButtonText>{saving ? "Ukladám..." : "Uložiť a pokračovať"}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </View>
  );
}
