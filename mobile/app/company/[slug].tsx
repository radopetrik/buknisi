import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CompanyDetailScreen() {
  const { slug } = useLocalSearchParams();
  const [company, setCompany] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (slug) fetchCompany();
  }, [slug]);

  async function fetchCompany() {
    try {
        const { data, error } = await supabase
        .from('companies')
        .select('*, city:cities(name), category:categories(name), photos(url)')
        .eq('slug', slug)
        .single();

        if (error) throw error;
        setCompany(data);

        // Fetch services
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('company_id', data.id);
            
        if (servicesData) setServices(servicesData);

    } catch (e) {
        console.log(e);
    } finally {
        setLoading(false);
    }
  }

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
      )
  }

  return (
    <>
    <Stack.Screen options={{ 
        headerShown: true, 
        title: company.name,
        headerBackTitle: 'Späť',
        headerTintColor: '#d4a373'
    }} />
    <ScrollView className="flex-1 bg-background">
      <Image 
        source={{ uri: company.photos?.[0]?.url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' }} 
        className="w-full h-64 bg-gray-200"
      />
      
      <View className="p-5 -mt-6 bg-background rounded-t-3xl shadow-sm">
        <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-text-main flex-1 mr-2">{company.name}</Text>
            <View className="flex-row items-center bg-accent-pink px-3 py-1.5 rounded-xl">
                <FontAwesome name="star" size={14} color="#d4a373" style={{marginRight: 4}} />
                <Text className="font-bold text-primary">{Number(company.rating || 0).toFixed(1)}</Text>
            </View>
        </View>
        
        <View className="flex-row items-center mb-6">
            <FontAwesome name="map-marker" size={16} color="#999" style={{marginRight: 6}} />
            <Text className="text-text-muted text-base">{company.address_text}, {company.city?.name}</Text>
        </View>

        <Text className="text-xl font-bold text-text-main mb-4">Služby</Text>
        
        <View className="space-y-4">
            {services.map((service) => (
                <View key={service.id} className="flex-row justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm mb-3">
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
                                        companyName: company.name
                                    }
                                });
                            }}
                        >
                            <Text className="text-white font-bold text-xs">Rezervovať</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
        
        <View className="h-10" />
      </View>
    </ScrollView>
    </>
  );
}
