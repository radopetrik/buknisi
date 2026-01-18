import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { getUserOrNull, supabase } from '@/lib/supabase';
import { router } from 'expo-router';

type Category = {
  id: string;
  name: string;
  slug: string;
};

export function CategoryRail() {
  const [categories, setCategories] = useState<Category[]>([]);
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
      const { data } = await supabase.from('categories').select('id, name, slug').order('ordering');
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
          {row.map((category) => (
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
                <Box className="w-full aspect-square rounded-[24px] bg-white border-2 border-primary p-2 items-center justify-center mb-1 shadow-sm shadow-primary/10">
                  <Box className="px-1">
                    <Text className="text-primary text-[12px] font-bold text-center leading-4" numberOfLines={3}>
                      {category.name}
                    </Text>
                  </Box>
                </Box>
              </Pressable>
            </View>
          ))}

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
