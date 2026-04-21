import { router } from "expo-router";
import { useContext } from "react";
import { Button, Text, View } from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import { db } from "../src/db/database";

export default function Perfil() {
  const { role, setRole, setUser } = useContext(AuthContext);

  const logout = async () => {
    try {
      // 🔥 borrar sesión
      await db.runAsync(`DELETE FROM session`);

      // 🔥 limpiar contexto correctamente
      setRole(null);
      setUser(false); // 🔥 CLAVE: no usar null

      // 🔥 ir al login
      router.replace("/login");

    } catch (e) {
      console.log("ERROR LOGOUT:", e);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>👤 Perfil</Text>

      <Text style={{ marginVertical: 15, fontSize: 18 }}>
        Rol: {role || "Sin rol"}
      </Text>

      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}