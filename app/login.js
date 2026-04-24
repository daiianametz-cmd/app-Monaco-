import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { AuthContext } from "../src/context/AuthContext";
import { db } from "../src/db/database";

const logo = require("../assets/images/logo.jpeg");

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(null); // 👈 NUEVO

  const { setRole, setUser: setUserContext } = useContext(AuthContext);

  const login = async () => {
    try {
      const res = await db.getFirstAsync(
        `SELECT * FROM usuarios WHERE usuario = ? AND password = ?`,
        [user.trim().toLowerCase(), pass]
      );

      if (!res) {
        setError("Usuario o contraseña incorrectos"); // 👈 REEMPLAZA ALERT
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
      setError("Algo salió mal al iniciar sesión"); // 👈 REEMPLAZA ALERT
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f1923" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            height: 4,
            backgroundColor: "#e8a020",
            borderRadius: 2,
            marginBottom: 40,
            width: 60,
            alignSelf: "center",
          }}
        />

        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#1c2b3a",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#2a3f52",
              overflow: "hidden",
            }}
          >
            <Image
              source={logo}
              style={{
                width: 100,
                height: 100,
                resizeMode: "cover",
              }}
            />
          </View>
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#f0f4f8",
            textAlign: "center",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          Bienvenido
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#5a7a94",
            textAlign: "center",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          Sistema de gestión
        </Text>

        <View
          style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: "#2a3f52",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#5a7a94",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Usuario
          </Text>
          <TextInput
            placeholder="Ingresá tu usuario"
            placeholderTextColor="#3d5568"
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            style={{
              backgroundColor: "#0f1923",
              borderWidth: 1,
              borderColor: "#2a3f52",
              padding: 14,
              marginBottom: 20,
              borderRadius: 10,
              color: "#f0f4f8",
              fontSize: 15,
            }}
          />

          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#5a7a94",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Contraseña
          </Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#3d5568"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            style={{
              backgroundColor: "#0f1923",
              borderWidth: 1,
              borderColor: "#2a3f52",
              padding: 14,
              marginBottom: 28,
              borderRadius: 10,
              color: "#f0f4f8",
              fontSize: 15,
            }}
          />

          <TouchableOpacity
            onPress={login}
            style={{
              backgroundColor: "#e8a020",
              padding: 16,
              borderRadius: 10,
              alignItems: "center",
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: "#0f1923",
                fontWeight: "700",
                fontSize: 15,
                letterSpacing: 0.8,
              }}
            >
              Ingresar
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            textAlign: "center",
            color: "#2a3f52",
            fontSize: 11,
            marginTop: 32,
            letterSpacing: 0.5,
          }}
        >
          © {new Date().getFullYear()} — Uso interno
        </Text>
      </ScrollView>

      {/* 🔥 MODAL ERROR CUSTOM */}
      <Modal visible={!!error} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000aa",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "#1c2b3a",
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: "#2a3f52",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#ef4444",
                fontSize: 14,
                fontWeight: "700",
                marginBottom: 12,
                letterSpacing: 0.5,
              }}
            >
              ERROR
            </Text>

            <Text
              style={{
                color: "#f0f4f8",
                fontSize: 15,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              {error}
            </Text>

            <TouchableOpacity
              onPress={() => setError(null)}
              style={{
                backgroundColor: "#e8a020",
                paddingVertical: 12,
                paddingHorizontal: 40,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: "#0f1923",
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                ACEPTAR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}