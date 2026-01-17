import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import slugify from "slugify";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { Box } from "@/components/ui/box";
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

const steps: { key: StepKey; title: string }[] = [
  { key: "account", title: "Účet" },
  { key: "address", title: "Adresa" },
  { key: "category", title: "Kategória" },
  { key: "city", title: "Mesto" },
];

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

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: "Registrácia firmy", headerShown: false }} />

      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View className="mb-6 items-center">
          <Text className="text-2xl font-bold text-typography-900">Registrácia firmy</Text>
          <Text className="text-typography-500 text-center mt-1">
            Krok {stepIndex + 1}/{steps.length} • {currentStep.title}
          </Text>
        </View>

        <VStack className="gap-4">
          {currentStep.key === "account" ? (
            <>
              <Controller
                control={control}
                name="companyName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormControl isInvalid={!!errors.companyName}>
                    <FormControlLabel className="mb-1">
                      <FormControlLabelText>Názov firmy</FormControlLabelText>
                    </FormControlLabel>
                    <Input>
                      <InputField placeholder="Napr. Salón Krása" onBlur={onBlur} onChangeText={onChange} value={value} />
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
            </>
          ) : null}

          {currentStep.key === "address" ? (
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormControl isInvalid={!!errors.address}>
                  <FormControlLabel className="mb-1">
                    <FormControlLabelText>Adresa</FormControlLabelText>
                  </FormControlLabel>
                  <Input>
                    <InputField placeholder="Ulica a číslo" onBlur={onBlur} onChangeText={onChange} value={value} />
                  </Input>
                  <FormControlError>
                    <FormControlErrorText>{errors.address?.message}</FormControlErrorText>
                  </FormControlError>
                </FormControl>
              )}
            />
          ) : null}

          {currentStep.key === "category" ? (
            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-base font-semibold text-gray-900">Kategória</Text>
              <Text className="text-sm text-gray-500 mt-1">Vybratá: {selectedCategory?.name ?? "—"}</Text>

              <VStack className="gap-2 mt-3">
                {lookups.categories.map((category) => {
                  const selected = category.id === selectedCategoryId;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setValue("categoryId", category.id, { shouldValidate: true })}
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

              {errors.categoryId?.message ? <Text className="text-red-600 mt-2">{errors.categoryId.message}</Text> : null}
            </Box>
          ) : null}

          {currentStep.key === "city" ? (
            <Box className="bg-white rounded-xl border border-gray-100 p-4">
              <Text className="text-base font-semibold text-gray-900">Mesto</Text>
              <Text className="text-sm text-gray-500 mt-1">Vybraté: {selectedCity?.name ?? "—"}</Text>

              <VStack className="gap-2 mt-3">
                {lookups.cities.map((city) => {
                  const selected = city.id === selectedCityId;
                  return (
                    <Pressable
                      key={city.id}
                      onPress={() => setValue("cityId", city.id, { shouldValidate: true })}
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

              {errors.cityId?.message ? <Text className="text-red-600 mt-2">{errors.cityId.message}</Text> : null}
            </Box>
          ) : null}

          {stepIndex < steps.length - 1 ? (
            <Button className="mt-2" onPress={handleNext} isDisabled={isSubmitting}>
              <ButtonText>Pokračovať</ButtonText>
            </Button>
          ) : (
            <Button className="mt-2" onPress={handleSubmit(onSubmit)} isDisabled={isSubmitting}>
              {isSubmitting ? <ButtonSpinner color="white" /> : null}
              <ButtonText>{isSubmitting ? "Vytváram..." : "Vytvoriť účet a firmu"}</ButtonText>
            </Button>
          )}

          {stepIndex > 0 ? (
            <Pressable onPress={handleBack} className="py-2">
              <Text className="text-center text-gray-600">Späť</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.back()} className="py-2">
              <Text className="text-center text-gray-600">Späť na prihlásenie</Text>
            </Pressable>
          )}
        </VStack>
      </ScrollView>
    </View>
  );
}
