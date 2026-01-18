import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HomeHeader } from '@/components/home/HomeHeader';
import { CategoryRail } from '@/components/home/CategoryRail';

export default function HomeScreen() {
  return (
    <Box className="flex-1 bg-background">
      <SafeAreaView edges={['top']} className="flex-1 bg-background">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Box className="bg-background pt-2 pb-8">
            <Box className="px-4 mb-4">
              <HomeHeader />
            </Box>

            <Box className="px-4 mb-4 mt-2">
              <Text className="text-text-main text-xl font-bold">Kategórie</Text>
            </Box>
            <CategoryRail />
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
