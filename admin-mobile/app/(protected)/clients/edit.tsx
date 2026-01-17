import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

type ClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
};

export default function EditClientScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: company } = useCompany();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();

  const enabled = !!company?.id && !!clientId;

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", company?.id, clientId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, phone, email")
        .eq("company_id", company!.id)
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data as ClientRow;
    },
  });

  const [hydrated, setHydrated] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!client || hydrated) return;

    setFirstName(client.first_name ?? "");
    setLastName(client.last_name ?? "");
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setHydrated(true);
  }, [client, hydrated]);

  const canSave = useMemo(() => {
    return !!company?.id && !!clientId && firstName.trim().length > 0 && lastName.trim().length > 0 && !saving;
  }, [company?.id, clientId, firstName, lastName, saving]);

  const goBackToDetail = () => {
    if (!clientId) {
      router.replace("/(protected)/clients");
      return;
    }
    router.replace(`/(protected)/clients/${clientId}`);
  };

  return (
    <Box style={{ paddingTop: insets.top }} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerTitle: "Upraviť klienta" }} />

      <Box className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HStack className="items-center">
            <Pressable onPress={goBackToDetail} className="p-2 -ml-2">
              <ChevronLeft size={22} color="#111827" />
            </Pressable>
            <Text className="text-base font-semibold text-gray-900">Upraviť klienta</Text>
          </HStack>
        </HStack>
      </Box>

      {isLoading ? (
        <Box className="flex-1 items-center justify-center">
          <Spinner size="large" color="black" />
        </Box>
      ) : !client ? (
        <Box className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-600 text-center">Klient nebol nájdený.</Text>
        </Box>
      ) : (
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
                if (!company?.id || !clientId) return;

                setSaving(true);
                setErrorMessage(null);

                try {
                  const { error } = await supabase
                    .from("clients")
                    .update({
                      first_name: firstName.trim(),
                      last_name: lastName.trim(),
                      phone: phone.trim() ? phone.trim() : null,
                      email: email.trim() ? email.trim().toLowerCase() : null,
                    })
                    .eq("company_id", company.id)
                    .eq("id", clientId);

                  if (error) throw error;

                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["clients", company.id] }),
                    queryClient.invalidateQueries({ queryKey: ["client", company.id, clientId] }),
                    queryClient.invalidateQueries({ queryKey: ["clientBookings", company.id, clientId] }),
                    queryClient.invalidateQueries({ queryKey: ["clientInvoices", company.id, clientId] }),
                  ]);

                  goBackToDetail();
                } catch (err: any) {
                  setErrorMessage(err?.message ?? "Nepodarilo sa uložiť zmeny.");
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
              onPress={goBackToDetail}
            >
              <ButtonText>Zrušiť</ButtonText>
            </Button>
          </VStack>
        </Box>
      )}
    </Box>
  );
}
