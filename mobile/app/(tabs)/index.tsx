import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function HomeScreen() {
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: citiesData } = await supabase.from('cities').select('*');
    const { data: catsData } = await supabase.from('categories').select('*').order('ordering');
    // Using simple select for now, join syntax depends on Supabase JS client version but this is standard
    const { data: compsData } = await supabase
        .from('companies')
        .select('*, city:cities(name), category:categories(name), photos(url)')
        .limit(10);

    if (citiesData && citiesData.length > 0) {
        setCities(citiesData);
        // Default to Bratislava or first
        const def = citiesData.find((c: any) => c.slug === 'bratislava') || citiesData[0];
        setSelectedCity(def);
    }
    if (catsData) setCategories(catsData);
    if (compsData) setCompanies(compsData);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Header / City Selector */}
        <View className="flex-row justify-between items-center mb-6">
            <View>
                <Text className="text-text-muted text-xs uppercase font-bold tracking-widest">Lokalita</Text>
                <TouchableOpacity className="flex-row items-center mt-1">
                    <Text className="text-xl font-bold text-text-main mr-2">{selectedCity?.name || 'Vybrať mesto'}</Text>
                    <FontAwesome name="chevron-down" size={12} color="#d4a373" />
                </TouchableOpacity>
            </View>
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                 <FontAwesome name="bell-o" size={18} color="#333" />
            </View>
        </View>

        {/* Hero Text */}
        <Text className="text-3xl font-bold text-text-main mb-6">Buď sebavedomá</Text>

        {/* Search Box */}
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <View className="flex-row items-center border-b border-gray-100 pb-3 mb-3">
                <FontAwesome name="search" size={16} color="#999" style={{marginRight: 10}} />
                <TextInput 
                    placeholder="Čo hľadáte? (napr. Barber)" 
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
            <Text className="text-lg font-bold text-text-main mb-4">Kategórie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((cat) => (
                    <TouchableOpacity key={cat.id} className="mr-3 bg-white px-4 py-3 rounded-full border border-gray-100 shadow-sm">
                        <Text className="font-semibold text-text-main">{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Recommended */}
        <View className="mb-8 pb-10">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-text-main">Odporúčané</Text>
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
             {companies.length === 0 && (
                <Text className="text-text-muted text-center py-4">Načítavam podniky...</Text>
             )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
