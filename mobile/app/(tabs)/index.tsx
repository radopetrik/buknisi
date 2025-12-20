import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { Search, Calendar, ChevronDown, Bell, Star } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';

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
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Header / City Selector */}
        <Box className="flex-row justify-between items-center mb-6">
            <Box>
                <Text className="text-text-muted text-xs uppercase font-bold tracking-widest">Lokalita</Text>
                <Link href="/cities" asChild>
                    <Pressable className="flex-row items-center mt-1">
                        <Heading className="text-xl font-bold text-text-main mr-2">{selectedCity?.name || 'Vybrať mesto'}</Heading>
                        <Icon as={ChevronDown} size="sm" className="text-primary" />
                    </Pressable>
                </Link>
            </Box>
            <Box className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                 <Icon as={Bell} size="sm" className="text-text-main" />
            </Box>
        </Box>

        {/* Search Box */}
        <Box className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 p-4">
            <Box className="border-b border-gray-100 pb-3 mb-3">
                <Input variant="outline" size="md" className="border-0 focus:border-0 h-auto p-0">
                    <InputSlot className="mr-3">
                        <InputIcon as={Search} className="text-gray-400" />
                    </InputSlot>
                    <InputField 
                        placeholder="Čo hľadáte? (napr. Barber)" 
                        className="text-base text-text-main p-0"
                        placeholderTextColor="#999"
                    />
                </Input>
            </Box>
            <Box className="flex-row items-center">
                 <Icon as={Calendar} size="sm" className="text-gray-400 mr-3" />
                 <Text className="text-base text-text-muted flex-1">Kedykoľvek</Text>
            </Box>
        </Box>

        {/* Categories */}
        <Box className="mb-8">
            <Heading className="text-lg font-bold text-text-main mb-4">Kategórie</Heading>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mx-[-16px]"
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
            >
                {categories.map((cat) => (
                    <Pressable 
                        key={cat.id} 
                        onPress={() => router.push(`/${selectedCity?.slug || 'bratislava'}/${cat.slug}`)}
                        className="mr-3 bg-white px-4 py-3 rounded-full border border-gray-100 shadow-sm"
                    >
                        <Text className="font-semibold text-text-main">{cat.name}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </Box>

        {/* Recommended */}
        <Box className="mb-8 pb-10">
             <Box className="flex-row justify-between items-center mb-4">
                <Heading className="text-lg font-bold text-text-main">Odporúčané</Heading>
             </Box>
             
             {companies.map((comp) => (
                 <Link key={comp.id} href={`/company/${comp.slug}`} asChild>
                    <Pressable className="bg-white rounded-2xl mb-5 shadow-sm border border-gray-100 overflow-hidden">
                        <Image 
                            source={{ uri: comp.photos?.[0]?.url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' }} 
                            alt={comp.name}
                            className="w-full h-44 bg-gray-200"
                            resizeMode="cover"
                        />
                        <Box className="p-4">
                            <Box className="flex-row justify-between items-start mb-1">
                                <Heading className="text-lg font-bold text-text-main flex-1 mr-2">{comp.name}</Heading>
                                <Box className="flex-row items-center bg-accent-pink px-2 py-1 rounded-lg">
                                    <Icon as={Star} size="xs" className="text-primary mr-1" />
                                    <Text className="text-xs font-bold text-primary">{Number(comp.rating || 0).toFixed(1)}</Text>
                                </Box>
                            </Box>
                            <Text className="text-text-muted text-sm mb-2">{comp.city?.name} • {comp.category?.name}</Text>
                        </Box>
                    </Pressable>
                 </Link>
             ))}
             {companies.length === 0 && (
                <Text className="text-text-muted text-center py-4">Načítavam podniky...</Text>
             )}
        </Box>

      </ScrollView>
    </SafeAreaView>
  );
}
