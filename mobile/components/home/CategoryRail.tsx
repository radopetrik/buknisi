import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Dog, Eye, Hand, HandHeart, HeartPulse, Scissors, ScissorsLineDashed, Sparkles } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed[0]?.toUpperCase() ?? '?';
}

function getCategoryIcon(slug: string): LucideIcon | null {
  switch (slug) {
    case 'kadernictvo':
      return Scissors;
    case 'barbershop':
      return ScissorsLineDashed;
    case 'kozmetika':
      return Sparkles;
    case 'manikura-pedikura':
      return Hand;
    case 'fyzioterapia':
      return HeartPulse;
    case 'obocie-a-mihalnice':
      return Eye;
    case 'masaze':
      return HandHeart;
    case 'sluzby-pre-zvierata':
      return Dog;
    default:
      return null;
  }
}

export function CategoryRail() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [failedImagesById, setFailedImagesById] = useState<Record<string, boolean>>({});

  const categoriesByRow = useMemo(() => {
    const rows: Category[][] = [];
    for (let i = 0; i < categories.length; i += 4) {
      rows.push(categories.slice(i, i + 4));
    }
    return rows;
  }, [categories]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('ordering');
      if (data) setCategories(data as Category[]);
    }

    fetchCategories();
  }, []);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {categoriesByRow.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 16 }}>
          {row.map((category) => {
            const initial = getInitial(category.name);
            const Icon = getCategoryIcon(category.slug);
            const imageUrl = category.image_url?.trim() || null;
            const showImage = Boolean(imageUrl) && !failedImagesById[category.id];

            return (
              <View key={category.id} style={{ width: '25%', paddingHorizontal: 6 }}>
                <Pressable
                  className="items-center"
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/explore',
                      params: { category: category.slug },
                    })
                  }
                >
                  <Box className="rounded-full overflow-hidden w-[72px] h-[72px] items-center justify-center bg-white border border-border">
                    {showImage ? (
                      <Box className="w-full h-full items-center justify-center bg-white">
                        <Image
                          source={{ uri: imageUrl! }}
                          alt={category.name}
                          resizeMode="contain"
                          style={{ width: 44, height: 44 }}
                          onError={() =>
                            setFailedImagesById((prev) => ({
                              ...prev,
                              [category.id]: true,
                            }))
                          }
                        />
                      </Box>
                    ) : (
                      <Box className="w-full h-full items-center justify-center bg-accent-pink">
                        {Icon ? (
                          <Icon size={32} color="#d4a373" />
                        ) : (
                          <Text className="text-primary text-xl font-bold">{initial}</Text>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Text className="text-text-main text-xs font-medium mt-2 text-center" numberOfLines={2}>
                    {category.name}
                  </Text>
                </Pressable>
              </View>
            );
          })}

          {row.length < 4
            ? Array.from({ length: 4 - row.length }).map((_, i) => (
                <View key={`spacer-${rowIndex}-${i}`} style={{ width: '25%', paddingHorizontal: 6 }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
