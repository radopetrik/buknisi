import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { Stack, useLocalSearchParams, Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { HeaderBackButton } from '@react-navigation/elements';
import { getUserOrNull, supabase } from '@/lib/supabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SearchInputTrigger } from '@/components/search/SearchInputTrigger';

export default function CategoryListingScreen() {
  const {
    city: citySlug,
    category: categorySlug,
    sub_category: subCategorySlug,
  } = useLocalSearchParams();

  const [selectedCitySlug, setSelectedCitySlug] = useState<string | null>(
    typeof citySlug === 'string' ? citySlug : null
  );
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(
    typeof categorySlug === 'string' ? categorySlug : null
  );
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string | null>(
    typeof subCategorySlug === 'string' ? subCategorySlug : null
  );

  useEffect(() => {
    setSelectedCitySlug(typeof citySlug === 'string' ? citySlug : null);
    setSelectedCategorySlug(typeof categorySlug === 'string' ? categorySlug : null);
    setSelectedSubCategorySlug(typeof subCategorySlug === 'string' ? subCategorySlug : null);
  }, [citySlug, categorySlug, subCategorySlug]);

  const goBackOrHome = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.navigate('/(tabs)');
  }, []);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (router.canGoBack()) {
          return false;
        }

        router.navigate('/(tabs)');
        return true;
      });

      return () => subscription.remove();
    }, []),
  );

  const [data, setData] = useState<{
    city: any;
    category: any;
    subCategory: any | null;
    subCategories: any[];
    companies: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [savingCity, setSavingCity] = useState(false);
  const [ratingSortDirection, setRatingSortDirection] = useState<'desc' | 'asc' | null>(null);

  useEffect(() => {
    if (selectedCitySlug && selectedCategorySlug) {
      fetchData(selectedCitySlug, selectedCategorySlug, selectedSubCategorySlug);
    }
  }, [selectedCitySlug, selectedCategorySlug, selectedSubCategorySlug]);

  async function fetchData(
    citySlugValue: string,
    categorySlugValue: string,
    subCategorySlugValue: string | null
  ) {
    setLoading(true);

    try {
      const [{ data: city }, { data: category }, { data: citiesData }, { data: catsData }] =
        await Promise.all([
          supabase.from('cities').select('*').eq('slug', citySlugValue).single(),
          supabase.from('categories').select('*').eq('slug', categorySlugValue).single(),
          supabase.from('cities').select('*').order('name'),
          supabase.from('categories').select('*').order('ordering'),
        ]);

      setCities(citiesData || []);
      setCategories(catsData || []);

      if (!city || !category) {
        setData(null);
        return;
      }

      const { data: subCategoriesData } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('category_id', category.id)
        .order('ordering');

      let selectedSubCategory: any | null = null;
      if (typeof subCategorySlugValue === 'string' && subCategorySlugValue.length > 0) {
        const { data: maybeSubCategory } = await supabase
          .from('sub_categories')
          .select('*')
          .eq('slug', subCategorySlugValue)
          .single();

        if (maybeSubCategory && maybeSubCategory.category_id === category.id) {
          selectedSubCategory = maybeSubCategory;
        } else {
          setSelectedSubCategorySlug(null);
        }
      }

      const companiesSelect = selectedSubCategory
        ? '*, photos(url), services!inner(*)'
        : '*, photos(url), services(*)';

      let companiesQuery = supabase
        .from('companies')
        .select(companiesSelect)
        .eq('city_id', city.id)
        .eq('category_id', category.id);

      if (selectedSubCategory) {
        companiesQuery = companiesQuery.eq('services.sub_category_id', selectedSubCategory.id);
      }

      const { data: companies } = await companiesQuery;

      setData({
        city,
        category,
        subCategory: selectedSubCategory,
        subCategories: subCategoriesData || [],
        companies: companies || [],
      });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Chyba', e?.message || 'Nepodarilo sa načítať údaje.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCity(city: any) {
    if (!data?.category) return;

    setSavingCity(true);

    try {
      const user = await getUserOrNull();

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_city_id: city.id })
          .eq('id', user.id);

        if (error) {
          Alert.alert('Chyba', error.message);
        }
      }

      setSelectedCitySlug(city.slug);
      setCityModalOpen(false);
    } finally {
      setSavingCity(false);
    }
  }

  function handleSelectCategory(category: any) {
    if (!data?.city) return;

    setSelectedCategorySlug(category.slug);
    setSelectedSubCategorySlug(null);
    setCategoryModalOpen(false);
  }

  function handleToggleRatingSort() {
    setRatingSortDirection((prev) => {
      if (prev === 'desc') return 'asc';
      if (prev === 'asc') return null;
      return 'desc';
    });
  }

  const headerTitle = data?.category?.name ?? 'Kategórie';
  const activeSubCategorySlug = selectedSubCategorySlug ?? data?.subCategory?.slug;
  const ratingSortIcon =
    ratingSortDirection === 'asc'
      ? 'sort-amount-asc'
      : ratingSortDirection === 'desc'
        ? 'sort-amount-desc'
        : 'sort';
  const ratingSortColor = ratingSortDirection ? '#d4a373' : '#9ca3af';
  const companiesToRender = (() => {
    if (!data?.companies) return [];
    if (!ratingSortDirection) return data.companies;

    return [...data.companies].sort((first, second) => {
      const firstRating = Number(first.rating || 0);
      const secondRating = Number(second.rating || 0);
      return ratingSortDirection === 'asc'
        ? firstRating - secondRating
        : secondRating - firstRating;
    });
  })();

  const content = (() => {
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
      <View className="flex-1">
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Search Trigger */}
          <View className="mb-6">
            <SearchInputTrigger placeholder="Čo hľadáte?" />
          </View>

        {/* Sub-categories */}
        <View className="mb-5">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mx-[-16px]"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedSubCategorySlug(null)}
              className={`mr-3 px-4 py-3 rounded-full border shadow-sm ${
                !activeSubCategorySlug
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-100'
              }`}
            >
              <Text
                className={`font-semibold ${
                  !activeSubCategorySlug ? 'text-white' : 'text-text-main'
                }`}
              >
                Všetky
              </Text>
            </TouchableOpacity>

            {data.subCategories.map((subCat) => {
              const selected = activeSubCategorySlug === subCat.slug;

              return (
                <TouchableOpacity
                  key={subCat.id}
                  onPress={() => setSelectedSubCategorySlug(subCat.slug)}
                  className={`mr-3 px-4 py-3 rounded-full border shadow-sm ${
                    selected ? 'bg-primary border-primary' : 'bg-white border-gray-100'
                  }`}
                >
                  <Text
                    className={`font-semibold ${selected ? 'text-white' : 'text-text-main'}`}
                  >
                    {subCat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Title */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row flex-wrap items-baseline flex-1 pr-3">
            {data.subCategory ? (
              <Text className="text-xl font-bold text-text-main">
                {data.subCategory.name} v meste
              </Text>
            ) : (
              <Text className="text-xl font-bold text-text-main">Mesto</Text>
            )}

            <TouchableOpacity
              onPress={() => setCityModalOpen(true)}
              className="flex-row items-center ml-2"
              disabled={savingCity}
            >
              <Text className="text-xl font-bold text-primary underline mr-2">
                {savingCity ? 'Ukladám...' : data.city.name}
              </Text>
              <FontAwesome name="chevron-down" size={14} color="#d4a373" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleToggleRatingSort}
            className="flex-row items-center bg-white border border-gray-100 rounded-full px-3 py-2 shadow-sm"
          >
            <FontAwesome name="star" size={14} color={ratingSortColor} />
            <FontAwesome name={ratingSortIcon} size={14} color={ratingSortColor} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {companiesToRender.length === 0 ? (
          <Text className="text-text-muted mt-4 text-center">
            V tejto kategórii zatiaľ nie sú žiadne podniky.
          </Text>
        ) : (
          companiesToRender.map((comp) => (
            <Link key={comp.id} href={`/company/${comp.slug}`} asChild>
              <TouchableOpacity className="bg-white rounded-2xl mb-6 shadow-sm border border-gray-100 overflow-hidden">
                {/* Image */}
                <View>
                  <Image
                    source={{
                      uri:
                        comp.photos?.[0]?.url ||
                        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
                    }}
                    className="w-full h-48 bg-gray-200"
                  />
                  <View className="absolute top-4 right-4 bg-white px-2 py-1 rounded-lg flex-row items-center shadow-sm">
                    <FontAwesome name="star" size={12} color="#d4a373" style={{ marginRight: 4 }} />
                    <Text className="text-xs font-bold text-primary">
                      {Number(comp.rating || 0).toFixed(1)}
                    </Text>
                  </View>
                </View>

                <View className="p-4">
                  <View className="mb-3">
                    <Text className="text-lg font-bold text-text-main mb-1">{comp.name}</Text>
                    <Text className="text-text-muted text-sm" numberOfLines={1}>
                      {comp.address_text || comp.city?.name}
                    </Text>
                  </View>

                  {/* Services Preview */}
                  <View className="border-t border-gray-100 pt-3">
                    {comp.services?.slice(0, 3).map((service: any) => (
                      <View
                        key={service.id}
                        className="flex-row justify-between items-center mb-2 last:mb-0"
                      >
                        <View className="flex-1 mr-4">
                          <Text className="text-text-main font-medium text-sm" numberOfLines={1}>
                            {service.name}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          {service.price !== null && service.price !== undefined && (
                            <Text className="text-text-main font-bold text-sm mr-3">
                              {service.price}€
                            </Text>
                          )}
                          {service.duration_minutes !== null && service.duration_minutes !== undefined && (
                            <Text className="text-text-muted text-xs">{service.duration_minutes}min</Text>
                          )}
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

        {/* Category Picker Modal */}
        <Modal
          visible={categoryModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setCategoryModalOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-text-main">Vyberte kategóriu</Text>
                <TouchableOpacity onPress={() => setCategoryModalOpen(false)}>
                  <FontAwesome name="times" size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                    onPress={() => handleSelectCategory(cat)}
                  >
                    <Text className="text-base font-semibold text-text-main">{cat.name}</Text>
                    {data.category?.id === cat.id ? (
                      <Text className="text-primary font-bold">✓</Text>
                    ) : (
                      <View className="w-4" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setCategoryModalOpen(false)}
                className="bg-gray-100 rounded-xl py-4 items-center mt-5"
              >
                <Text className="font-bold text-text-main">Zavrieť</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
                <Text className="text-xl font-bold text-text-main">Vyberte mesto</Text>
                <TouchableOpacity onPress={() => setCityModalOpen(false)} disabled={savingCity}>
                  <FontAwesome name="times" size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                    onPress={() => handleSelectCity(city)}
                    disabled={savingCity}
                  >
                    <Text className="text-base font-semibold text-text-main">{city.name}</Text>
                    {data.city?.id === city.id ? (
                      <Text className="text-primary font-bold">✓</Text>
                    ) : (
                      <View className="w-4" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setCityModalOpen(false)}
                className="bg-gray-100 rounded-xl py-4 items-center mt-5"
                disabled={savingCity}
              >
                <Text className="font-bold text-text-main">Zavrieť</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  })();

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerTintColor: '#d4a373',
          headerBackTitle: 'Späť',
          headerLeft: () => (
            <HeaderBackButton label="Späť" onPress={goBackOrHome} tintColor="#d4a373" />
          ),
          headerTitle: () =>
            data?.category ? (
              <TouchableOpacity
                onPress={() => setCategoryModalOpen(true)}
                className="flex-row items-center"
              >
                <Text className="text-base font-bold text-primary underline mr-2">
                  {headerTitle}
                </Text>
                <FontAwesome name="chevron-down" size={14} color="#d4a373" />
              </TouchableOpacity>
            ) : (
              <Text className="text-base font-bold text-text-main">{headerTitle}</Text>
            ),
        }}
      />
      {content}
    </View>
  );
}
