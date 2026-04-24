import { Ionicons } from "@expo/vector-icons";
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
  if (unidad === "litro") return `${(cantidad / 1000).toFixed(2)} lt`;
  if (unidad === "atado") return `${cantidad} atado${cantidad === 1 ? "" : "s"}`;
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

const UNIDADES = ["kg", "g", "ml", "litro", "atado"];

export default function Insumos() {
  const { role, user } = useContext(AuthContext);

  const [insumos, setInsumos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("kg");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [insumoAEliminar, setInsumoAEliminar] = useState(null);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [cantidadAgregar, setCantidadAgregar] = useState("");
  const [toast, setToast] = useState("");
  const [toastOk, setToastOk] = useState(true);

  useEffect(() => {
    if (!role) return;
    if (role !== "admin" && role !== "operaciones") {
      router.replace("/(tabs)/ventas");
    }
  }, [role]);

  const mostrarToast = (txt, ok = true) => {
    setToast(txt);
    setToastOk(ok);
    setTimeout(() => setToast(""), 2500);
  };

  const logMovimiento = async (tipo, descripcion) => {
    try {
      await db.runAsync(
        `INSERT INTO movimientos (tipo, descripcion, fecha, usuario) VALUES (?, ?, datetime('now'), ?)`,
        [tipo, descripcion, user || "desconocido"]
      );
    } catch (e) {
      console.log("Error log movimiento:", e);
    }
  };

  const cargar = async () => {
    const res = await db.getAllAsync("SELECT * FROM insumos ORDER BY nombre ASC");
    setInsumos(res);
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const agregar = async () => {
    if (!nombre) return mostrarToast("Nombre requerido", false);
    const nombreFinal = nombre.trim();
    const nombreNormalizado = nombreFinal.toLowerCase();
    const existente = await db.getFirstAsync(
      "SELECT * FROM insumos WHERE LOWER(nombre) = ?",
      [nombreNormalizado]
    );
    if (existente) return mostrarToast("Ese insumo ya existe", false);
    const cantidadConvertida = convertirDesdeKg(cantidad, unidadSeleccionada);
    await db.runAsync(
      `INSERT INTO insumos (nombre, categoria, cantidad, unidad, stock_minimo) VALUES (?, ?, ?, ?, 0)`,
      [nombreFinal, categoria || "general", cantidadConvertida, unidadSeleccionada]
    );
    await logMovimiento("ALTA", `Se creó insumo: ${nombreFinal}`);
    setNombre(""); setCategoria(""); setCantidad(""); setUnidadSeleccionada("kg");
    mostrarToast("Insumo agregado ✅");
    cargar();
  };

  const eliminar = (item) => {
    setInsumoAEliminar(item);
    setModalEliminar(true);
  };

  const confirmarEliminar = async () => {
    if (!insumoAEliminar) return;
    await db.runAsync("DELETE FROM insumos WHERE id = ?", [insumoAEliminar.id]);
    await logMovimiento("BAJA", `Se eliminó insumo: ${insumoAEliminar.nombre}`);
    setModalEliminar(false);
    setInsumoAEliminar(null);
    mostrarToast("Insumo eliminado");
    cargar();
  };

  const abrirModal = (item) => {
    setInsumoSeleccionado(item);
    setCantidadAgregar("");
    setModalVisible(true);
  };

  const confirmarAgregar = async () => {
    if (!insumoSeleccionado) return;
    const valor = convertirDesdeKg(cantidadAgregar, insumoSeleccionado.unidad);
    if (!valor) return;
    await db.runAsync(
      `UPDATE insumos SET cantidad = cantidad + ? WHERE id = ?`,
      [valor, insumoSeleccionado.id]
    );
    await logMovimiento(
      "STOCK",
      `Se agregó ${cantidadAgregar} ${insumoSeleccionado.unidad} a ${insumoSeleccionado.nombre}`
    );
    setModalVisible(false);
    setInsumoSeleccionado(null);
    setCantidadAgregar("");
    mostrarToast("Stock actualizado ✅");
    cargar();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1923" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ height: 4, width: 40, backgroundColor: "#e8a020", borderRadius: 2, marginBottom: 16 }} />
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#f0f4f8", letterSpacing: 0.3 }}>
              Insumos
            </Text>
            <Text style={{ fontSize: 12, color: "#5a7a94", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 4 }}>
              Gestión de stock
            </Text>
          </View>

          {/* Formulario nuevo insumo */}
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#2a3f52",
          }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#5a7a94", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 14 }}>
              Nuevo insumo
            </Text>

            <Text style={labelStyle}>Nombre</Text>
            <TextInput
              placeholder="Ej: Pollo"
              placeholderTextColor="#3d5568"
              value={nombre}
              onChangeText={setNombre}
              style={inputStyle}
            />

            <Text style={labelStyle}>Categoría</Text>
            <TextInput
              placeholder="Ej: carnes"
              placeholderTextColor="#3d5568"
              value={categoria}
              onChangeText={setCategoria}
              style={inputStyle}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Cantidad</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#3d5568"
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <View style={{ width: 130 }}>
                <Text style={labelStyle}>Unidad</Text>
                {/* Botones propios en vez de Picker — evita el dropdown blanco del sistema */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {UNIDADES.map((u) => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setUnidadSeleccionada(u)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor: unidadSeleccionada === u ? "#e8a020" : "#0f1923",
                        borderWidth: 1,
                        borderColor: unidadSeleccionada === u ? "#e8a020" : "#2a3f52",
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{
                        color: unidadSeleccionada === u ? "#0f1923" : "#5a7a94",
                        fontWeight: "700",
                        fontSize: 12,
                      }}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={agregar}
              style={{
                backgroundColor: "#e8a020",
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#0f1923" />
              <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 14, letterSpacing: 0.6 }}>
                Agregar insumo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#5a7a94", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 12 }}>
            Stock actual · {insumos.length} ítems
          </Text>

          {insumos.map((item) => (
            <View key={item.id} style={{
              backgroundColor: "#1c2b3a",
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "#2a3f52",
              flexDirection: "row",
              alignItems: "center",
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", color: "#f0f4f8", fontSize: 15, marginBottom: 3 }}>
                  {item.nombre}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{
                    backgroundColor: "#e8a02022",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: "#e8a02044",
                  }}>
                    <Text style={{ color: "#e8a020", fontWeight: "700", fontSize: 12 }}>
                      {formatearStock(item.cantidad, item.unidad)}
                    </Text>
                  </View>
                  {item.categoria && item.categoria !== "general" && (
                    <Text style={{ color: "#3d5568", fontSize: 11 }}>
                      {item.categoria}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => abrirModal(item)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: "#10b98122", borderWidth: 1, borderColor: "#10b98144",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => eliminar(item)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: "#ef444422", borderWidth: 1, borderColor: "#ef444444",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast flotante — siempre visible sin importar el scroll */}
      {!!toast && (
        <View style={{
          position: "absolute",
          bottom: 100,
          left: 20,
          right: 20,
          backgroundColor: toastOk ? "#10b98122" : "#ef444422",
          borderWidth: 1,
          borderColor: toastOk ? "#10b981" : "#ef4444",
          borderRadius: 12,
          padding: 14,
          alignItems: "center",
          zIndex: 999,
        }}>
          <Text style={{ color: toastOk ? "#10b981" : "#ef4444", fontWeight: "700", fontSize: 14 }}>
            {toast}
          </Text>
        </View>
      )}

      {/* Modal agregar stock */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#00000088", padding: 24 }}>
          <View style={{ backgroundColor: "#1c2b3a", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#2a3f52" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" }} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#f0f4f8" }}>
                {insumoSeleccionado?.nombre}
              </Text>
            </View>
            <Text style={labelStyle}>Cantidad a agregar ({insumoSeleccionado?.unidad})</Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#3d5568"
              value={cantidadAgregar}
              onChangeText={setCantidadAgregar}
              keyboardType="decimal-pad"
              style={[inputStyle, { marginBottom: 20 }]}
            />
            <TouchableOpacity
              onPress={confirmarAgregar}
              style={{ backgroundColor: "#10b981", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 10 }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 14 }}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ padding: 14, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#2a3f52" }}
            >
              <Text style={{ color: "#5a7a94", fontWeight: "600", fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal eliminar */}
      <Modal visible={modalEliminar} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#00000088", padding: 24 }}>
          <View style={{ backgroundColor: "#1c2b3a", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#2a3f52" }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: "#ef444422", borderWidth: 1, borderColor: "#ef444444",
              alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#f0f4f8", marginBottom: 8 }}>
              ¿Eliminar insumo?
            </Text>
            <Text style={{ fontSize: 14, color: "#5a7a94", marginBottom: 24, lineHeight: 20 }}>
              Estás por eliminar{" "}
              <Text style={{ color: "#f0f4f8", fontWeight: "700" }}>{insumoAEliminar?.nombre}</Text>
              . Esta acción no se puede deshacer.
            </Text>
            <TouchableOpacity
              onPress={confirmarEliminar}
              style={{ backgroundColor: "#ef4444", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 10 }}
              activeOpacity={0.85}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Eliminar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setModalEliminar(false); setInsumoAEliminar(null); }}
              style={{ padding: 14, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#2a3f52" }}
            >
              <Text style={{ color: "#5a7a94", fontWeight: "600", fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const labelStyle = {
  fontSize: 11,
  fontWeight: "600",
  color: "#5a7a94",
  letterSpacing: 1.2,
  textTransform: "uppercase",
  marginBottom: 8,
};

const inputStyle = {
  backgroundColor: "#0f1923",
  borderWidth: 1,
  borderColor: "#2a3f52",
  borderRadius: 10,
  padding: 13,
  color: "#f0f4f8",
  fontSize: 15,
  marginBottom: 14,
};