import { Picker } from "@react-native-picker/picker";
import { useContext, useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../src/context/AuthContext";
import { db } from "../../src/db/database";

// =========================
// 🧠 RECETAS
// =========================
const recetas = {
  pollo: ["Pollo", "Hueso", "Carne de pollo"],
  carne: ["Carne"],
  pescado: ["Pescado"],
  soja: ["Soja"],
  soja_espinaca: ["Soja", "Espinaca", "Colorante verde"],
  soja_calabaza: ["Soja", "Calabaza", "Colorante naranja"],
};

const condimentos = ["Pan rallado", "Agua", "Sal", "Ajo", "Glutamato"];

const unidad = {
  Pollo: "kg",
  Carne: "kg",
  Pescado: "kg",
  Soja: "kg",
  Espinaca: "unidad",
  Calabaza: "kg",
  Hueso: "kg",
  "Carne de pollo": "kg",
  "Pan rallado": "kg",
  Agua: "ml",
  Sal: "g",
  Ajo: "g",
  Glutamato: "g",
  "Colorante verde": "g",
  "Colorante naranja": "g",
};

// 🔥 LISTA GENERAL
const todos = (tipo) => [...(recetas[tipo] || []), ...condimentos];

// 🔥 MAPEO CLAVE (IMPORTANTE)
const mapInsumoReal = (item) => {
  if (item === "Carne de pollo" || item === "Hueso") return "Pollo";
  return item;
};

const convertir = (valor, unidadItem) => {
  if (!valor) return 0;
  const num = Number(String(valor).replace(",", "."));
  if (!num) return 0;

  if (unidadItem === "kg") return num * 1000;
  if (unidadItem === "g") return num;
  if (unidadItem === "ml") return num;
  if (unidadItem === "unidad") return num * 500;

  return 0;
};

const convertirStock = (valor, unidadItem) => {
  const num = Number(String(valor).replace(",", "."));
  if (!num) return 0;

  if (unidadItem === "kg") return num * 1000;
  if (unidadItem === "g") return num;
  if (unidadItem === "ml") return num;
  if (unidadItem === "unidad") return num;

  return 0;
};

export default function Produccion() {
  const { role, user } = useContext(AuthContext);

  const [tipo, setTipo] = useState("");
  const [valores, setValores] = useState({});
  const [kgFinal, setKgFinal] = useState(0);
  const [editandoKg, setEditandoKg] = useState(false);

  const [toast, setToast] = useState("");
  const [errorStockMsg, setErrorStockMsg] = useState("");
  const [faltantes, setFaltantes] = useState([]);

  const setValor = (key, value) => {
    setValores((prev) => ({ ...prev, [key]: value }));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const calcularKgTotal = () => {
    let totalGramos = 0;

    for (let item of todos(tipo)) {
      totalGramos += convertir(valores[item], unidad[item]);
    }

    return totalGramos / 1000;
  };

  useEffect(() => {
    if (!editandoKg) {
      setKgFinal(Number(calcularKgTotal().toFixed(2)));
    }
  }, [valores, tipo]);

  const verificarCampos = () => {
    let falt = [];

    for (let item of todos(tipo)) {
      const valor = valores[item];

      if (valor === undefined || valor === "") {
        falt.push(item);
      }
    }

    setFaltantes(falt);

    if (falt.length) return `Completá ${falt[0]}`;
    return null;
  };

  // 🔥 FIX PRINCIPAL ACÁ
  const verificarStock = async () => {
    for (let item of todos(tipo)) {

      const insumoReal = mapInsumoReal(item);

      const usado = convertirStock(valores[item], unidad[item]);
      if (!usado) continue;

      const ins = await db.getFirstAsync(
        "SELECT * FROM insumos WHERE nombre = ?",
        [insumoReal]
      );

      if (!ins) return `No existe ${insumoReal} en stock`;
      if (ins.cantidad < usado) return `Falta ${item}`;
    }
    return null;
  };

  // 🔥 FIX DESCUENTO
  const descontar = async (nombre, valor, unidadItem) => {

    const insumoReal = mapInsumoReal(nombre);

    const cantidad = convertirStock(valor, unidadItem);
    if (!cantidad) return;

    const ins = await db.getFirstAsync(
      "SELECT * FROM insumos WHERE nombre = ?",
      [insumoReal]
    );

    if (!ins) return;

    await db.runAsync(
      `UPDATE insumos 
       SET cantidad = CASE 
         WHEN cantidad - ? < 0 THEN 0 
         ELSE cantidad - ? 
       END
       WHERE id = ?`,
      [cantidad, cantidad, ins.id]
    );
  };

  const guardar = async () => {
    setErrorStockMsg("");

    if (!tipo) return showToast("Seleccioná un tipo");
    if (!kgFinal || kgFinal <= 0) return showToast("Kg inválidos");

    const errorCampos = verificarCampos();
    if (errorCampos) {
      setErrorStockMsg(errorCampos);
      showToast(errorCampos);
      return;
    }

    const errorStock = await verificarStock();
    if (errorStock) {
      setErrorStockMsg(errorStock);
      showToast(errorStock);
      return;
    }

    try {
      const res = await db.runAsync(
        `INSERT INTO produccion (fecha, producto, cantidad, usuario)
         VALUES (?, ?, ?, ?)`,
        [new Date().toISOString(), tipo, kgFinal, user]
      );

      const idProduccion = res.lastInsertRowId;

      for (let item of todos(tipo)) {
        await db.runAsync(
          `INSERT INTO produccion_detalle (produccion_id, insumo, cantidad, unidad)
           VALUES (?, ?, ?, ?)`,
          [idProduccion, item, valores[item], unidad[item]]
        );
      }

      for (let item of todos(tipo)) {
        await descontar(item, valores[item], unidad[item]);
      }

      await db.runAsync(
        `INSERT INTO stock_hamburguesas (tipo, sin_empaquetar, empaquetado)
         VALUES (?, ?, 0)
         ON CONFLICT(tipo) DO UPDATE SET
         sin_empaquetar = sin_empaquetar + excluded.sin_empaquetar`,
        [tipo, kgFinal]
      );

      showToast("Producción guardada ✅");

      setValores({});
      setTipo("");
      setKgFinal(0);
      setEditandoKg(false);
      setFaltantes([]);

    } catch (e) {
      console.log(e);
      showToast("Error inesperado");
    }
  };

  const lista = todos(tipo);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>

          <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 15 }}>
            🏭 Producción
          </Text>

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

          {lista.map((item) => (
            <View key={item} style={{
              backgroundColor: "#fff",
              padding: 12,
              borderRadius: 12,
              marginBottom: 10,
              borderWidth: faltantes.includes(item) ? 1 : 0,
              borderColor: "red"
            }}>
              <Text style={{ marginBottom: 5 }}>
                {item} ({unidad[item]})
              </Text>

              <TextInput
                keyboardType="decimal-pad"
                value={valores[item] || ""}
                onChangeText={(v) => setValor(item, v)}
                placeholder="0"
                style={{
                  borderWidth: 1,
                  borderColor: "#e0e0e0",
                  borderRadius: 10,
                  padding: 10
                }}
              />
            </View>
          ))}

          <View style={{
            backgroundColor: "#fff",
            padding: 15,
            borderRadius: 15,
            marginTop: 10
          }}>
            <Text style={{ color: "#777" }}>Kg finales</Text>

            <TextInput
              value={String(kgFinal)}
              onChangeText={(v) => {
                setEditandoKg(true);
                setKgFinal(Number(String(v).replace(",", ".")));
              }}
              onBlur={() => setEditandoKg(false)}
              keyboardType="decimal-pad"
              style={{
                fontSize: 24,
                fontWeight: "700",
                borderBottomWidth: 1,
                borderColor: "#ddd",
                paddingVertical: 5
              }}
            />
          </View>

          {toast !== "" && (
            <View style={{
              position: "absolute",
              bottom: 120,
              left: 20,
              right: 20,
              backgroundColor: "#333",
              padding: 12,
              borderRadius: 12,
              alignItems: "center",
              zIndex: 999
            }}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {toast}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={guardar}
            style={{
              marginTop: 20,
              backgroundColor: "#4da6ff",
              paddingVertical: 15,
              borderRadius: 12,
              alignItems: "center",
              elevation: 6
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              💾 Guardar producción
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
