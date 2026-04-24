import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import { db } from "../src/db/database";

const logo = require("../assets/images/logo.jpeg");

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const { setRole, setUser: setUserContext } = useContext(AuthContext);

  const login = async () => {
    try {
      const res = await db.getFirstAsync(
        `SELECT * FROM usuarios WHERE usuario = ? AND password = ?`,
        [user.trim().toLowerCase(), pass]
      );

      if (!res) {
        Alert.alert("❌", "Usuario o contraseña incorrectos");
        return;
      }

      await db.runAsync(`DELETE FROM session WHERE 1=1`);

      await db.runAsync(
        `INSERT INTO session (user_id, usuario, rol) VALUES (?, ?, ?)`,
        [res.id, res.usuario, res.rol]
      );

      setRole(res.rol);
      setUserContext(res.usuario);

      if (res.rol === "admin" || res.rol === "operaciones") {
        router.replace("/(tabs)/produccion");
      } else {
        router.replace("/(tabs)/ventas");
      }
    } catch (e) {
      console.log("❌ LOGIN ERROR:", e);
      Alert.alert("Error", "Algo salió mal al iniciar sesión");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f6fa" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: "#fff",
            padding: 25,
            borderRadius: 15,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          {/* LOGO */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Image
              source={logo}
              style={{
                width: 140,
                height: 140,
                resizeMode: "contain",
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            🔐 Iniciar sesión
          </Text>

          <TextInput
            placeholder="Usuario"
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              marginBottom: 12,
              borderRadius: 10,
            }}
          />

          <TextInput
            placeholder="Contraseña"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 12,
              marginBottom: 20,
              borderRadius: 10,
            }}
          />

          <TouchableOpacity
            onPress={login}
            style={{
              backgroundColor: "#2d8cff",
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              Ingresar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}