import { useCallback } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

export default function CreateBookingRedirect() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      router.replace({
        pathname: "/(protected)/calendar",
        params: { create: "1" },
      });
    }, [router])
  );

  // This screen should never be visible for long, but showing
  // a tiny loader prevents a “blank screen” flash.
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator />
    </View>
  );
}
