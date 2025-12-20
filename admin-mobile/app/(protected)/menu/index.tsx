import { View, Text, Button, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

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
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-xl font-bold mb-8">Menu</Text>
      <Button title="Sign Out" onPress={handleLogout} color="red" />
    </View>
  );
}
