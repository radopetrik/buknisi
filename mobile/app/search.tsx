import { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack, router } from 'expo-router';
import { Calendar, ChevronDown, Clock, Search, X } from 'lucide-react-native';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameDay, startOfMonth } from 'date-fns';
import { sk } from 'date-fns/locale';

import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';

export default function SearchScreen() {
  const [selectedCity, setSelectedCity] = useState<any>(null);

  // Search State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Date State
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  // Calendar View State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchCities();
  }, []);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      const { data: comps } = await supabase
        .from('companies')
        .select(
          `
            id,
            name,
            slug,
            categories (slug),
            cities (slug),
            photos (url)
          `,
        )
        .ilike('name', `%${query}%`)
        .limit(3);

      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug')
        .ilike('name', `%${query}%`)
        .limit(3);

      const combined = [
        ...(comps?.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: 'company' as const,
          categorySlug: c.categories?.slug,
          citySlug: c.cities?.slug,
          photoUrl: c.photos?.[0]?.url,
        })) || []),
        ...(cats?.map((c: any) => ({ ...c, type: 'category' as const })) || []),
      ];

      setSearchResults(combined);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function fetchCities() {
    const { data: citiesData } = await supabase.from('cities').select('*');

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
  }

  const handleSelectResult = (item: any) => {
    setQuery('');
    setShowResults(false);

    // Construct Query Params
    const params: any = {};
    if (dateRange.from) params.date = format(dateRange.from, 'yyyy-MM-dd');
    if (timeFrom) params.timeFrom = timeFrom;
    if (timeTo) params.timeTo = timeTo;

    if (item.type === 'company') {
      router.push({
        pathname: '/company/[slug]',
        params: { slug: item.slug, ...params },
      });
      return;
    }

    const citySlug = selectedCity?.slug || 'bratislava';
    router.push({
      pathname: '/[city]/[category]',
      params: { city: citySlug, category: item.slug, ...params },
    });
  };

  const handleDateSelect = (day: Date) => {
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      setDateRange({ from: day, to: undefined });
      return;
    }

    if (dateRange.from && day < dateRange.from) {
      setDateRange({ from: day, to: dateRange.from });
      return;
    }

    setDateRange({ ...dateRange, to: day });
  };

  const generateDays = useCallback(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const days = generateDays();
  const weekDays = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

  const getDateDisplay = () => {
    if (dateRange.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, 'd.MM', { locale: sk })} - ${format(dateRange.to, 'd.MM', { locale: sk })}`;
      }
      return format(dateRange.from, 'd. MMMM', { locale: sk });
    }
    return 'Kedykoľvek';
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <Stack.Screen options={{ title: 'Search', headerBackTitle: 'Späť' }} />
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Lokalita */}
        <Box className="mb-6">
          <Text className="text-text-muted text-xs uppercase font-bold tracking-widest">Lokalita</Text>
          <Link href="/cities" asChild>
            <Pressable className="flex-row items-center mt-1">
              <Heading className="text-xl font-bold text-text-main mr-2">
                {selectedCity?.name || 'Vybrať mesto'}
              </Heading>
              <Icon as={ChevronDown} size="sm" className="text-primary" />
            </Pressable>
          </Link>
        </Box>

        {/* Search Card: čo hľadáte + kedy */}
        <Box className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 p-4 z-10">
          <Box className="border-b border-gray-100 pb-3 mb-3">
            <Input variant="outline" size="md" className="border-0 focus:border-0 h-auto p-0">
              <InputSlot className="mr-3">
                <InputIcon as={Search} className="text-gray-400" />
              </InputSlot>
              <InputField
                placeholder="Čo hľadáte? (napr. Barber)"
                className="text-base text-text-main p-0"
                placeholderTextColor="#999"
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => {
                    setQuery('');
                    setSearchResults([]);
                  }}
                >
                  <Icon as={X} size="sm" className="text-gray-400" />
                </Pressable>
              )}
            </Input>
          </Box>

          <Pressable className="flex-row items-center" onPress={() => setShowDateModal(true)}>
            <Icon as={Calendar} size="sm" className="text-gray-400 mr-3" />
            <Text className="text-base text-text-muted flex-1">{getDateDisplay()}</Text>
            {dateRange.from && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setDateRange({});
                  setTimeFrom('');
                  setTimeTo('');
                }}
                className="bg-gray-100 rounded-full p-1 ml-2"
              >
                <Icon as={X} size="xs" className="text-gray-500" />
              </Pressable>
            )}
          </Pressable>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <View className="absolute top-[100%] left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden mt-2">
              {searchResults.some((r) => r.type === 'company') && (
                <Box>
                  <Text className="px-4 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50">Salóny</Text>
                  {searchResults
                    .filter((r) => r.type === 'company')
                    .map((item) => (
                      <Pressable
                        key={item.id}
                        className="px-4 py-3 flex-row items-center border-b border-gray-50 active:bg-gray-50"
                        onPress={() => handleSelectResult(item)}
                      >
                        {item.photoUrl && (
                          <Image
                            source={{ uri: item.photoUrl }}
                            className="w-8 h-8 rounded mr-3 bg-gray-200"
                            alt={item.name}
                          />
                        )}
                        <Text className="text-sm font-medium text-text-main">{item.name}</Text>
                      </Pressable>
                    ))}
                </Box>
              )}

              {searchResults.some((r) => r.type === 'category') && (
                <Box>
                  <Text className="px-4 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50">Kategórie</Text>
                  {searchResults
                    .filter((r) => r.type === 'category')
                    .map((item) => (
                      <Pressable
                        key={item.id}
                        className="px-4 py-3 border-b border-gray-50 active:bg-gray-50"
                        onPress={() => handleSelectResult(item)}
                      >
                        <Text className="text-sm font-medium text-text-main">{item.name}</Text>
                      </Pressable>
                    ))}
                </Box>
              )}
            </View>
          )}
        </Box>
      </ScrollView>

      {/* Date Filter Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Heading className="text-xl font-bold">Kedy?</Heading>
              <Pressable onPress={() => setShowDateModal(false)}>
                <Icon as={X} size="md" className="text-text-main" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-4">
                <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2">
                  <Text className="font-bold text-lg text-primary">{'<'}</Text>
                </Pressable>
                <Text className="text-lg font-bold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: sk })}
                </Text>
                <Pressable onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2">
                  <Text className="font-bold text-lg text-primary">{'>'}</Text>
                </Pressable>
              </View>

              {/* Week Days */}
              <View className="flex-row justify-between mb-2 border-b border-gray-100 pb-2">
                {weekDays.map((d) => (
                  <Text key={d} className="w-[13%] text-center text-xs font-bold text-gray-400">
                    {d}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View className="flex-row flex-wrap mb-6">
                {/* Empty start days */}
                {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, i) => (
                  <View key={`empty-${i}`} className="w-[14.2%]" />
                ))}

                {days.map((day) => {
                  const isSelected =
                    (dateRange.from && isSameDay(day, dateRange.from)) ||
                    (dateRange.to && isSameDay(day, dateRange.to));
                  const isInRange =
                    dateRange.from && dateRange.to && day > dateRange.from && day < dateRange.to;

                  return (
                    <Pressable
                      key={day.toString()}
                      className={`w-[14.2%] aspect-square items-center justify-center rounded-full mb-1 ${isSelected ? 'bg-primary' : isInRange ? 'bg-primary/20' : ''}`}
                      onPress={() => handleDateSelect(day)}
                    >
                      <Text className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-text-main'}`}>
                        {format(day, 'd')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Time Inputs */}
              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <Text className="text-xs text-text-muted font-bold mb-2 uppercase">Čas od</Text>
                  <View className="flex-row items-center border border-gray-200 rounded-xl px-3 py-3 bg-gray-50">
                    <Icon as={Clock} size="sm" className="text-gray-400 mr-2" />
                    <TextInput
                      placeholder="09:00"
                      value={timeFrom}
                      onChangeText={setTimeFrom}
                      className="flex-1 text-base text-text-main"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-text-muted font-bold mb-2 uppercase">Čas do</Text>
                  <View className="flex-row items-center border border-gray-200 rounded-xl px-3 py-3 bg-gray-50">
                    <Icon as={Clock} size="sm" className="text-gray-400 mr-2" />
                    <TextInput
                      placeholder="17:00"
                      value={timeTo}
                      onChangeText={setTimeTo}
                      className="flex-1 text-base text-text-main"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              <Pressable
                className="bg-primary py-4 rounded-xl items-center shadow-md mb-8"
                onPress={() => setShowDateModal(false)}
              >
                <Text className="text-white font-bold text-lg">Potvrdiť výber</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
