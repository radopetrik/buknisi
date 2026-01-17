import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Nastavenia" }}
      />
      <Stack.Screen
        name="services"
        options={{ title: "Služby" }}
      />
      <Stack.Screen
        name="bookings"
        options={{ title: "Rezervácie" }}
      />
      <Stack.Screen
        name="payments"
        options={{ title: "Platby" }}
      />
    </Stack>
  );
}
