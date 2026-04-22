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

export default function Ventas() {
  const { role } = useContext(AuthContext);

  const [tipo, setTipo] = useState("");
  const [kg, setKg] = useState("");
  const [stock, setStock] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔒 acceso
  useEffect(() => {
    if (!role) {
      router.replace("/login");
      return;
    }

    if (role !== "admin" && role !== "ventas") {
      router.replace("/(tabs)/produccion");
    }
  }, [role]);

  const normalizar = (t) => t?.trim().toLowerCase();

  // 📦 cargar stock
  const cargarStock = async () => {
    if (!tipo) {
      setStock(0);
      return;
    }

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

  useEffect(() => {
    cargarStock();
  }, [tipo]);

  const mostrarMensaje = (txt, color = "#2ecc71") => {
    setMensaje({ texto: txt, color });
    setTimeout(() => setMensaje(""), 2000);
  };

  // 💰 vender
  const vender = async () => {
    if (loading) return;

    const cantidad = Number(String(kg).replace(",", "."));
    const tipoNorm = normalizar(tipo);

    if (!tipoNorm)
      return mostrarMensaje("Seleccioná un tipo", "#e74c3c");

    if (!cantidad || cantidad <= 0)
      return mostrarMensaje("Kg inválidos", "#e74c3c");

    if (stock < cantidad)
      return mostrarMensaje(
        `Stock insuficiente (${stock.toFixed(2)} kg)`,
        "#e74c3c"
      );

    try {
      setLoading(true);

      const session = await db.getFirstAsync(
        `SELECT * FROM session LIMIT 1`
      );

      const usuario = session?.usuario || "desconocido";

      await db.runAsync(
        `UPDATE stock_hamburguesas
         SET empaquetado = empaquetado - ?
         WHERE tipo = ?`,
        [cantidad, tipoNorm]
      );

      await db.runAsync(
        `INSERT INTO ventas (fecha, tipo, kg, usuario)
         VALUES (?, ?, ?, ?)`,
        [new Date().toISOString(), tipoNorm, cantidad, usuario]
      );

      mostrarMensaje("Venta registrada ✅");

      setKg("");
      await cargarStock();

    } catch (e) {
      console.log("❌ Error venta:", e);
      mostrarMensaje("Error inesperado", "#e74c3c");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>

          <Text style={{
            fontSize: 28,
            fontWeight: "700",
            marginBottom: 15
          }}>
            💰 Ventas
          </Text>

          {/* MENSAJE */}
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

          {/* STOCK */}
          <View style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 15,
            marginBottom: 15,
            elevation: 4
          }}>
            <Text style={{ color: "#777" }}>
              Stock disponible
            </Text>
            <Text style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#27ae60"
            }}>
              {Number(stock).toFixed(2)} kg
            </Text>
          </View>

          {/* SELECTOR */}
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            marginBottom: 15,
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

          {/* INPUT KG */}
          <View style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 15,
            elevation: 4
          }}>
            <Text style={{ marginBottom: 5 }}>
              Kg a vender
            </Text>

            <TextInput
              value={kg}
              onChangeText={setKg}
              keyboardType="decimal-pad"
              placeholder="Ej: 5"
              style={{
                borderWidth: 1,
                borderColor: "#e0e0e0",
                borderRadius: 10,
                padding: 12
              }}
            />
          </View>

          {/* BOTÓN */}
          <TouchableOpacity
            onPress={vender}
            style={{
              marginTop: 20,
              backgroundColor: loading ? "#aaa" : "#4da6ff",
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: "center",
              elevation: 6
            }}
          >
            <Text style={{
              color: "#fff",
              fontWeight: "600",
              fontSize: 16
            }}>
              {loading ? "Guardando..." : "💰 Registrar venta"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
