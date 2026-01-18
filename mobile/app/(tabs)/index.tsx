import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HomeHeader } from '@/components/home/HomeHeader';
import { CategoryRail } from '@/components/home/CategoryRail';

export default function HomeScreen() {
  return (
    <Box className="flex-1 bg-white">
      {/* SafeAreaView bg matches the header color (black) */}
      <SafeAreaView edges={['top']} className="flex-1 bg-black">
        <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Header Section Background */}
          <Box className="bg-white">
            <Box className="mb-4">
              <HomeHeader />
            </Box>

            <Box className="px-6 mb-5 mt-2">
              <Text className="text-text-main text-xl font-bold tracking-tight">Čo si chcete rezervovať?</Text>
            </Box>
            <CategoryRail />
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
