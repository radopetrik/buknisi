import { Stack } from 'expo-router';

export default function MenuLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Menu' }} />
      <Stack.Screen name="staff" options={{ headerShown: false }} />
      <Stack.Screen name="ratings" options={{ title: 'Hodnotenia' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="settings" options={{ title: 'Nastavenia' }} />
    </Stack>
  );
}
