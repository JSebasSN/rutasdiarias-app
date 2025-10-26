// template
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="new-record"
        options={{
          title: "Nuevo",
          tabBarIcon: ({ color }) => <Ionicons name="add" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: "Rutas",
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
