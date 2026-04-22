import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
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

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const session = await db.getFirstAsync(
        `SELECT * FROM session LIMIT 1`
      );

      if (!session) {
        router.replace("/login");
        return;
      }

      let usuario = null;

      if (session.user_id) {
        usuario = await db.getFirstAsync(
          `SELECT * FROM usuarios WHERE id = ?`,
          [session.user_id]
        );
      }

      if (!usuario && session.usuario) {
        usuario = await db.getFirstAsync(
          `SELECT * FROM usuarios WHERE usuario = ?`,
          [session.usuario]
        );
      }

      if (!usuario) {
        router.replace("/login");
        return;
      }

      setUser(usuario);
    } catch (err) {
      console.log("❌ Error perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarNombre = async (nombre) => {
    try {
      await db.runAsync(
        `UPDATE usuarios SET nombre = ? WHERE id = ?`,
        [nombre, user.id]
      );
      setUser({ ...user, nombre });
    } catch (e) {
      console.log("❌ Error nombre:", e);
    }
  };

  const seleccionarFoto = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.5,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;

        const fileName = `user_${user.id}.jpg`;
        const newPath = FileSystem.documentDirectory + fileName;

        await FileSystem.copyAsync({
          from: uri,
          to: newPath,
        });

        await db.runAsync(
          `UPDATE usuarios SET foto = ? WHERE id = ?`,
          [newPath, user.id]
        );

        setUser({ ...user, foto: newPath });
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
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Error cargando perfil</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* AVATAR */}
        <TouchableOpacity onPress={seleccionarFoto} style={styles.avatarWrapper}>
          {user.foto ? (
            <Image source={{ uri: user.foto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarInstagram}>
              <Ionicons name="person" size={55} color="#9ca3af" />
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.cambiarFoto}>
          Cambiar foto
        </Text>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={user.nombre || ""}
            onChangeText={actualizarNombre}
            placeholder="Tu nombre"
            style={styles.input}
          />

          <Text style={styles.label}>Usuario</Text>
          <Text style={styles.texto}>{user.usuario}</Text>

          <Text style={styles.label}>Rol</Text>
          <Text style={styles.texto}>{user.rol}</Text>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// =========================
// 🎨 ESTÉTICA PRO (IG STYLE)
// =========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f7",
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarWrapper: {
    marginTop: 10,
  },

  // 🔥 estilo instagram
  avatarInstagram: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4da6ff",
  },

  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#4da6ff",
  },

  cambiarFoto: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 14,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    marginTop: 25,
    elevation: 5,
  },

  label: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 10,
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 10,
  },

  texto: {
    fontSize: 16,
    marginBottom: 10,
    color: "#111827",
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
    elevation: 3,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
