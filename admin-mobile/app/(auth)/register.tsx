import { Alert, Image, ImageBackground, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import slugify from "slugify";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type CityOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

type LookupData = {
  cities: CityOption[];
  categories: CategoryOption[];
};

const registerSchema = z.object({
  companyName: z.string().min(1, "Názov firmy je povinný"),
  email: z.string().email("Zadajte platný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
  address: z.string().min(1, "Adresa je povinná"),
  categoryId: z.string().min(1, "Vyberte kategóriu"),
  cityId: z.string().min(1, "Vyberte mesto"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

type StepKey = "account" | "address" | "category" | "city";

const steps: { key: StepKey; title: string; subtitle: string }[] = [
  { key: "account", title: "Účet", subtitle: "Základné údaje" },
  { key: "address", title: "Adresa", subtitle: "Kde vás nájdu" },
  { key: "category", title: "Kategória", subtitle: "Čomu sa venujete" },
  { key: "city", title: "Mesto", subtitle: "Lokalita" },
];

const AUTH_BG_URI =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop";

function buildUniqueSlug(companyName: string) {
  const base = slugify(companyName, { lower: true, strict: true, trim: true }) || "firma";
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

async function ensureSignedIn(email: string, password: string) {
  const sessionResult = await supabase.auth.getSession();
  if (sessionResult.data.session) return;

  const signInResult = await supabase.auth.signInWithPassword({ email, password });
  if (signInResult.error) throw signInResult.error;
}

export default function RegisterCompanyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stepIndex, setStepIndex] = useState(0);

  const lookupQuery = useQuery({
    queryKey: ["registerLookups"],
    queryFn: async (): Promise<LookupData> => {
      const [citiesResult, categoriesResult] = await Promise.all([
        supabase.from("cities").select("id, name").order("name", { ascending: true }),
        supabase.from("categories").select("id, name").order("name", { ascending: true }),
      ]);

      if (citiesResult.error) throw citiesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      return {
        cities: (citiesResult.data ?? []) as CityOption[],
        categories: (categoriesResult.data ?? []) as CategoryOption[],
      };
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      address: "",
      categoryId: "",
      cityId: "",
    },
    mode: "onTouched",
  });

  const selectedCityId = watch("cityId");
  const selectedCategoryId = watch("categoryId");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // 1) Sign up user
      const signUpResult = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpResult.error) throw signUpResult.error;

      // In some configs signUp does not create a local session.
      await ensureSignedIn(data.email, data.password);

      const userResult = await supabase.auth.getUser();
      if (userResult.error) throw userResult.error;
      const user = userResult.data.user;
      if (!user) throw new Error("Nepodarilo sa prihlásiť používateľa.");

      // 2) Create company
      const slug = buildUniqueSlug(data.companyName);

      const companyResult = await supabase
        .from("companies")
        .insert({
          name: data.companyName,
          slug,
          email: data.email,
          category_id: data.categoryId,
          city_id: data.cityId,
          address_text: data.address,
          is_mobile: false,
        })
        .select("id")
        .single();

      if (companyResult.error) throw companyResult.error;
      if (!companyResult.data?.id) throw new Error("Nepodarilo sa vytvoriť firmu.");

      // 3) Link user to company
      const linkResult = await supabase.from("company_users").insert({
        company_id: companyResult.data.id,
        user_id: user.id,
      });

      if (linkResult.error) throw linkResult.error;

      // 4) Continue with onboarding wizard
      router.replace({
        pathname: "/(protected)/onboarding/basic",
        params: { companyId: companyResult.data.id },
      });
    } catch (err: any) {
      Alert.alert("Registrácia zlyhala", err?.message ?? "Skúste to prosím znovu.");
    }
  };

  const currentStep = steps[stepIndex] ?? steps[0];

  const handleNext = async () => {
    const step = currentStep.key;

    const ok = await (async () => {
      if (step === "account") return trigger(["companyName", "email", "password"]);
      if (step === "address") return trigger(["address"]);
      if (step === "category") return trigger(["categoryId"]);
      if (step === "city") return trigger(["cityId"]);
      return true;
    })();

    if (!ok) return;

    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  if (lookupQuery.isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Stack.Screen options={{ title: "Registrácia firmy", headerShown: false }} />
        <Spinner size="large" color="black" />
      </View>
    );
  }

  if (lookupQuery.isError) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Stack.Screen options={{ title: "Registrácia firmy", headerShown: false }} />
        <Text className="text-gray-700 text-center">
          {(lookupQuery.error as any)?.message ?? "Nepodarilo sa načítať údaje."}
        </Text>
        <Button className="mt-4" onPress={() => lookupQuery.refetch()}>
          <ButtonText>Skúsiť znovu</ButtonText>
        </Button>
      </View>
    );
  }

  const lookups = lookupQuery.data;
  const selectedCity = lookups.cities.find((c) => c.id === selectedCityId);
  const selectedCategory = lookups.categories.find((c) => c.id === selectedCategoryId);

  const cardClass = "rounded-2xl bg-white/95 p-6 border border-white/30";

  return (
    <ImageBackground source={{ uri: AUTH_BG_URI }} resizeMode="cover" className="flex-1">
      <Stack.Screen options={{ title: "Registrácia firmy", headerShown: false }} />

      <View className="absolute inset-0 bg-black/40" />

      <View style={{ paddingTop: insets.top }} className="flex-1">
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-6">
            <Image
              source={require("../../assets/images/logo_buknisi.png")}
              accessibilityLabel="Buknisi"
              style={{ height: 56, width: 220 }}
              resizeMode="contain"
            />

            <Text className="mt-5 text-2xl font-bold text-white">Registrácia firmy</Text>
            <Text className="mt-1 text-white/80 text-center">
              Krok {stepIndex + 1}/{steps.length} • {currentStep.title} • {currentStep.subtitle}
            </Text>

            <View className="flex-row gap-2 mt-4">
              {steps.map((s, idx) => {
                const active = idx === stepIndex;
                const done = idx < stepIndex;
                return (
                  <View
                    key={s.key}
                    className={
                      done
                        ? "h-2.5 w-2.5 rounded-full bg-white"
                        : active
                          ? "h-2.5 w-2.5 rounded-full bg-white border-2 border-white/60"
                          : "h-2.5 w-2.5 rounded-full bg-white/35"
                    }
                  />
                );
              })}
            </View>
          </View>

          <VStack className="gap-4">
            {currentStep.key === "account" ? (
              <View className={cardClass}>
                <VStack className="gap-4">
                  <Controller
                    control={control}
                    name="companyName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormControl isInvalid={!!errors.companyName}>
                        <FormControlLabel className="mb-1">
                          <FormControlLabelText>Názov firmy</FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            placeholder="Napr. Salón Krása"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                          />
                        </Input>
                        <FormControlError>
                          <FormControlErrorText>{errors.companyName?.message}</FormControlErrorText>
                        </FormControlError>
                      </FormControl>
                    )}
                  />

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormControl isInvalid={!!errors.email}>
                        <FormControlLabel className="mb-1">
                          <FormControlLabelText>Email (login)</FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            placeholder="vas@email.com"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            autoCapitalize="none"
                            keyboardType="email-address"
                          />
                        </Input>
                        <FormControlError>
                          <FormControlErrorText>{errors.email?.message}</FormControlErrorText>
                        </FormControlError>
                      </FormControl>
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <FormControl isInvalid={!!errors.password}>
                        <FormControlLabel className="mb-1">
                          <FormControlLabelText>Heslo</FormControlLabelText>
                        </FormControlLabel>
                        <Input>
                          <InputField
                            placeholder="Min. 6 znakov"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            secureTextEntry
                          />
                        </Input>
                        <FormControlError>
                          <FormControlErrorText>{errors.password?.message}</FormControlErrorText>
                        </FormControlError>
                      </FormControl>
                    )}
                  />
                </VStack>
              </View>
            ) : null}

            {currentStep.key === "address" ? (
              <View className={cardClass}>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormControl isInvalid={!!errors.address}>
                      <FormControlLabel className="mb-1">
                        <FormControlLabelText>Adresa</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          placeholder="Ulica a číslo"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                      </Input>
                      <FormControlError>
                        <FormControlErrorText>{errors.address?.message}</FormControlErrorText>
                      </FormControlError>
                    </FormControl>
                  )}
                />
              </View>
            ) : null}

            {currentStep.key === "category" ? (
              <View className={cardClass}>
                <Text className="text-base font-semibold text-typography-900">Kategória</Text>
                <Text className="text-sm text-typography-500 mt-1">
                  Vybratá: {selectedCategory?.name ?? "—"}
                </Text>

                <VStack className="gap-2 mt-4">
                  {lookups.categories.map((category) => {
                    const selected = category.id === selectedCategoryId;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setValue("categoryId", category.id, { shouldValidate: true })}
                        className={
                          selected
                            ? "px-4 py-3.5 rounded-xl border border-primary-500 bg-primary-500"
                            : "px-4 py-3.5 rounded-xl border border-typography-200 bg-white"
                        }
                      >
                        <Text className={selected ? "text-white font-semibold" : "text-typography-900"}>
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </VStack>

                {errors.categoryId?.message ? (
                  <Text className="text-sm text-error-600 mt-3">{errors.categoryId.message}</Text>
                ) : null}
              </View>
            ) : null}

            {currentStep.key === "city" ? (
              <View className={cardClass}>
                <Text className="text-base font-semibold text-typography-900">Mesto</Text>
                <Text className="text-sm text-typography-500 mt-1">
                  Vybraté: {selectedCity?.name ?? "—"}
                </Text>

                <VStack className="gap-2 mt-4">
                  {lookups.cities.map((city) => {
                    const selected = city.id === selectedCityId;
                    return (
                      <Pressable
                        key={city.id}
                        onPress={() => setValue("cityId", city.id, { shouldValidate: true })}
                        className={
                          selected
                            ? "px-4 py-3.5 rounded-xl border border-primary-500 bg-primary-500"
                            : "px-4 py-3.5 rounded-xl border border-typography-200 bg-white"
                        }
                      >
                        <Text className={selected ? "text-white font-semibold" : "text-typography-900"}>
                          {city.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </VStack>

                {errors.cityId?.message ? (
                  <Text className="text-sm text-error-600 mt-3">{errors.cityId.message}</Text>
                ) : null}
              </View>
            ) : null}

            <View className="mt-2">
              {stepIndex < steps.length - 1 ? (
                <Button onPress={handleNext} isDisabled={isSubmitting}>
                  <ButtonText>Pokračovať</ButtonText>
                </Button>
              ) : (
                <Button onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
                  {isSubmitting ? <ButtonSpinner color="white" /> : null}
                  <ButtonText>{isSubmitting ? "Vytváram..." : "Vytvoriť účet a firmu"}</ButtonText>
                </Button>
              )}

              {stepIndex > 0 ? (
                <Button
                  className="mt-3"
                  variant="outline"
                  action="secondary"
                  onPress={handleBack}
                  isDisabled={isSubmitting}
                >
                  <ButtonText>Späť</ButtonText>
                </Button>
              ) : (
                <Button
                  className="mt-3"
                  variant="outline"
                  action="secondary"
                  onPress={() => router.back()}
                  isDisabled={isSubmitting}
                >
                  <ButtonText>Späť na prihlásenie</ButtonText>
                </Button>
              )}

              <Pressable
                onPress={() => router.push("/(auth)/login")}
                className="py-4 items-center"
              >
                <Text className="text-white/80 text-sm">Už máte účet? Prihlásiť sa</Text>
              </Pressable>
            </View>
          </VStack>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
