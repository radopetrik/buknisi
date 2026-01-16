import { Alert, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { ChevronDown, Star, X } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export default function ExploreScreen() {
  const [cities, setCities] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchCompanies(cityId?: string) {
    const query = supabase
      .from('companies')
      .select('*, city:cities(name), category:categories(name), photos(url)')
      .limit(10);

    const { data: compsData } = cityId ? await query.eq('city_id', cityId) : await query;
    setCompanies(compsData || []);
  }

  async function fetchData() {
    const [{ data: citiesData }, { data: subCatsData }] = await Promise.all([
      supabase.from('cities').select('*').order('name'),
      supabase
        .from('sub_categories')
        .select('*, category:categories(id, name, slug, ordering)')
        .order('ordering', { foreignTable: 'category' })
        .order('ordering'),
    ]);

    if (citiesData && citiesData.length > 0) {
      setCities(citiesData);

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
      await fetchCompanies(def?.id);
    } else {
      await fetchCompanies();
    }

    if (subCatsData) setSubCategories(subCatsData);
  }

  async function handleSelectCity(city: any) {
    setSavingCity(true);

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

      setSelectedCity(city);
      await fetchCompanies(city?.id);
      setCityModalOpen(false);
    } finally {
      setSavingCity(false);
    }
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
          <Heading className="text-lg font-bold text-text-main mb-4">Služby</Heading>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mx-[-16px]"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          >
            {subCategories.map((subCat) => (
              <Pressable
                key={subCat.id}
                onPress={() => {
                  const citySlug = selectedCity?.slug || 'bratislava';
                  const categorySlug = subCat.category?.slug;

                  if (categorySlug) {
                    router.push(`/${citySlug}/${categorySlug}?sub_category=${subCat.slug}`);
                  }
                }}
                className="mr-3 bg-white px-4 py-3 rounded-full border border-gray-100 shadow-sm"
              >
                <Text className="font-semibold text-text-main">{subCat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Box>

        {/* Recommended */}
        <Box className="mb-8 pb-10">
          <Box className="flex-row flex-wrap items-baseline mb-4">
            <Heading className="text-lg font-bold text-text-main">Odporúčané v meste</Heading>
            <Pressable
              onPress={() => setCityModalOpen(true)}
              className="flex-row items-center ml-2"
              disabled={savingCity}
            >
              <Text className="text-lg font-bold text-primary underline mr-1">
                {savingCity ? 'Ukladám...' : selectedCity?.name || 'Vybrať'}
              </Text>
              <Icon as={ChevronDown} size="sm" className="text-primary" />
            </Pressable>
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

        {/* City Picker Modal */}
        <Modal
          visible={cityModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setCityModalOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
              <View className="flex-row justify-between items-center mb-6">
                <Heading className="text-xl font-bold">Vyberte mesto</Heading>
                <Pressable onPress={() => setCityModalOpen(false)} disabled={savingCity}>
                  <Icon as={X} size="md" className="text-text-main" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {cities.map((city) => (
                  <Pressable
                    key={city.id}
                    className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                    onPress={() => handleSelectCity(city)}
                    disabled={savingCity}
                  >
                    <Text className="text-base font-semibold text-text-main">{city.name}</Text>
                    {selectedCity?.id === city.id ? (
                      <Text className="text-primary font-bold">✓</Text>
                    ) : (
                      <View className="w-4" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                onPress={() => setCityModalOpen(false)}
                className="bg-gray-100 rounded-xl py-4 items-center mt-5"
                disabled={savingCity}
              >
                <Text className="font-bold text-text-main">Zavrieť</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

