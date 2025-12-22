import React from 'react';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';

export type BusinessCardProps = {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  image: string;
  promoted?: boolean;
};

export function BusinessCard({ 
  name, 
  address, 
  rating, 
  reviewCount, 
  image, 
  promoted 
}: BusinessCardProps) {
  return (
    <Pressable className="mr-4 w-72">
      <Box className="rounded-xl overflow-hidden bg-white mb-2 shadow-sm">
        <Box className="relative h-48 w-full">
          <Image
            source={{ uri: image }}
            alt={name}
            className="w-full h-full"
            resizeMode="cover"
          />
          <Box className="absolute top-4 right-4 bg-black/70 px-2 py-1 rounded">
            <Text className="text-white font-bold text-center text-lg">{rating.toFixed(1)}</Text>
            <Text className="text-white text-xs">{reviewCount} reviews</Text>
          </Box>
        </Box>
      </Box>
      
      <Heading className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>
        {name}
      </Heading>
      <Text className="text-gray-500 text-sm mb-2" numberOfLines={2}>
        {address}
      </Text>
      
      {promoted && (
        <Box className="flex-row items-center">
             <Text className="text-xs text-gray-400">Promoted</Text>
             <Box className="ml-1 w-3 h-3 rounded-full border border-gray-400 items-center justify-center">
                <Text className="text-[8px] text-gray-400">i</Text>
             </Box>
        </Box>
      )}
    </Pressable>
  );
}
