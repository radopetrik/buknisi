import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Dog, Eye, Hand, HandHeart, HeartPulse, Scissors, ScissorsLineDashed, Sparkles } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Image } from '@/components/ui/image';
import { Pressable } from '@/components/ui/pressable';
import { getUserOrNull, supabase } from '@/lib/supabase';
import { router } from 'expo-router';

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
};

function getCategoryIcon(slug: string): LucideIcon {
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
      return Sparkles; 
  }
}

export function CategoryRail() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [failedImagesById, setFailedImagesById] = useState<Record<string, boolean>>({});
  const [preferredCitySlug, setPreferredCitySlug] = useState('bratislava');

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

  useEffect(() => {
    async function fetchPreferredCitySlug() {
      try {
        let citySlug = 'bratislava';

        const user = await getUserOrNull();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_city_id')
            .eq('id', user.id)
            .single();

          const preferredCityId = profile?.preferred_city_id;
          if (preferredCityId) {
            const { data: city } = await supabase
              .from('cities')
              .select('slug')
              .eq('id', preferredCityId)
              .single();

            if (city?.slug) {
              citySlug = city.slug;
            }
          }
        }

        setPreferredCitySlug(citySlug);
      } catch {
        // ignore and keep default
      }
    }

    fetchPreferredCitySlug();
  }, []);

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {categoriesByRow.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 16 }}>
          {row.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            const imageUrl = category.image_url?.trim() || null;
            const showImage = Boolean(imageUrl) && !failedImagesById[category.id];

            return (
              <View key={category.id} style={{ width: '25%', paddingHorizontal: 6 }}>
                <Pressable
                  className="w-full"
                  onPress={() =>
                    router.push({
                      pathname: '/explore/[city]/[category]',
                      params: {
                        city: preferredCitySlug,
                        category: category.slug,
                      },
                    })
                  }
                >
                  <Box className="w-full aspect-square rounded-[24px] bg-white border-2 border-primary p-2 justify-between items-center mb-1 shadow-sm shadow-primary/10">
                    <Box className="flex-1 items-center justify-center pt-2">
                      {showImage ? (
                        <Image
                          source={{ uri: imageUrl! }}
                          alt={category.name}
                          resizeMode="contain"
                          style={{ width: 36, height: 36 }}
                          onError={() =>
                            setFailedImagesById((prev) => ({
                              ...prev,
                              [category.id]: true,
                            }))
                          }
                        />
                      ) : (
                          <Icon size={32} color="#d4a373" strokeWidth={1.5} />
                      )}
                    </Box>
                    <Box className="pb-2 px-1 w-full">
                      <Text className="text-primary text-[11px] font-bold text-center leading-3" numberOfLines={2}>
                        {category.name}
                      </Text>
                    </Box>
                  </Box>
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
