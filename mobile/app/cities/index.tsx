import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
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

  async function handleSelectCity(city: any) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_city_id: city.id })
          .eq('id', user.id);

        if (error) {
          Alert.alert('Chyba', error.message);
        }
      }
    } catch {
      // ignore
    } finally {
      router.push(`/${city.slug}`);
    }
  }

  return (
    <View className="flex-1 bg-background p-4">
      <Stack.Screen options={{ title: 'Vyberte mesto', headerBackTitle: 'Späť' }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-text-main mb-4">Dostupné mestá</Text>
        {cities.map((city) => (
          <TouchableOpacity
            key={city.id}
            onPress={() => handleSelectCity(city)}
            className="bg-white p-4 rounded-xl border border-gray-100 mb-3 flex-row justify-between items-center shadow-sm"
          >
            <Text className="text-lg font-semibold text-text-main">{city.name}</Text>
            <FontAwesome name="chevron-right" size={14} color="#d4a373" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
