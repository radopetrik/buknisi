import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CityCategoriesScreen() {
  const { city: citySlug } = useLocalSearchParams();
  const [city, setCity] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (citySlug) fetchData();
  }, [citySlug]);

  async function fetchData() {
    try {
      const { data: cityData } = await supabase.from('cities').select('*').eq('slug', citySlug).single();
      
      if (cityData) {
        setCity(cityData);
        const { data: catsData } = await supabase.from('categories').select('*').order('ordering');
        if (catsData) setCategories(catsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator color="#d4a373" />
      </View>
    );
  }

  if (!city) return null;

  return (
    <View className="flex-1 bg-background p-4">
      <Stack.Screen options={{ title: `Kategórie - ${city.name}` }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-3">
            {categories.map((cat) => (
                <Link key={cat.id} href={`/${city.slug}/${cat.slug}`} asChild>
                    <TouchableOpacity className="bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm flex-grow">
                        <Text className="font-semibold text-text-main text-center">{cat.name}</Text>
                    </TouchableOpacity>
                </Link>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
