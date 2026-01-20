import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';

const HERO_BACKGROUND_URL =
  'https://images.unsplash.com/photo-1554519515-242161756769?auto=format&fit=crop&w=1800&q=80';
const SPLASH_DURATION_MS = 1500;

export default function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Box className="flex-1 items-center justify-center">
        <Image
          source={{ uri: HERO_BACKGROUND_URL }}
          alt="Bukni Si pozadie"
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
        <Box className="absolute inset-0 bg-black/50" />
        <Box className="items-center px-8">
          <Image
            source={require('@/assets/images/logo_buknisi.png')}
            alt="Bukni Si"
            className="h-16 w-48"
            resizeMode="contain"
          />
          <Text className="text-white/80 text-base text-center mt-4">Loading...</Text>
          <ActivityIndicator size="small" color="#fff" className="mt-4" />
        </Box>
      </Box>
    </SafeAreaView>
  );
}
