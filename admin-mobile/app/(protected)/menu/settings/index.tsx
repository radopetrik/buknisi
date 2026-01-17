import { Pressable, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Briefcase, Calendar, ChevronRight, CreditCard } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderBackButton } from "@/components/header-back-button";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

const categories = [
  {
    title: "Služby",
    description: "Spravujte ponuku služieb, trvania a ceny.",
    route: "/(protected)/menu/settings/services",
    icon: Briefcase,
  },
  {
    title: "Rezervácie",
    description: "Nastavte pravidlá plánovania, buffery a notifikácie.",
    route: "/(protected)/menu/settings/bookings",
    icon: Calendar,
  },
  {
    title: "Platby",
    description: "Nastavte platobné metódy, politiky a fakturáciu.",
    route: "/(protected)/menu/settings/payments",
    icon: CreditCard,
  },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Box className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <Box style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-200 px-4 py-3">
        <HStack className="items-center justify-between">
          <HeaderBackButton label="Nastavenia" onPress={() => router.back()} />
        </HStack>
      </Box>

      <ScrollView className="flex-1 p-4">
        <Box className="mb-6">
          <Text className="text-sm text-gray-600 mt-1">Spravujte preferencie a konfiguráciu svojho účtu.</Text>
        </Box>

        <VStack className="bg-white rounded-xl overflow-hidden border border-gray-100">
          {categories.map((category, index) => (
            <Box key={category.route}>
              <Pressable
                onPress={() => router.push(category.route)}
                className="p-4 bg-white active:bg-gray-50"
              >
                <HStack className="items-start justify-between">
                  <HStack className="flex-1 items-start pr-3">
                    <Box className="h-10 w-10 rounded-lg bg-blue-50 items-center justify-center">
                      <category.icon size={22} color="#2563EB" />
                    </Box>
                    <Box className="flex-1 ml-3">
                      <Text className="text-base text-gray-900 font-semibold">
                        {category.title}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {category.description}
                      </Text>
                    </Box>
                  </HStack>
                  <ChevronRight size={20} color="#9CA3AF" />
                </HStack>
              </Pressable>
              {index < categories.length - 1 && <Divider className="bg-gray-100" />}
            </Box>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
}
