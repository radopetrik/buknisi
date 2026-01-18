import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Star } from 'lucide-react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HomeHeader } from '@/components/home/HomeHeader';
import { CategoryRail } from '@/components/home/CategoryRail';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { Image } from '@/components/ui/image';
import { Icon } from '@/components/ui/icon';
import { supabase } from '@/lib/supabase';

const RECOMMENDED_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';

export default function HomeScreen() {
  const [recommendedCompanies, setRecommendedCompanies] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecommendedCompanies() {
      setLoadingRecommended(true);

      try {
        const { data } = await supabase
          .from('companies')
          .select('id, name, slug, rating, city:cities(name), category:categories(name), photos(url)')
          .limit(12);

        if (!isMounted) return;

        const shuffled = [...(data || [])].sort(() => 0.5 - Math.random());
        setRecommendedCompanies(shuffled.slice(0, 3));
      } finally {
        if (isMounted) {
          setLoadingRecommended(false);
        }
      }
    }

    fetchRecommendedCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  const recommendedContent = useMemo(() => {
    if (loadingRecommended) {
      return <Text className="text-text-muted text-center py-4">Načítavam odporúčané podniky...</Text>;
    }

    if (recommendedCompanies.length === 0) {
      return <Text className="text-text-muted text-center py-4">Zatiaľ nemáme odporúčané podniky.</Text>;
    }

    return recommendedCompanies.map((company) => (
      <Link key={company.id} href={`/company/${company.slug}`} asChild>
        <Pressable className="bg-white rounded-2xl mb-5 shadow-sm border border-gray-100 overflow-hidden">
          <Image
            source={{
              uri: company.photos?.[0]?.url || RECOMMENDED_FALLBACK_IMAGE,
            }}
            alt={company.name}
            className="w-full h-44 bg-gray-200"
            resizeMode="cover"
          />
          <Box className="p-4">
            <Box className="flex-row justify-between items-start mb-1">
              <Heading className="text-lg font-bold text-text-main flex-1 mr-2">{company.name}</Heading>
              <Box className="flex-row items-center bg-accent-pink px-2 py-1 rounded-lg">
                <Icon as={Star} size="xs" className="text-primary mr-1" />
                <Text className="text-xs font-bold text-primary">{Number(company.rating || 0).toFixed(1)}</Text>
              </Box>
            </Box>
            <Text className="text-text-muted text-sm mb-2">
              {company.city?.name} • {company.category?.name}
            </Text>
          </Box>
        </Pressable>
      </Link>
    ));
  }, [loadingRecommended, recommendedCompanies]);

  return (
    <Box className="flex-1 bg-white">
      {/* SafeAreaView bg matches the header color (black) */}
      <SafeAreaView edges={['top']} className="flex-1 bg-black">
        <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Header Section Background */}
          <Box className="bg-white">
            <Box className="mb-4">
              <HomeHeader />
            </Box>

            <Box className="px-6 mb-5 mt-2">
              <Text className="text-text-main text-xl font-bold tracking-tight">Čo si chcete rezervovať?</Text>
            </Box>
            <CategoryRail />
          </Box>

          <Box className="mt-8 px-4">
            <Heading className="text-lg font-bold text-text-main mb-4">Odporúčame</Heading>
            {recommendedContent}
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
