import { ScrollView, Modal, View, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, router } from 'expo-router';
import { Search, Calendar, ChevronDown, Bell, Star, X, Clock } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, getDay } from 'date-fns';
import { sk } from 'date-fns/locale';

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

  // Search State
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Date State
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  
  // Calendar View State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
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
        .select(`
          id, 
          name, 
          slug, 
          categories (slug),
          cities (slug),
          photos (url)
        `)
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
          photoUrl: c.photos?.[0]?.url
        })) || []),
        ...(cats?.map((c: any) => ({ ...c, type: 'category' as const })) || [])
      ];
      
      setSearchResults(combined);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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

  const handleSelectResult = (item: any) => {
    setQuery('');
    setShowResults(false);
    
    // Construct Query Params
    const params: any = {};
    if (dateRange.from) params.date = format(dateRange.from, 'yyyy-MM-dd');
    if (timeFrom) params.timeFrom = timeFrom;
    if (timeTo) params.timeTo = timeTo;

    if (item.type === 'company') {
        const citySlug = item.citySlug || selectedCity?.slug || 'bratislava';
        const categorySlug = item.categorySlug || 'unknown';
        router.push({
            pathname: `/company/${item.slug}`,
            params
        });
    } else {
        // Category
        const citySlug = selectedCity?.slug || 'bratislava';
        router.push({
            pathname: `/${citySlug}/${item.slug}`,
            params
        });
    }
  };

  const handleDateSelect = (day: Date) => {
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
        setDateRange({ from: day, to: undefined });
    } else {
        // Range logic
        if (day < dateRange.from) {
            setDateRange({ from: day, to: dateRange.from });
        } else {
            setDateRange({ ...dateRange, to: day });
        }
    }
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
            return `${format(dateRange.from, 'd.MM', {locale: sk})} - ${format(dateRange.to, 'd.MM', {locale: sk})}`;
        }
        return format(dateRange.from, 'd. MMMM', { locale: sk });
    }
    return 'Kedykoľvek';
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                        <Pressable onPress={() => {
                            setQuery('');
                            setSearchResults([]);
                        }}>
                             <Icon as={X} size="sm" className="text-gray-400" />
                        </Pressable>
                    )}
                </Input>
            </Box>
            
            <Pressable className="flex-row items-center" onPress={() => setShowDateModal(true)}>
                 <Icon as={Calendar} size="sm" className="text-gray-400 mr-3" />
                 <Text className="text-base text-text-muted flex-1">{getDateDisplay()}</Text>
                 {dateRange.from && (
                    <Pressable onPress={(e) => {
                        e.stopPropagation();
                        setDateRange({});
                        setTimeFrom('');
                        setTimeTo('');
                    }} className="bg-gray-100 rounded-full p-1 ml-2">
                         <Icon as={X} size="xs" className="text-gray-500" />
                    </Pressable>
                 )}
            </Pressable>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
                <View className="absolute top-[100%] left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden mt-2">
                    {searchResults.some(r => r.type === 'company') && (
                        <Box>
                             <Text className="px-4 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50">Salóny</Text>
                             {searchResults.filter(r => r.type === 'company').map((item) => (
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
                    {searchResults.some(r => r.type === 'category') && (
                         <Box>
                             <Text className="px-4 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50">Kategórie</Text>
                             {searchResults.filter(r => r.type === 'category').map((item) => (
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
                            {weekDays.map(d => (
                                <Text key={d} className="w-[13%] text-center text-xs font-bold text-gray-400">{d}</Text>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View className="flex-row flex-wrap mb-6">
                            {/* Empty start days */}
                            {Array.from({ length: (getDay(startOfMonth(currentMonth)) + 6) % 7 }).map((_, i) => (
                                <View key={`empty-${i}`} className="w-[14.2%]" />
                            ))}
                            
                            {days.map((day) => {
                                const isSelected = (dateRange.from && isSameDay(day, dateRange.from)) || (dateRange.to && isSameDay(day, dateRange.to));
                                const isInRange = dateRange.from && dateRange.to && day > dateRange.from && day < dateRange.to;
                                
                                return (
                                    <Pressable 
                                        key={day.toString()} 
                                        className={`w-[14.2%] aspect-square items-center justify-center rounded-full mb-1
                                            ${isSelected ? 'bg-primary' : isInRange ? 'bg-primary/20' : ''}
                                        `}
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
