import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export function CategoryRail() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('ordering');
      
      if (data) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, []);

  if (categories.length === 0) {
    return null;
  }

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      className="flex-grow-0 mb-8"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}
    >
      {categories.map((category) => (
        <Pressable 
          key={category.id} 
          className="items-center gap-2"
          onPress={() => router.push({
            pathname: '/(tabs)/explore',
            params: { category: category.slug }
          })}
        >
          <Box className="rounded-full overflow-hidden w-[72px] h-[72px] bg-gray-100 border-2 border-transparent">
             {/* Using a placeholder if no image in DB, or if DB has icon_url/image_url */}
             <Image
                source={{ uri: category.image_url || `https://ui-avatars.com/api/?name=${category.name}&background=random` }}
                alt={category.name}
                className="w-full h-full"
                resizeMode="cover"
              />
          </Box>
          <Text className="text-white text-xs font-medium">{category.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
