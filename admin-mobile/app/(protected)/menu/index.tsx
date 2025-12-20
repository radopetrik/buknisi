import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";

export default function MenuScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        Alert.alert("Error", error.message);
    } else {
        router.replace("/(auth)/login");
    }
  };

  return (
    <Box className="flex-1 justify-center items-center bg-white p-6">
      <Heading size="xl" className="font-bold mb-8">Menu</Heading>
      <Button action="negative" onPress={handleLogout}>
        <ButtonText>Sign Out</ButtonText>
      </Button>
    </Box>
  );
}
