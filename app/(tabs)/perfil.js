import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../src/db/database";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fotoKey, setFotoKey] = useState(Date.now()); // 🆕 fuerza re-render

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const session = await db.getFirstAsync(`SELECT * FROM session LIMIT 1`);
      if (!session) { router.replace("/login"); return; }

      let usuario = null;
      if (session.user_id) {
        usuario = await db.getFirstAsync(
          `SELECT * FROM usuarios WHERE id = ?`, [session.user_id]
        );
      }
      if (!usuario && session.usuario) {
        usuario = await db.getFirstAsync(
          `SELECT * FROM usuarios WHERE usuario = ?`, [session.usuario]
        );
      }
      if (!usuario) { router.replace("/login"); return; }

      setUser(usuario);
    } catch (err) {
      console.log("❌ Error perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarNombre = async (nombre) => {
    try {
      await db.runAsync(`UPDATE usuarios SET nombre = ? WHERE id = ?`, [nombre, user.id]);
      setUser({ ...user, nombre });
    } catch (e) {
      console.log("❌ Error nombre:", e);
    }
  };

  const seleccionarFoto = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true, // 👈 ESTA ES LA CLAVE
        aspect: [1, 1],      // 👈 mantiene formato cuadrado (ideal para avatar circular)
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const fileName = `user_${user.id}.jpg`;
        const newPath = FileSystem.documentDirectory + fileName;

        const info = await FileSystem.getInfoAsync(newPath);
        if (info.exists) {
          await FileSystem.deleteAsync(newPath, { idempotent: true });
        }

        await FileSystem.copyAsync({ from: uri, to: newPath });
        await db.runAsync(`UPDATE usuarios SET foto = ? WHERE id = ?`, [newPath, user.id]);

        setUser({ ...user, foto: newPath });
        setFotoKey(Date.now());
      }
    } catch (e) {
      console.log("❌ Error foto:", e);
    }
  };

  const logout = async () => {
    await db.runAsync(`DELETE FROM session`);
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Error cargando perfil</Text>
      </View>
    );
  }

  const iniciales = (user.nombre || user.usuario || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const rolColor =
    user.rol === "admin" ? "#e8a020"
    : user.rol === "operaciones" ? "#3b82f6"
    : "#10b981";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accentBar} />

        {/* AVATAR */}
        <TouchableOpacity onPress={seleccionarFoto} style={styles.avatarWrapper}>
          {user.foto ? (
            <Image
              key={fotoKey}
              source={{ uri: `${user.foto}?t=${fotoKey}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{iniciales}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={14} color="#0f1923" />
          </View>
        </TouchableOpacity>

        <Text style={styles.cambiarFoto}>Cambiar foto</Text>

        {/* Badge rol */}
        <View style={[styles.rolBadge, { backgroundColor: rolColor + "22", borderColor: rolColor }]}>
          <View style={[styles.rolDot, { backgroundColor: rolColor }]} />
          <Text style={[styles.rolBadgeText, { color: rolColor }]}>
            {user.rol?.toUpperCase()}
          </Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={user.nombre || ""}
            onChangeText={actualizarNombre}
            placeholder="Tu nombre"
            placeholderTextColor="#3d5568"
            style={styles.input}
          />

          <View style={styles.divider} />

          <Text style={styles.label}>Usuario</Text>
          <Text style={styles.texto}>{user.usuario}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Rol</Text>
          <Text style={styles.texto}>{user.rol}</Text>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1923",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f1923",
  },
  loadingText: {
    color: "#5a7a94",
    fontSize: 14,
  },
  accentBar: {
    height: 4,
    width: 60,
    backgroundColor: "#e8a020",
    borderRadius: 2,
    marginBottom: 28,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 4,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#e8a020",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#1c2b3a",
    borderWidth: 2,
    borderColor: "#e8a020",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "700",
    color: "#e8a020",
    letterSpacing: 2,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e8a020",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0f1923",
  },
  cambiarFoto: {
    marginTop: 10,
    color: "#5a7a94",
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  rolBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 28,
    gap: 6,
  },
  rolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rolBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  card: {
    width: "100%",
    backgroundColor: "#1c2b3a",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a3f52",
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5a7a94",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    fontSize: 16,
    color: "#f0f4f8",
    paddingVertical: 8,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a3f52",
    marginVertical: 14,
  },
  texto: {
    fontSize: 16,
    color: "#f0f4f8",
    paddingVertical: 8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef444455",
    backgroundColor: "#ef444411",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});