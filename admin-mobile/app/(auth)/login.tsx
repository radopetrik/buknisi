import { View, Alert, Image, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Stack, useRouter } from "expo-router";

const loginSchema = z.object({
  email: z.string().email("Zadajte platný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const AUTH_BG_URI =
  "https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      Alert.alert("Prihlásenie zlyhalo", error.message);
    } else {
      router.replace("/(protected)/calendar");
    }
  };

  return (
    <ImageBackground source={{ uri: AUTH_BG_URI }} resizeMode="cover" className="flex-1">
      <Stack.Screen options={{ title: "Prihlásenie", headerShown: false }} />

      {/* Dark overlay for readability */}
      <View className="absolute inset-0 bg-black/40" />

      <View style={{ paddingTop: insets.top }} className="flex-1 justify-center px-6">
        <View className="items-center mb-6">
          <Image
            source={require("../../assets/images/logo_buknisi.png")}
            accessibilityLabel="Buknisi"
            style={{ height: 64, width: 220 }}
            resizeMode="contain"
          />
          <Text className="mt-5 text-white/80 text-center">
            Prihláste sa pre správu vašej firmy
          </Text>
        </View>

        <View className="rounded-2xl bg-white/95 p-6 border border-white/30">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormControl isInvalid={!!errors.email} className="mb-4">
                <FormControlLabel className="mb-1">
                  <FormControlLabelText>Email</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    placeholder="name@example.com"
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
              <FormControl isInvalid={!!errors.password} className="mb-2">
                <FormControlLabel className="mb-1">
                  <FormControlLabelText>Heslo</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    placeholder="Zadajte heslo"
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

          <View className="items-end">
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Reset hesla",
                  "Táto funkcia bude doplnená čoskoro."
                )
              }
              className="py-2"
            >
              <Text className="text-sm text-typography-900 underline">Zabudli ste heslo?</Text>
            </Pressable>
          </View>

          <Button
            className="mt-2"
            onPress={handleSubmit(onSubmit)}
            isDisabled={isSubmitting}
          >
            {isSubmitting && <ButtonSpinner color="white" />}
            <ButtonText>Prihlásiť sa</ButtonText>
          </Button>

          <Button
            className="mt-3"
            variant="outline"
            action="primary"
            onPress={() => router.push("/(auth)/register")}
          >
            <ButtonText className="text-typography-900">Zaregistrovať firmu</ButtonText>
          </Button>

          <Text className="mt-4 text-center text-xs text-typography-600">
            Nemáte ešte účet? Registrácia vytvorí nový firemný profil.
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}
