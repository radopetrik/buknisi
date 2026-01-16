import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { Star } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export default function ExploreScreen() {
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
      let def = citiesData.find((c: any) => c.slug === 'bratislava') || citiesData[0];

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_city_id')
          .eq('id', user.id)
          .single();

        const preferredCityId = profile?.preferred_city_id;
        if (preferredCityId) {
          def = citiesData.find((c: any) => c.id === preferredCityId) || def;
        }
      }

      setSelectedCity(def);
    }
    if (catsData) setCategories(catsData);
    if (compsData) setCompanies(compsData);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>

        {/* Search Trigger */}
        <Box className="mb-8">
          <SearchInputTrigger placeholder="Čo hľadáte?" />
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
                  source={{
                    uri:
                      comp.photos?.[0]?.url ||
                      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
                  }}
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
                  <Text className="text-text-muted text-sm mb-2">
                    {comp.city?.name} • {comp.category?.name}
                  </Text>
                </Box>
              </Pressable>
            </Link>
          ))}

          {companies.length === 0 && <Text className="text-text-muted text-center py-4">Načítavam podniky...</Text>}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
