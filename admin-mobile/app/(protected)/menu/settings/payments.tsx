import { ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";

export default function SettingsPaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Box className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Platby" onPress={() => router.back()} />
        </HStack>
      </Box>

      <ScrollView className="flex-1 p-4">
        <Box className="mb-6">
          <Text className="text-sm text-gray-600 mt-1">Nastavte platobné metódy, politiky a fakturáciu.</Text>
        </Box>

        <Box className="bg-white rounded-xl border border-dashed border-gray-300 p-6">
          <Text className="text-sm text-gray-600">
            Tu pribudnú nastavenia platieb (napr. akceptované metódy, zálohy, fakturačné preferencie).
          </Text>
        </Box>
      </ScrollView>
    </Box>
  );
}
