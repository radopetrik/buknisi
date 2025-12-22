import React from 'react';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react-native';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';

export function HomeHeader() {
  return (
    <Box className="pb-4 pt-2">
      <Box className="flex-row items-center justify-center mb-4">
        <Heading className="text-3xl font-bold text-white tracking-wide">
          booksy
        </Heading>
      </Box>
      <Link href="/(tabs)/explore" asChild>
        <Pressable>
          <Box pointerEvents="none">
            <Input
              size="lg"
              variant="rounded"
              className="bg-white border-0 h-12"
              isReadOnly={true}
            >
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} className="text-gray-400" />
              </InputSlot>
              <InputField
                placeholder="Čo hľadáte?"
                placeholderTextColor="#9CA3AF"
                className="text-base"
                editable={false}
              />
            </Input>
          </Box>
        </Pressable>
      </Link>
    </Box>
  );
}
