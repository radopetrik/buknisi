import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Search, Calendar, User, Home } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Icon } from '@/components/ui/icon';
import { getUserOrNull, supabase } from '@/lib/supabase';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [preferredCitySlug, setPreferredCitySlug] = useState('bratislava');

  useEffect(() => {
    let isMounted = true;

    async function fetchPreferredCitySlug() {
      try {
        let citySlug = 'bratislava';

        const user = await getUserOrNull();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_city_id')
            .eq('id', user.id)
            .single();

          const preferredCityId = profile?.preferred_city_id;
          if (preferredCityId) {
            const { data: city } = await supabase
              .from('cities')
              .select('slug')
              .eq('id', preferredCityId)
              .single();

            if (city?.slug) {
              citySlug = city.slug;
            }
          }
        }

        if (isMounted) {
          setPreferredCitySlug(citySlug);
        }
      } catch {
        // ignore and keep default
      }
    }

    fetchPreferredCitySlug();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderTopColor: '#f2f2f2',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domov',
          tabBarIcon: ({ color }) => <Icon as={Home} color={color} size="md" />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Prehliadať',
          tabBarIcon: ({ color }) => <Icon as={Search} color={color} size="md" />,
          href: {
            pathname: '/explore/[city]',
            params: { city: preferredCitySlug },
          },
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Rezervácie',
          tabBarIcon: ({ color }) => <Icon as={Calendar} color={color} size="md" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Icon as={User} color={color} size="md" />,
        }}
      />
    </Tabs>
  );
}
