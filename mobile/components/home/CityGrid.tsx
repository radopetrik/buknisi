import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

type City = {
  id: string;
  name: string;
  slug: string;
};

export function CityGrid() {
  const [cities, setCities] = useState<City[]>([]);

  const citiesByRow = useMemo(() => {
    const rows: City[][] = [];
    for (let i = 0; i < cities.length; i += 2) {
      rows.push(cities.slice(i, i + 2));
    }
    return rows;
  }, [cities]);

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase.from('cities').select('*').order('name');
      if (data) setCities(data as City[]);
    }

    fetchCities();
  }, []);

  if (cities.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {citiesByRow.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 12 }}>
          {row.map((city) => (
            <View key={city.id} style={{ width: '50%', paddingHorizontal: 6 }}>
              <Pressable onPress={() => router.push(`/explore/${city.slug}`)}>
                <Box className="bg-white rounded-2xl px-4 py-4 border border-border flex-row items-center justify-center shadow-sm">
                  <Icon as={MapPin} size="xs" className="text-primary mr-2" />
                  <Text className="text-text-main font-bold text-center" numberOfLines={1}>
                    {city.name}
                  </Text>
                </Box>
              </Pressable>
            </View>
          ))}

          {row.length < 2 ? <View style={{ width: '50%', paddingHorizontal: 6 }} /> : null}
        </View>
      ))}
    </View>
  );
}
