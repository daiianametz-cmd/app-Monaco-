import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
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

const tipoColors = {
  pollo: "#e8a020",
  carne: "#ef4444",
  pescado: "#3b82f6",
  soja: "#10b981",
  soja_espinaca: "#22c55e",
  soja_calabaza: "#f97316",
};

const tipoLabels = {
  pollo: "Pollo",
  carne: "Carne",
  pescado: "Pescado",
  soja: "Soja",
  soja_espinaca: "Soja Espinaca",
  soja_calabaza: "Soja Calabaza",
};

export default function Ventas() {
  const { role } = useContext(AuthContext);

  const [tipo, setTipo] = useState("");
  const [kg, setKg] = useState("");
  const [stock, setStock] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!role) { router.replace("/login"); return; }
    if (role !== "admin" && role !== "ventas") router.replace("/(tabs)/produccion");
  }, [role]);

  const normalizar = (t) => t?.trim().toLowerCase();

  const cargarStock = async () => {
    if (!tipo) { setStock(0); return; }
    try {
      const res = await db.getFirstAsync(
        "SELECT empaquetado FROM stock_hamburguesas WHERE tipo = ?",
        [normalizar(tipo)]
      );
      setStock(res?.empaquetado ?? 0);
    } catch (e) {
      console.log("❌ Error stock:", e);
      setStock(0);
    }
  };

  useEffect(() => { cargarStock(); }, [tipo]);

  const mostrarMensaje = (txt, ok = true) => {
    setMensaje({ texto: txt, ok });
    setTimeout(() => setMensaje(""), 2000);
  };

  const vender = async () => {
    if (loading) return;
    const cantidad = Number(String(kg).replace(",", "."));
    const tipoNorm = normalizar(tipo);
    if (!tipoNorm) return mostrarMensaje("Seleccioná un tipo", false);
    if (!cantidad || cantidad <= 0) return mostrarMensaje("Kg inválidos", false);
    if (stock < cantidad) return mostrarMensaje(`Stock insuficiente (${stock.toFixed(2)} kg)`, false);

    try {
      setLoading(true);
      const session = await db.getFirstAsync(`SELECT * FROM session LIMIT 1`);
      const usuario = session?.usuario || "desconocido";
      await db.runAsync(
        `UPDATE stock_hamburguesas SET empaquetado = empaquetado - ? WHERE tipo = ?`,
        [cantidad, tipoNorm]
      );
      await db.runAsync(
        `INSERT INTO ventas (fecha, tipo, kg, usuario) VALUES (?, ?, ?, ?)`,
        [new Date().toISOString(), tipoNorm, cantidad, usuario]
      );
      mostrarMensaje("Venta registrada ✅");
      setKg("");
      await cargarStock();
    } catch (e) {
      console.log("❌ Error venta:", e);
      mostrarMensaje("Error inesperado", false);
    } finally {
      setLoading(false);
    }
  };

  const accentColor = tipoColors[tipo] || "#e8a020";
  const stockBajo = stock > 0 && stock < 5;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1923" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ height: 4, width: 40, backgroundColor: "#e8a020", borderRadius: 2, marginBottom: 16 }} />
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#f0f4f8", letterSpacing: 0.3 }}>
              Ventas
            </Text>
            <Text style={{ fontSize: 12, color: "#5a7a94", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 4 }}>
              Registro de despacho
            </Text>
          </View>

          {/* Mensaje */}
          {!!mensaje && (
            <View style={{
              backgroundColor: mensaje.ok ? "#10b98118" : "#ef444418",
              borderRadius: 12,
              padding: 14,
              marginBottom: 20,
            }}>
              <Text style={{ color: mensaje.ok ? "#10b981" : "#ef4444", fontWeight: "600", fontSize: 13 }}>
                {mensaje.texto}
              </Text>
            </View>
          )}

          {/* Card stock */}
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#5a7a94", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
              Stock disponible
            </Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <Text style={{ fontSize: 40, fontWeight: "800", color: stockBajo ? "#ef4444" : accentColor, letterSpacing: -1 }}>
                {Number(stock).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5a7a94", marginBottom: 6 }}>
                kg
              </Text>
            </View>
            {tipo !== "" && (
              <Text style={{ fontSize: 12, color: "#5a7a94", marginTop: 4 }}>
                {tipoLabels[tipo]}
                {stockBajo ? "  ·  ⚠️ Stock bajo" : ""}
              </Text>
            )}
          </View>

          {/* Picker tipo */}
          <Text style={S.label}>Tipo de producto</Text>
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 14,
            marginBottom: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <Picker
              selectedValue={tipo}
              onValueChange={setTipo}
              style={{ color: "#f0f4f8" }}
              dropdownIconColor="#5a7a94"
            >
              <Picker.Item label="Seleccionar tipo" value="" color="#3d5568" />
              <Picker.Item label="Pollo" value="pollo" color="#0f1923" />
              <Picker.Item label="Carne" value="carne" color="#0f1923" />
              <Picker.Item label="Pescado" value="pescado" color="#0f1923" />
              <Picker.Item label="Soja" value="soja" color="#0f1923" />
              <Picker.Item label="Soja Espinaca" value="soja_espinaca" color="#0f1923" />
              <Picker.Item label="Soja Calabaza" value="soja_calabaza" color="#0f1923" />
            </Picker>
          </View>

          {/* Input kg */}
          <Text style={S.label}>Kg a vender</Text>
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 14,
            padding: 20,
            marginBottom: 28,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={kg}
                onChangeText={setKg}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#3d5568"
                style={{
                  flex: 1,
                  fontSize: 32,
                  fontWeight: "800",
                  color: tipo ? accentColor : "#f0f4f8",
                  letterSpacing: -0.5,
                }}
              />
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#5a7a94" }}>kg</Text>
            </View>
          </View>

          {/* Botón */}
          <TouchableOpacity
            onPress={vender}
            style={{
              backgroundColor: loading ? "#5a7a94" : "#e8a020",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              shadowColor: "#e8a020",
              shadowOpacity: loading ? 0 : 0.3,
              shadowRadius: 10,
              elevation: loading ? 0 : 6,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 15, letterSpacing: 0.8 }}>
              {loading ? "Guardando..." : "Registrar venta"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = {
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#5a7a94",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
};