import { ScrollView } from "react-native";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function SettingsPaymentsScreen() {
  return (
    <Box className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <Box className="mb-6">
          <Heading size="xl" className="font-bold">
            Platby
          </Heading>
          <Text className="text-sm text-gray-600 mt-1">
            Nastavte platobné metódy, politiky a fakturáciu.
          </Text>
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
