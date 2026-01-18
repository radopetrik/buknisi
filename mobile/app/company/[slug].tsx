import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { format } from 'date-fns';
import { getAvailableSlots } from '@/lib/booking';

export default function CompanyDetailScreen() {
  const { slug } = useLocalSearchParams();
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaySlots, setTodaySlots] = useState<string[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Map<string, any>>(new Map());
  const router = useRouter();

  useEffect(() => {
    if (slug) fetchCompany();
  }, [slug]);

  async function fetchCompany() {
    try {
        const { data, error } = await supabase
        .from('companies')
        .select('*, city:cities(name), category:categories(name), photos(url), services(*), company_business_hours(*)')
        .eq('slug', slug)
        .single();

        if (error) throw error;
        setCompany(data);

        // Fetch services - now included in the main query, but keeping variable for compatibility with rest of code
        if (data.services) {
            setServices(data.services);
            
             // Calculate today slots
            const minDuration = data.services.length > 0 
                ? Math.min(...data.services.map((s: any) => s.duration)) 
                : 30;
            const today = format(new Date(), 'yyyy-MM-dd');
            const slots = await getAvailableSlots(data.id, today, minDuration);
            setTodaySlots(slots);
        }

        // Fetch ratings
        const { data: ratingsData } = await supabase
            .from('company_ratings')
            .select('*')
            .eq('company_id', data.id)
            .order('created_at', { ascending: false });

        if (ratingsData && ratingsData.length > 0) {
            setRatings(ratingsData);
            const userIds = ratingsData.map((r: any) => r.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', userIds);
            
            if (profiles) {
                const map = new Map();
                profiles.forEach((p: any) => map.set(p.id, p));
                setProfilesMap(map);
            }
        }

    } catch (e) {
        console.log(e);
    } finally {
        setLoading(false);
    }
  }

  const headerTitle = company?.name ?? 'Podnik';

  const content = (() => {
    if (loading) {
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator size="large" color="#d4a373" />
        </View>
      );
    }

    if (!company) {
      return (
        <View className="flex-1 items-center justify-center bg-background">
          <Text>Podnik sa nenašiel</Text>
        </View>
      );
    }

    const averageRating = company.rating
      ? Number(company.rating).toFixed(1)
      : company.review_rank
        ? company.review_rank + '.0'
        : '0.0';
    const reviewCount = ratings.length;
    const heroImage =
      company.photos?.[0]?.url ||
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80';

    // Helper to get day name sk
    const days = {
      monday: 'Pondelok',
      tuesday: 'Utorok',
      wednesday: 'Streda',
      thursday: 'Štvrtok',
      friday: 'Piatok',
      saturday: 'Sobota',
      sunday: 'Nedeľa',
    };
    const sortedHours = company.company_business_hours?.sort((a: any, b: any) => {
      const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return order.indexOf(a.day_in_week) - order.indexOf(b.day_in_week);
    });

    return (
      <ScrollView className="flex-1 bg-background">
        {/* Hero Image */}
        <Image source={{ uri: heroImage }} className="w-full h-64 bg-gray-200" />

        <View className="p-5 -mt-6 bg-background rounded-t-3xl shadow-sm">
          {/* Header Info */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-text-main flex-1 mr-2">{company.name}</Text>
            <View className="flex-row items-center bg-accent-pink px-3 py-1.5 rounded-xl">
              <FontAwesome name="star" size={14} color="#d4a373" style={{ marginRight: 4 }} />
              <Text className="font-bold text-primary">{averageRating}</Text>
              <Text className="text-text-muted text-xs ml-1">({reviewCount})</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <FontAwesome name="map-marker" size={16} color="#999" style={{ marginRight: 6 }} />
            <Text className="text-text-muted text-base">
              {company.address_text}, {company.city?.name}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs text-gray-600">Bezplatné Wi-Fi</Text>
            </View>
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs text-gray-600">Bezplatné parkovanie</Text>
            </View>
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-xs text-gray-600">Platba kartou</Text>
            </View>
          </View>

          {/* Today's Slots */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-text-main mb-3">Dnešné termíny</Text>
            {todaySlots.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {todaySlots.slice(0, 8).map((slot) => (
                  <View key={slot} className="bg-primary px-4 py-2 rounded-xl mr-2">
                    <Text className="text-white font-bold">{slot}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-gray-500">Na dnes už nie sú žiadne voľné termíny.</Text>
            )}
          </View>

          {/* Description */}
          {company.description && (
            <View className="mb-8">
              <Text className="text-xl font-bold text-text-main mb-3">Popis salónu</Text>
              <Text className="text-text-muted leading-6">{company.description}</Text>
            </View>
          )}

          {/* Services */}
          <Text className="text-xl font-bold text-text-main mb-4">Cenník služieb</Text>
          <View className="space-y-4 mb-8">
            {services.map((service) => (
              <View
                key={service.id}
                className="flex-row justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                <View className="flex-1 mr-4">
                  <Text className="font-bold text-text-main text-base mb-1">{service.name}</Text>
                  <Text className="text-text-muted text-sm">{service.duration} min</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-primary text-lg mb-1">{service.price}€</Text>
                  <TouchableOpacity
                    className="bg-primary px-4 py-2 rounded-full mt-2"
                    onPress={() => {
                      router.push({
                        pathname: '/book',
                        params: {
                          companyId: company.id,
                          serviceId: service.id,
                          serviceName: service.name,
                          servicePrice: service.price.toString(),
                          serviceDuration: service.duration.toString(),
                          companyName: company.name,
                        },
                      });
                    }}
                  >
                    <Text className="text-white font-bold text-xs">Rezervovať</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Gallery */}
          {company.photos && company.photos.length > 1 && (
            <View className="mb-8">
              <Text className="text-xl font-bold text-text-main mb-4">Galéria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {company.photos.slice(1).map((photo: any, index: number) => (
                  <Image key={index} source={{ uri: photo.url }} className="w-40 h-40 rounded-xl mr-3 bg-gray-200" />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Reviews */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-text-main mb-4">Hodnotenia zákazníkov</Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-3xl font-bold text-text-main mr-2">{averageRating}</Text>
              <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome
                    key={star}
                    name={star <= Math.round(Number(averageRating)) ? 'star' : 'star-o'}
                    size={16}
                    color="#d4a373"
                  />
                ))}
              </View>
              <Text className="text-text-muted ml-2">({reviewCount} hodnotení)</Text>
            </View>

            {ratings.length > 0 ? (
              ratings.map((rating: any) => {
                const profile = profilesMap.get(rating.user_id);
                const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Anonym';
                return (
                  <View key={rating.id} className="mb-4 border-b border-gray-100 pb-4">
                    <View className="flex-row justify-between mb-1">
                      <Text className="font-bold text-text-main">{name || 'Používateľ'}</Text>
                      <Text className="text-gray-400 text-xs">{format(new Date(rating.created_at), 'd. M. yyyy')}</Text>
                    </View>
                    <View className="flex-row mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome
                          key={star}
                          name={star <= rating.rating ? 'star' : 'star-o'}
                          size={12}
                          color="#ffc107"
                        />
                      ))}
                    </View>
                    {rating.note && <Text className="text-text-muted">{rating.note}</Text>}
                  </View>
                );
              })
            ) : (
              <Text className="text-gray-500">Zatiaľ žiadne hodnotenia.</Text>
            )}
          </View>

          {/* Contact */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-text-main mb-4">Kontakt a poloha</Text>
            {company.address_text && <Text className="text-text-main mb-2">Adresa: {company.address_text}</Text>}
            {company.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${company.phone}`)}>
                <Text className="text-primary mb-2">Telefón: {company.phone}</Text>
              </TouchableOpacity>
            )}
            {company.email && (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${company.email}`)}>
                <Text className="text-primary mb-4">Email: {company.email}</Text>
              </TouchableOpacity>
            )}

            <Text className="font-bold text-text-main mb-2 mt-2">Otváracie hodiny:</Text>
            {sortedHours?.map((hours: any) => (
              <View key={hours.id} className="flex-row justify-between mb-1">
                <Text className="text-text-muted capitalize">
                  {(days as any)[hours.day_in_week] || hours.day_in_week}
                </Text>
                <Text className="text-text-main">
                  {hours.from_time ? `${hours.from_time.slice(0, 5)} - ${hours.to_time.slice(0, 5)}` : 'Zatvorené'}
                </Text>
              </View>
            ))}

            {/* Map Button */}
            <TouchableOpacity
              onPress={() => {
                const query = encodeURIComponent(`${company.address_text}, ${company.city?.name}`);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
              }}
              className="mt-6 bg-gray-100 p-4 rounded-xl flex-row items-center justify-center"
            >
              <FontAwesome name="map-o" size={20} color="#d4a373" style={{ marginRight: 10 }} />
              <Text className="font-bold text-text-main">Otvoriť na mape</Text>
            </TouchableOpacity>
          </View>

          <View className="h-10" />
        </View>
      </ScrollView>
    );
  })();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerBackTitle: 'Späť',
          headerTintColor: '#d4a373',
        }}
      />
      {content}
    </>
  );
}
