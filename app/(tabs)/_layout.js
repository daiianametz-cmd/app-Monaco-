import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../../src/context/AuthContext";

export default function TabsLayout() {
  const { role } = useContext(AuthContext);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >

      <Tabs.Screen
        name="produccion"
        options={{
          title: "Producción",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
          href:
            role === "admin" || role === "operaciones"
              ? undefined
              : null, // 🔥 OCULTA LA TAB
        }}
      />

      <Tabs.Screen
        name="ventas"
        options={{
          title: "Ventas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={size} color={color} />
          ),
          href:
            role === "admin" || role === "ventas"
              ? undefined
              : null,
        }}
      />

      <Tabs.Screen
        name="insumos"
        options={{
          title: "Insumos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
          href:
            role === "admin" || role === "operaciones"
              ? undefined
              : null,
        }}
      />

      <Tabs.Screen
        name="empaquetado"
        options={{
          title: "Empaquetado",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="archive" size={size} color={color} />
          ),
          href:
            role === "admin" || role === "operaciones"
              ? undefined
              : null,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reportes"
        options={{
          title: "Reportes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
          href:
            role === "admin"
              ? undefined
              : null,
        }}
      />

    </Tabs>
  );
}
