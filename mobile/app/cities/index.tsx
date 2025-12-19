import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CitiesScreen() {
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('cities').select('*').then(({ data }) => {
      if (data) setCities(data);
    });
  }, []);

  return (
    <View className="flex-1 bg-background p-4">
      <Stack.Screen options={{ title: 'Vyberte mesto', headerBackTitle: 'Späť' }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-text-main mb-4">Dostupné mestá</Text>
        {cities.map((city) => (
          <Link key={city.id} href={`/${city.slug}`} asChild>
            <TouchableOpacity className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row justify-between items-center shadow-sm">
              <Text className="text-lg font-semibold text-text-main">{city.name}</Text>
              <FontAwesome name="chevron-right" size={14} color="#d4a373" />
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
