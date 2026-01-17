import { View, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorText } from "@/components/ui/form-control";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { Stack, useRouter } from "expo-router";


const loginSchema = z.object({
  email: z.string().email("Zadajte platný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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
    <View style={{ paddingTop: insets.top }} className="flex-1 justify-center bg-gray-50 px-6">
      <Stack.Screen options={{ title: "Prihlásenie", headerShown: false }} />
      <View className="mb-8 items-center">
        <Text className="text-2xl font-bold text-typography-900">Vitajte späť</Text>
        <Text className="text-typography-500">Prihláste sa pre správu vašej firmy</Text>
      </View>

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
          <FormControl isInvalid={!!errors.password} className="mb-4">
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

      <Button
        className="mt-4"
        onPress={handleSubmit(onSubmit)}
        isDisabled={isSubmitting}
      >
        {isSubmitting && <ButtonSpinner color="white" />}
        <ButtonText>Prihlásiť sa</ButtonText>
      </Button>

      <View className="mt-6 items-center">
        <Pressable onPress={() => router.push("/(auth)/register")} className="px-3 py-2">
          <Text className="text-typography-600">
            Nemáte účet? <Text className="text-typography-900 font-semibold">Zaregistrovať firmu</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
