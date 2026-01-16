import { Alert, Pressable, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Users, Star, User, Settings, ChevronRight } from "lucide-react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Divider } from "@/components/ui/divider";

export default function MenuScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      router.replace("/(auth)/login");
      return;
    }

    // If refresh token is already invalid/revoked, fall back to local sign-out.
    if (error.message.includes("Invalid Refresh Token")) {
      await supabase.auth.signOut({ scope: "local" });
      router.replace("/(auth)/login");
      return;
    }

    Alert.alert("Error", error.message);
  };

  const menuItems = [
    { 
      label: "Zamestnanci", 
      icon: Users, 
      route: "/(protected)/menu/staff" 
    },
    { 
      label: "Hodnotenia", 
      icon: Star, 
      route: "/(protected)/menu/ratings" 
    },
    { 
      label: "Profil", 
      icon: User, 
      route: "/(protected)/menu/profile" 
    },
    { 
      label: "Nastavenia", 
      icon: Settings, 
      route: "/(protected)/menu/settings" 
    },
  ];

  return (
    <Box className="flex-1 bg-gray-50">
      <Box className="bg-white p-6 pt-12 pb-6 border-b border-gray-100">
        <Heading size="xl" className="font-bold">Viac</Heading>
      </Box>
      
      <ScrollView className="flex-1 p-4">
        <VStack className="bg-white rounded-xl overflow-hidden border border-gray-100 mb-6">
          {menuItems.map((item, index) => (
            <Box key={item.label}>
              <Pressable 
                onPress={() => router.push(item.route)}
                className="p-4 flex-row items-center justify-between bg-white active:bg-gray-50"
              >
                <HStack className="items-center space-x-3">
                  <Box className="w-8 items-center">
                    <item.icon size={20} color="#374151" />
                  </Box>
                  <Text className="text-base text-gray-900 font-medium ml-3">{item.label}</Text>
                </HStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </Pressable>
              {index < menuItems.length - 1 && <Divider className="bg-gray-100" />}
            </Box>
          ))}
        </VStack>

        <Button 
          action="negative" 
          variant="outline" 
          onPress={handleLogout}
          className="border-red-200"
        >
          <ButtonText className="text-red-600">Odhlásiť sa</ButtonText>
        </Button>
      </ScrollView>
    </Box>
  );
}
