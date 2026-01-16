import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, Link, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CityScreen() {
  const { city: citySlug } = useLocalSearchParams();
  const [city, setCity] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
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
        
        const { data: compsData } = await supabase
            .from('companies')
            .select('*, city:cities(name), category:categories(name), photos(url)')
            .eq('city_id', cityData.id)
            .limit(10);

        if (catsData) setCategories(catsData);
        if (compsData) setCompanies(compsData);
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

  if (!city) {
    return (
      <View className="flex-1 justify-center items-center bg-background p-4">
        <Text className="text-lg text-text-main font-bold mb-2">Mesto nenájdené</Text>
        <Link href="/cities" asChild>
          <TouchableOpacity>
            <Text className="text-primary underline">Späť na zoznam miest</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: city.name, headerBackTitle: 'Mestá' }} />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        
        {/* Search Box */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <View className="flex-row items-center border-b border-gray-100 pb-3 mb-3">
                <FontAwesome name="search" size={16} color="#999" style={{marginRight: 10}} />
                <TextInput 
                    placeholder={`Hľadať v ${city.name}...`} 
                    className="flex-1 text-base text-text-main"
                    placeholderTextColor="#999"
                />
            </View>
            <View className="flex-row items-center">
                 <FontAwesome name="calendar" size={16} color="#999" style={{marginRight: 10}} />
                 <Text className="text-base text-text-muted flex-1">Kedykoľvek</Text>
            </View>
        </View>

        {/* Categories */}
        <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-text-main">Kategórie</Text>
                <Link href={`/explore/${city.slug}/categories`} asChild>
                    <TouchableOpacity>
                        <Text className="text-sm text-primary font-semibold">Všetky</Text>
                    </TouchableOpacity>
                </Link>
            </View>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mx-[-16px]"
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
                {categories.map((cat) => (
                    <TouchableOpacity 
                        key={cat.id} 
                        onPress={() => router.push(`/explore/${city.slug}/${cat.slug}`)}
                        className="mr-3 bg-white px-4 py-3 rounded-full border border-gray-100 shadow-sm"
                    >
                        <Text className="font-semibold text-text-main">{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Recommended */}
        <View className="mb-8 pb-10">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-text-main">Odporúčané v {city.name}</Text>
             </View>
             
             {companies.map((comp) => (
                 <Link key={comp.id} href={`/company/${comp.slug}`} asChild>
                    <TouchableOpacity className="bg-white rounded-2xl mb-5 shadow-sm border border-gray-100 overflow-hidden">
                        <Image 
                            source={{ uri: comp.photos?.[0]?.url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' }} 
                            className="w-full h-44 bg-gray-200"
                        />
                        <View className="p-4">
                            <View className="flex-row justify-between items-start mb-1">
                                <Text className="text-lg font-bold text-text-main flex-1 mr-2">{comp.name}</Text>
                                <View className="flex-row items-center bg-accent-pink px-2 py-1 rounded-lg">
                                    <FontAwesome name="star" size={12} color="#d4a373" style={{marginRight: 4}} />
                                    <Text className="text-xs font-bold text-primary">{Number(comp.rating || 0).toFixed(1)}</Text>
                                </View>
                            </View>
                            <Text className="text-text-muted text-sm mb-2">{comp.city?.name} • {comp.category?.name}</Text>
                        </View>
                    </TouchableOpacity>
                 </Link>
             ))}
        </View>

      </ScrollView>
    </View>
  );
}
