import { Tabs } from 'expo-router';
import { I18nManager } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProtectedLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        // Keep visual order stable left-to-right even in RTL.
        tabBarStyle: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          height: 64,
          paddingBottom: 6,
          paddingTop: 0,
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: 'Kalendár',
          tabBarLabel: 'Kalendár',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="calendar" size={size} color={color} weight="semibold" />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Pokladňa',
          tabBarLabel: 'Pokladňa',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol
              name="creditcard.fill"
              size={size}
              color={color}
              weight="semibold"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="clients/index"
        options={{
          title: 'Klienti',
          tabBarLabel: 'Klienti',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol
              name="person.2.fill"
              size={size}
              color={color}
              weight="semibold"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Viac',
          tabBarLabel: 'Viac',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol
              name="line.3.horizontal"
              size={size}
              color={color}
              weight="semibold"
            />
          ),
        }}
      />
    </Tabs>
  );
}
