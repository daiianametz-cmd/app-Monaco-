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

export default function Empaquetado() {
  const { role, user } = useContext(AuthContext);

  const [tipo, setTipo] = useState("");
  const [paquetes, setPaquetes] = useState("");
  const [stock, setStock] = useState(0);
  const [stockEmpaquetado, setStockEmpaquetado] = useState(0);
  const [mensaje, setMensaje] = useState("");

  const FACTOR_KG = 0.2;

  useEffect(() => {
    if (!role) return;
    if (role !== "admin" && role !== "operaciones") router.replace("/(tabs)/ventas");
  }, [role]);

  const normalizarTipo = (t) => t?.trim().toLowerCase();

  const cargarStock = async () => {
    if (!tipo) { setStock(0); setStockEmpaquetado(0); return; }
    try {
      const res = await db.getFirstAsync(
        "SELECT * FROM stock_hamburguesas WHERE tipo = ?",
        [normalizarTipo(tipo)]
      );
      setStock(res?.sin_empaquetar ?? 0);
      setStockEmpaquetado(res?.empaquetado ?? 0);
    } catch (e) {
      console.log("❌ Error stock:", e);
    }
  };

  useEffect(() => { cargarStock(); }, [tipo]);

  const calcularKg = () => {
    const num = Number(String(paquetes).replace(",", "."));
    if (!num) return 0;
    return num * FACTOR_KG;
  };

  const mostrarMensaje = (texto, ok = true) => {
    setMensaje({ texto, ok });
    setTimeout(() => setMensaje(""), 2000);
  };

  const empaquetar = async () => {
    const kg = calcularKg();
    const tipoNormalizado = normalizarTipo(tipo);
    if (!tipoNormalizado) return mostrarMensaje("Seleccioná un tipo", false);
    if (!kg || kg <= 0) return mostrarMensaje("Cantidad inválida", false);
    try {
      const result = await db.runAsync(
        `UPDATE stock_hamburguesas
         SET sin_empaquetar = sin_empaquetar - ?, empaquetado = empaquetado + ?
         WHERE tipo = ? AND sin_empaquetar >= ?`,
        [kg, kg, tipoNormalizado, kg]
      );
      if (result.changes === 0) return mostrarMensaje("Stock insuficiente", false);
      await db.runAsync(
        `INSERT INTO empaquetado (fecha, tipo, paquetes, kg, usuario) VALUES (?, ?, ?, ?, ?)`,
        [new Date().toISOString(), tipoNormalizado, Number(paquetes), kg, user]
      );
      mostrarMensaje("Empaquetado OK ✅");
      setPaquetes("");
      await cargarStock();
    } catch (e) {
      console.log("❌ Error:", e);
      mostrarMensaje("Error inesperado", false);
    }
  };

  const accentColor = tipoColors[tipo] || "#e8a020";
  const kgEquivalente = calcularKg();

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
              Empaquetado
            </Text>
            <Text style={{ fontSize: 12, color: "#5a7a94", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 4 }}>
              Control de paquetes
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

          {/* Picker */}
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

          {/* Cards stock — lado a lado */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{
              flex: 1,
              backgroundColor: "#1c2b3a",
              borderRadius: 16,
              padding: 18,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#5a7a94", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Sin empaquetar
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: accentColor, letterSpacing: -0.5 }}>
                {Number(stock).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 13, color: "#5a7a94", marginTop: 2 }}>kg</Text>
            </View>

            <View style={{
              flex: 1,
              backgroundColor: "#1c2b3a",
              borderRadius: 16,
              padding: 18,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#5a7a94", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Empaquetado
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: "#10b981", letterSpacing: -0.5 }}>
                {Number(stockEmpaquetado).toFixed(2)}
              </Text>
              <Text style={{ fontSize: 13, color: "#5a7a94", marginTop: 2 }}>kg</Text>
            </View>
          </View>

          {/* Input paquetes */}
          <Text style={S.label}>Cantidad de paquetes</Text>
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 14,
            paddingHorizontal: 20,
            paddingVertical: 18,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <TextInput
              value={paquetes}
              onChangeText={setPaquetes}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#3d5568"
              style={{
                flex: 1,
                fontSize: 36,
                fontWeight: "800",
                color: tipo ? accentColor : "#f0f4f8",
                letterSpacing: -0.5,
              }}
            />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#5a7a94" }}>uds</Text>
          </View>

          {/* Equivalencia */}
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 12,
            padding: 14,
            marginBottom: 28,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 12, color: "#5a7a94", fontWeight: "600", letterSpacing: 0.5 }}>
              Equivale a
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: kgEquivalente > 0 ? accentColor : "#3d5568" }}>
              {kgEquivalente.toFixed(2)} kg
            </Text>
          </View>

          {/* Botón */}
          <TouchableOpacity
            onPress={empaquetar}
            style={{
              backgroundColor: "#e8a020",
              paddingVertical: 17,
              borderRadius: 14,
              alignItems: "center",
              shadowColor: "#e8a020",
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 6,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 15, letterSpacing: 0.8 }}>
              Empaquetar
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