import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../src/context/AuthContext";

export default function TabsLayout() {
  const { role } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1c2b3a",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 16,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#e8a020",
        tabBarInactiveTintColor: "#3d5568",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="produccion"
        options={{
          title: "Producción",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hammer-outline" size={size} color={color} />
          ),
          href: role === "admin" || role === "operaciones" ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="ventas"
        options={{
          title: "Ventas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
          href: role === "admin" || role === "ventas" ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="insumos"
        options={{
          title: "Insumos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
          href: role === "admin" || role === "operaciones" ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="empaquetado"
        options={{
          title: "Empaquetado",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
          href: role === "admin" || role === "operaciones" ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
          href: role === "admin" ? undefined : null,
        }}
      />
    </Tabs>
  );
}