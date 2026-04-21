import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../src/context/AuthContext";
import { db } from "../../src/db/database";

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

    if (role !== "admin" && role !== "operaciones") {
      router.replace("/(tabs)/ventas");
    }
  }, [role]);

  const normalizarTipo = (t) => t?.trim().toLowerCase();

  const cargarStock = async () => {
    if (!tipo) {
      setStock(0);
      setStockEmpaquetado(0);
      return;
    }

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

  useEffect(() => {
    cargarStock();
  }, [tipo]);

  const calcularKg = () => {
    const num = Number(String(paquetes).replace(",", "."));
    if (!num) return 0;
    return num * FACTOR_KG;
  };

  const mostrarMensaje = (texto, color = "#2ecc71") => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 2000);
  };

  const empaquetar = async () => {
    const kg = calcularKg();
    const tipoNormalizado = normalizarTipo(tipo);

    if (!tipoNormalizado) return mostrarMensaje("Seleccioná un tipo", "#e74c3c");
    if (!kg || kg <= 0) return mostrarMensaje("Cantidad inválida", "#e74c3c");

    try {
      const result = await db.runAsync(
        `UPDATE stock_hamburguesas
         SET 
           sin_empaquetar = sin_empaquetar - ?,
           empaquetado = empaquetado + ?
         WHERE tipo = ?
         AND sin_empaquetar >= ?`,
        [kg, kg, tipoNormalizado, kg]
      );

      if (result.changes === 0) {
        return mostrarMensaje("Stock insuficiente", "#e74c3c");
      }

      await db.runAsync(
        `INSERT INTO empaquetado (fecha, tipo, paquetes, kg, usuario)
         VALUES (?, ?, ?, ?, ?)`,
        [new Date().toISOString(), tipoNormalizado, Number(paquetes), kg, user]
      );

      mostrarMensaje("Empaquetado OK ✅");

      setPaquetes("");
      await cargarStock();

    } catch (e) {
      console.log("❌ Error:", e);
      mostrarMensaje("Error inesperado", "#e74c3c");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>

          <View style={{ marginTop: 10 }}>

            <Text style={{
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 20,
              color: "#1c1c1e"
            }}>
              📦 Empaquetado
            </Text>

            {/* MENSAJE */}
            {mensaje !== "" && (
              <View style={{
                backgroundColor: "#fff",
                padding: 10,
                borderRadius: 10,
                marginBottom: 15,
                borderLeftWidth: 5,
                borderLeftColor: mensaje.includes("OK") ? "#2ecc71" : "#e74c3c"
              }}>
                <Text>{mensaje}</Text>
              </View>
            )}

            {/* SELECTOR */}
            <View style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              marginBottom: 15,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 4
            }}>
              <Picker selectedValue={tipo} onValueChange={setTipo}>
                <Picker.Item label="Seleccionar tipo" value="" />
                <Picker.Item label="🐔 Pollo" value="pollo" />
                <Picker.Item label="🥩 Carne" value="carne" />
                <Picker.Item label="🐟 Pescado" value="pescado" />
                <Picker.Item label="🌱 Soja" value="soja" />
                <Picker.Item label="🥬 Soja Espinaca" value="soja_espinaca" />
                <Picker.Item label="🎃 Soja Calabaza" value="soja_calabaza" />
              </Picker>
            </View>

            {/* STOCK */}
            <View style={{
              backgroundColor: "#fff",
              padding: 18,
              borderRadius: 16,
              marginBottom: 15,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 5
            }}>
              <Text style={{ color: "#7f8c8d" }}>Sin empaquetar</Text>
              <Text style={{ fontSize: 24, fontWeight: "700" }}>
                {Number(stock).toFixed(2)} kg
              </Text>

              <Text style={{ color: "#7f8c8d", marginTop: 10 }}>
                Ya empaquetado
              </Text>
              <Text style={{ fontSize: 20, color: "#27ae60" }}>
                {Number(stockEmpaquetado).toFixed(2)} kg
              </Text>
            </View>

            {/* INPUT */}
            <View style={{
              backgroundColor: "#fff",
              padding: 18,
              borderRadius: 16,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 4
            }}>
              <Text style={{ marginBottom: 5, color: "#555" }}>
                Cantidad de paquetes
              </Text>

              <TextInput
                value={paquetes}
                onChangeText={setPaquetes}
                keyboardType="numeric"
                placeholder="Ej: 10"
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16
                }}
              />

              <Text style={{ marginTop: 10, color: "#888" }}>
                Equivale a: {calcularKg().toFixed(2)} kg
              </Text>

              {/* BOTÓN PREMIUM */}
              <TouchableOpacity
                onPress={empaquetar}
                style={{
                  marginTop: 15,
                  backgroundColor: "#4da6ff",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  shadowColor: "#4da6ff",
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6
                }}
              >
                <Text style={{
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 16
                }}>
                  📦 Empaquetar
                </Text>
              </TouchableOpacity>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}