import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { HomeHeader } from '@/components/home/HomeHeader';
import { CategoryRail } from '@/components/home/CategoryRail';
import { BusinessCard } from '@/components/home/BusinessCard';
import { SectionHeader } from '@/components/home/SectionHeader';

const SPECIAL_OFFERS = [
  {
    id: '1',
    name: 'Unique Style Barbershop',
    address: '1000 FM 1960 Rd.West suite 202B, Houston, 77090',
    rating: 5.0,
    reviewCount: 330,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b7f30a?w=400&auto=format&fit=crop&q=60',
    promoted: true
  },
  {
    id: '2',
    name: 'Luxury Spa & Wellness',
    address: '123 Wellness Blvd, New York, NY',
    rating: 4.9,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=60',
  }
];

const RECOMMENDED = [
  {
    id: '3',
    name: 'Howard’s Groom Room LLC',
    address: '3709 Westfield Ave, Nj, 08110',
    rating: 4.9,
    reviewCount: 305,
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop&q=60',
    promoted: true
  },
  {
    id: '4',
    name: 'Tony\'s Cuts',
    address: '4359 W 3rd St, Los Angeles, CA',
    rating: 4.8,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&auto=format&fit=crop&q=60',
  }
];

export default function HomeScreen() {
  return (
    <Box className="flex-1 bg-neutral-900">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Box className="bg-neutral-900 pt-2 pb-6 px-4">
            <HomeHeader />
            <CategoryRail />
          </Box>
          
          <Box className="bg-white flex-1 pt-6 pb-20">
            <SectionHeader title="Špeciálne ponuky" />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            >
              {SPECIAL_OFFERS.map((item) => (
                <BusinessCard key={item.id} {...item} />
              ))}
            </ScrollView>

            <SectionHeader title="Odporúčané" />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            >
              {RECOMMENDED.map((item) => (
                <BusinessCard key={item.id} {...item} />
              ))}
            </ScrollView>
          </Box>
        </ScrollView>
      </SafeAreaView>
    </Box>
  );
}
