import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export default function NewClientScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return !!company?.id && firstName.trim().length > 0 && lastName.trim().length > 0 && !saving;
  }, [company?.id, firstName, lastName, saving]);

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerTitle: "Nový klient" }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Nový klient" onPress={() => router.replace("/(protected)/clients")} />
        </HStack>
      </Box>

      <Box className="p-4">
        <VStack className="gap-4">
          <Box>
            <Text className="text-sm text-gray-600 mb-1">Meno</Text>
            <Input className="bg-white">
              <InputField value={firstName} onChangeText={setFirstName} placeholder="Ján" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Priezvisko</Text>
            <Input className="bg-white">
              <InputField value={lastName} onChangeText={setLastName} placeholder="Novák" />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Telefón (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={phone}
                onChangeText={setPhone}
                placeholder="0900 123 456"
                keyboardType="phone-pad"
              />
            </Input>
          </Box>

          <Box>
            <Text className="text-sm text-gray-600 mb-1">Email (voliteľné)</Text>
            <Input className="bg-white">
              <InputField
                value={email}
                onChangeText={setEmail}
                placeholder="email@domena.sk"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </Box>

          {errorMessage ? <Text className="text-red-600">{errorMessage}</Text> : null}

          <Button
            className="w-full"
            disabled={!canSave}
            onPress={async () => {
              if (!company?.id) return;

              setSaving(true);
              setErrorMessage(null);

              try {
                const { data, error } = await supabase
                  .from("clients")
                  .insert({
                    company_id: company.id,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    phone: phone.trim() ? phone.trim() : null,
                    email: email.trim() ? email.trim().toLowerCase() : null,
                  })
                  .select("id")
                  .single();

                if (error) throw error;

                await queryClient.invalidateQueries({ queryKey: ["clients", company.id] });
                router.replace(`/(protected)/clients/${data.id}`);
              } catch (err: any) {
                setErrorMessage(err?.message ?? "Nepodarilo sa uložiť klienta.");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? <ButtonSpinner /> : null}
            <ButtonText>{saving ? "Ukladám..." : "Uložiť"}</ButtonText>
          </Button>

          <Button
            variant="outline"
            action="secondary"
            className="w-full"
            onPress={() => router.replace("/(protected)/clients")}
          >
            <ButtonText>Zrušiť</ButtonText>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
