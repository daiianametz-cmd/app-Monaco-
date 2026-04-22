import { Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../src/context/AuthContext";

export default function Index() {
  const { user } = useContext(AuthContext);

  // ⏳ mientras carga sesión (user = null al inicio)
  if (user === null) return null;

  // 🔐 si no hay usuario → login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // 🚀 si hay usuario → producción
  return <Redirect href="/(tabs)/produccion" />;
}
