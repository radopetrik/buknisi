import { View } from 'react-native';
import { User } from 'lucide-react-native';
import { router } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export function HomeHeader() {
  return (
    <Box className="pb-2 pt-2">
      <Box className="flex-row items-center justify-between mb-6">
        <Image
          source={require('@/assets/images/logo_buknisi.png')}
          alt="Buknisi"
          resizeMode="contain"
          style={{ width: 140, height: 40 }}
        />
        <Pressable 
          className="w-10 h-10 items-center justify-center bg-white rounded-full border border-border"
          onPress={() => router.push('/(tabs)/profile')}
        >
          <User size={20} color="#2c2c2c" />
        </Pressable>
      </Box>
      
      <Box className="mb-2">
        <Text className="text-3xl font-extrabold text-text-main mb-6">
          Objavte najlepšie služby
        </Text>
        <SearchInputTrigger 
          placeholder="Čo hľadáte?" 
          className="shadow-md border-primary/30 h-16" 
        />
      </Box>
    </Box>
  );
}
