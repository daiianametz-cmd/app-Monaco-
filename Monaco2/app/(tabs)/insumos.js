import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../src/context/AuthContext";
import { db } from "../../src/db/database";

// =========================
// 🔥 FORMATO STOCK
// =========================
const formatearStock = (cantidad, unidad) => {
  if (unidad === "kg") return `${(cantidad / 1000).toFixed(2)} kg`;

  if (unidad === "g") {
    return cantidad >= 1000
      ? `${(cantidad / 1000).toFixed(2)} kg`
      : `${cantidad} g`;
  }

  if (unidad === "ml") {
    return cantidad >= 1000
      ? `${(cantidad / 1000).toFixed(2)} lt`
      : `${cantidad} ml`;
  }

  if (unidad === "litro") {
    return `${(cantidad / 1000).toFixed(2)} lt`;
  }

  if (unidad === "atado") {
    return `${cantidad} atado${cantidad === 1 ? "" : "s"}`;
  }

  return `${cantidad} ${unidad}`;
};

const convertirDesdeKg = (valor, unidad) => {
  const num = Number(String(valor).replace(",", "."));
  if (!num) return 0;

  if (unidad === "kg") return num * 1000;
  if (unidad === "g") return num;
  if (unidad === "ml") return num;
  if (unidad === "litro") return num * 1000;
  if (unidad === "atado") return num;

  return 0;
};

export default function Insumos() {
  const { role, user } = useContext(AuthContext);

  const [insumos, setInsumos] = useState([]);

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cantidad, setCantidad] = useState("");

  const [unidadSeleccionada, setUnidadSeleccionada] = useState("kg");

  const [modalVisible, setModalVisible] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [cantidadAgregar, setCantidadAgregar] = useState("");

  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!role) return;
    if (role !== "admin" && role !== "operaciones") {
      router.replace("/(tabs)/ventas");
    }
  }, [role]);

  const mostrarMensaje = (txt, color = "#2ecc71") => {
    setMensaje({ texto: txt, color });
    setTimeout(() => setMensaje(""), 2000);
  };

  // =========================
  // 📌 LOG DE MOVIMIENTOS (FIX FINAL)
  // =========================
  const logMovimiento = async (tipo, descripcion) => {
    try {
      await db.runAsync(
        `INSERT INTO movimientos (tipo, descripcion, fecha, usuario)
         VALUES (?, ?, datetime('now'), ?)`,
        [tipo, descripcion, user || "desconocido"]
      );
    } catch (e) {
      console.log("Error log movimiento:", e);
    }
  };

  const cargar = async () => {
    const res = await db.getAllAsync(
      "SELECT * FROM insumos ORDER BY nombre ASC"
    );
    setInsumos(res);
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [])
  );

  // ➕ agregar
  const agregar = async () => {
    if (!nombre) return mostrarMensaje("Nombre requerido", "#e74c3c");

    const nombreFinal = nombre.trim();
    const nombreNormalizado = nombreFinal.toLowerCase();

    const existente = await db.getFirstAsync(
      "SELECT * FROM insumos WHERE LOWER(nombre) = ?",
      [nombreNormalizado]
    );

    if (existente) {
      return mostrarMensaje("⚠️ Ese insumo ya existe", "#e74c3c");
    }

    const cantidadConvertida = convertirDesdeKg(cantidad, unidadSeleccionada);

    await db.runAsync(
      `INSERT INTO insumos (nombre, categoria, cantidad, unidad, stock_minimo)
       VALUES (?, ?, ?, ?, 0)`,
      [
        nombreFinal,
        categoria || "general",
        cantidadConvertida,
        unidadSeleccionada,
      ]
    );

    await logMovimiento("ALTA", `Se creó insumo: ${nombreFinal}`);

    setNombre("");
    setCategoria("");
    setCantidad("");
    setUnidadSeleccionada("kg");

    mostrarMensaje("Insumo agregado ✅");
    cargar();
  };

  // 🗑️ eliminar
  const eliminar = (item) => {
    Alert.alert(
      "Eliminar insumo",
      `¿Estás seguro que deseas eliminar "${item.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await db.runAsync("DELETE FROM insumos WHERE id = ?", [item.id]);

            await logMovimiento(
              "BAJA",
              `Se eliminó insumo: ${item.nombre}`
            );

            mostrarMensaje("Eliminado");
            cargar();
          },
        },
      ]
    );
  };

  const abrirModal = (item) => {
    setInsumoSeleccionado(item);
    setCantidadAgregar("");
    setModalVisible(true);
  };

  const confirmarAgregar = async () => {
    if (!insumoSeleccionado) return;

    const valor = convertirDesdeKg(
      cantidadAgregar,
      insumoSeleccionado.unidad
    );

    if (!valor) return;

    await db.runAsync(
      `UPDATE insumos 
       SET cantidad = cantidad + ? 
       WHERE id = ?`,
      [valor, insumoSeleccionado.id]
    );

    await logMovimiento(
      "STOCK",
      `Se agregó ${cantidadAgregar} ${insumoSeleccionado.unidad} a ${insumoSeleccionado.nombre}`
    );

    setModalVisible(false);
    setInsumoSeleccionado(null);
    setCantidadAgregar("");

    mostrarMensaje("Stock actualizado ✅");
    cargar();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>

          <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 15 }}>
            🧾 Insumos
          </Text>

          {mensaje && (
            <View style={{
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 10,
              marginBottom: 15,
              borderLeftWidth: 5,
              borderLeftColor: mensaje.color
            }}>
              <Text>{mensaje.texto}</Text>
            </View>
          )}

          {/* FORM */}
          <View style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 15,
            marginBottom: 15,
          }}>

            <TextInput
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
              style={input}
            />

            <TextInput
              placeholder="Categoría"
              value={categoria}
              onChangeText={setCategoria}
              style={input}
            />

            <TextInput
              placeholder="Cantidad"
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="decimal-pad"
              style={input}
            />

            <View style={pickerBox}>
              <Picker
                selectedValue={unidadSeleccionada}
                onValueChange={setUnidadSeleccionada}
              >
                <Picker.Item label="kg" value="kg" />
                <Picker.Item label="g" value="g" />
                <Picker.Item label="ml" value="ml" />
                <Picker.Item label="litro" value="litro" />
                <Picker.Item label="atado" value="atado" />
              </Picker>
            </View>

            <TouchableOpacity onPress={agregar} style={boton}>
              <Text style={botonText}>➕ Agregar</Text>
            </TouchableOpacity>

          </View>

          {/* LISTA */}
          {insumos.map((item) => (
            <View key={item.id} style={card}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600" }}>{item.nombre}</Text>
                <Text style={{ color: "#666" }}>
                  {formatearStock(item.cantidad, item.unidad)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity onPress={() => abrirModal(item)}>
                  <Ionicons name="add-circle" size={26} color="#27ae60" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => eliminar(item)}>
                  <Ionicons name="trash" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* MODAL */}
          <Modal visible={modalVisible} transparent animationType="fade">
            <View style={overlay}>
              <View style={modalBox}>

                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {insumoSeleccionado?.nombre}
                </Text>

                <TextInput
                  placeholder="Cantidad a agregar"
                  value={cantidadAgregar}
                  onChangeText={setCantidadAgregar}
                  keyboardType="decimal-pad"
                  style={[input, { marginTop: 15 }]}
                />

                <TouchableOpacity onPress={confirmarAgregar} style={boton}>
                  <Text style={botonText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[boton, { backgroundColor: "#999", marginTop: 10 }]}
                >
                  <Text style={botonText}>Cancelar</Text>
                </TouchableOpacity>

              </View>
            </View>
          </Modal>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// estilos
const input = {
  borderWidth: 1,
  borderColor: "#e0e0e0",
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
};

const pickerBox = {
  borderWidth: 1,
  borderColor: "#e0e0e0",
  borderRadius: 10,
  marginBottom: 10,
};

const boton = {
  backgroundColor: "#4da6ff",
  padding: 14,
  borderRadius: 12,
  alignItems: "center",
};

const botonText = {
  color: "#fff",
  fontWeight: "600",
};

const card = {
  backgroundColor: "#fff",
  padding: 15,
  borderRadius: 15,
  marginBottom: 10,
  flexDirection: "row",
  alignItems: "center",
};

const overlay = {
  flex: 1,
  justifyContent: "center",
  backgroundColor: "#00000066",
  padding: 20,
};

const modalBox = {
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 15,
};