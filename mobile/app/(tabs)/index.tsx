import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutGrid, MapPin } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { HomeHeader } from '@/components/home/HomeHeader';
import { CategoryRail } from '@/components/home/CategoryRail';
import { CityGrid } from '@/components/home/CityGrid';

export default function HomeScreen() {
  return (
    <Box className="flex-1 bg-background">
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Box className="bg-background pt-2 pb-8">
            <Box className="px-4">
              <HomeHeader />
            </Box>

            <Box className="flex-row items-center px-4 mb-3">
              <Icon as={LayoutGrid} size="sm" className="text-primary mr-2" />
              <Text className="text-text-main text-lg font-bold">Kategórie</Text>
            </Box>
            <CategoryRail />

            <Box className="flex-row items-center px-4 mt-6 mb-3">
              <Icon as={MapPin} size="sm" className="text-primary mr-2" />
              <Text className="text-text-main text-lg font-bold">Mestá</Text>
            </Box>
            <CityGrid />
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
