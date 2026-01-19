import { Stack } from "expo-router";
import SplashScreen from "@/components/splash-screen";

export default function SplashRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SplashScreen />
    </>
  );
}
