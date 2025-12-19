import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CategoryListingScreen() {
  const { city: citySlug, category: categorySlug } = useLocalSearchParams();
  const [data, setData] = useState<{city: any, category: any, companies: any[]} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (citySlug && categorySlug) fetchData();
  }, [citySlug, categorySlug]);

  async function fetchData() {
    try {
      const { data: city } = await supabase.from('cities').select('*').eq('slug', citySlug).single();
      const { data: category } = await supabase.from('categories').select('*').eq('slug', categorySlug).single();

      if (city && category) {
        const { data: companies } = await supabase
          .from('companies')
          .select('*, photos(url), services(*)')
          .eq('city_id', city.id)
          .eq('category_id', category.id);
          
        setData({ city, category, companies: companies || [] });
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

  if (!data?.city || !data?.category) {
    return (
       <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-lg text-text-main">Nenašlo sa</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: `${data.category.name} - ${data.city.name}` }} />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-text-main mb-4">{data.category.name} v meste {data.city.name}</Text>
        
        {data.companies.length === 0 ? (
            <Text className="text-text-muted mt-4 text-center">V tejto kategórii zatiaľ nie sú žiadne podniky.</Text>
        ) : (
            data.companies.map((comp) => (
                <Link key={comp.id} href={`/company/${comp.slug}`} asChild>
                    <TouchableOpacity className="bg-white rounded-2xl mb-6 shadow-sm border border-gray-100 overflow-hidden">
                        {/* Image */}
                        <View>
                            <Image 
                                source={{ uri: comp.photos?.[0]?.url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' }} 
                                className="w-full h-48 bg-gray-200"
                            />
                            <View className="absolute top-4 right-4 bg-white px-2 py-1 rounded-lg flex-row items-center shadow-sm">
                                <FontAwesome name="star" size={12} color="#d4a373" style={{marginRight: 4}} />
                                <Text className="text-xs font-bold text-primary">{Number(comp.rating || 0).toFixed(1)}</Text>
                            </View>
                        </View>

                        <View className="p-4">
                            <View className="mb-3">
                                <Text className="text-lg font-bold text-text-main mb-1">{comp.name}</Text>
                                <Text className="text-text-muted text-sm" numberOfLines={1}>{comp.address_text || comp.city?.name}</Text>
                            </View>

                            {/* Services Preview */}
                            <View className="border-t border-gray-100 pt-3">
                                {comp.services?.slice(0, 3).map((service: any) => (
                                    <View key={service.id} className="flex-row justify-between items-center mb-2 last:mb-0">
                                        <View className="flex-1 mr-4">
                                            <Text className="text-text-main font-medium text-sm" numberOfLines={1}>{service.name}</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            {service.price && <Text className="text-text-main font-bold text-sm mr-3">{service.price}€</Text>}
                                            {service.duration_minutes && <Text className="text-text-muted text-xs">{service.duration_minutes}min</Text>}
                                        </View>
                                    </View>
                                ))}
                                {(!comp.services || comp.services.length === 0) && (
                                    <Text className="text-text-muted text-xs italic">Služby nie sú k dispozícii</Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                </Link>
            ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
