import React from 'react';
import { Tabs } from 'expo-router';
import { Search, Calendar, User } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Icon } from '@/components/ui/icon';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
          title: 'Hľadať',
          tabBarIcon: ({ color }) => <Icon as={Search} color={color} size="md" />,
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
