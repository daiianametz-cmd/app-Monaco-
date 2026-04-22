import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider } from "../src/context/AuthContext";
import { initDB } from "../src/db/database";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = async () => {
      await initDB();
      setReady(true);
    };
    start();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 👇 index decide si va a login o tabs */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}

