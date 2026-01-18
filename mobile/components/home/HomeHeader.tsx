import { View } from 'react-native';
import { User, Sparkles, Star, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

import { Box } from '@/components/ui/box';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export function HomeHeader() {
  return (
    <Box className="pb-8 pt-2 bg-black">
      <Box className="flex-row items-center justify-between mb-8 px-6">
        <Image
          source={require('@/assets/images/logo_buknisi.png')}
          alt="Buknisi"
          resizeMode="contain"
          style={{ width: 140, height: 42, tintColor: 'white' }}
        />
        <Pressable 
          className="w-12 h-12 items-center justify-center bg-white/10 rounded-full border border-white/20"
          onPress={() => router.push('/(tabs)/profile')}
        >
          <User size={22} color="white" />
        </Pressable>
      </Box>
      
      <Box className="mb-8 px-6">
        <SearchInputTrigger 
          placeholder="Hľadať službu alebo podnik..." 
          className="shadow-lg h-[72px] bg-white rounded-3xl border-0" 
        />
      </Box>

      <View className="flex-row justify-between px-6">
        <Box className="bg-white/10 px-3 py-3 rounded-2xl flex-1 flex-row items-center justify-center mr-2 border border-white/5">
          <Clock size={16} color="#d4a373" style={{ marginRight: 6 }} />
          <Text className="text-white font-semibold text-xs text-center">Dnes voľné</Text>
        </Box>
        
        <Box className="bg-white/10 px-3 py-3 rounded-2xl flex-1 flex-row items-center justify-center mr-2 border border-white/5">
          <Sparkles size={16} color="#d4a373" style={{ marginRight: 6 }} />
          <Text className="text-white font-semibold text-xs text-center">Najbližšie</Text>
        </Box>

        <Box className="bg-white/10 px-3 py-3 rounded-2xl flex-1 flex-row items-center justify-center border border-white/5">
          <Star size={16} color="#d4a373" style={{ marginRight: 6 }} fill="#d4a373" />
          <Text className="text-white font-semibold text-xs text-center">Top</Text>
        </Box>
      </View>
    </Box>
  );
}
