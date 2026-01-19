import { Image, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black">
      <View style={{ paddingTop: insets.top }} className="flex-1 items-center justify-center px-6">
        <Image
          source={require("../assets/images/logo_buknisi.png")}
          accessibilityLabel="Buknisi"
          style={{ height: 72, width: 240 }}
          resizeMode="contain"
        />
        <Text
          className="mt-6 text-white text-center text-2xl"
          style={{ fontFamily: "Manrope" }}
        >
          Buď sebavedomá
        </Text>
        <Text
          className="mt-2 text-white/70 text-center"
          style={{ fontFamily: "Manrope" }}
        >
          Načítavame vaše údaje
        </Text>
        <ActivityIndicator size="large" className="mt-6" />
      </View>
    </View>
  );
}
