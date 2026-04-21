import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    
    <Tabs>
    <Tabs.Screen
      name="produccion"
      options={{
        title: "Producción",  tabBarIcon: ({ color, size }) => (
          <Ionicons name="construct-outline" size={size} color={color} />
        ),  
      }}
    />
    <Tabs.Screen
      name="ventas"
      options={{
        title: "Ventas", tabBarIcon: ({ color, size }) => (
          <Ionicons name="business-outline" size={size} color={color} />
        ),    
      }}
    />
  </Tabs>
  );
}
