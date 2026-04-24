import { Picker } from "@react-native-picker/picker";
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

const todos = (tipo) => [...(recetas[tipo] || []), ...condimentos];

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

const tipoLabels = {
  pollo: "Pollo",
  carne: "Carne",
  pescado: "Pescado",
  soja: "Soja",
  soja_espinaca: "Soja Espinaca",
  soja_calabaza: "Soja Calabaza",
};

const tipoColors = {
  pollo: "#e8a020",
  carne: "#ef4444",
  pescado: "#3b82f6",
  soja: "#10b981",
  soja_espinaca: "#22c55e",
  soja_calabaza: "#f97316",
};

export default function Produccion() {
  const { role, user } = useContext(AuthContext);

  const [tipo, setTipo] = useState("");
  const [valores, setValores] = useState({});
  const [kgFinal, setKgFinal] = useState(0);
  const [editandoKg, setEditandoKg] = useState(false);

  const [toast, setToast] = useState("");
  const [toastOk, setToastOk] = useState(false);
  const [errorStockMsg, setErrorStockMsg] = useState("");
  const [faltantes, setFaltantes] = useState([]);

  const setValor = (key, value) => {
    setValores((prev) => ({ ...prev, [key]: value }));
  };

  const showToast = (msg, ok = false) => {
    setToast(msg);
    setToastOk(ok);
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
      if (valor === undefined || valor === "") falt.push(item);
    }
    setFaltantes(falt);
    if (falt.length) return `Completá ${falt[0]}`;
    return null;
  };

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
        `INSERT INTO produccion (fecha, producto, cantidad, usuario) VALUES (?, ?, ?, ?)`,
        [new Date().toISOString(), tipo, kgFinal, user]
      );
      const idProduccion = res.lastInsertRowId;

      for (let item of todos(tipo)) {
        await db.runAsync(
          `INSERT INTO produccion_detalle (produccion_id, insumo, cantidad, unidad) VALUES (?, ?, ?, ?)`,
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

      showToast("Producción guardada ✅", true);
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
  const accentColor = tipoColors[tipo] || "#e8a020";

  // Separar insumos principales de condimentos
  const principalesCount = recetas[tipo]?.length || 0;

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
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                height: 4,
                width: 40,
                backgroundColor: "#e8a020",
                borderRadius: 2,
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                color: "#f0f4f8",
                letterSpacing: 0.3,
              }}
            >
              Producción
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#5a7a94",
                letterSpacing: 1.4,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Registro de lote
            </Text>
          </View>

          {/* Picker de tipo */}
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
            Tipo de producto
          </Text>
          <View
            style={{
              backgroundColor: "#1c2b3a",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tipo ? accentColor + "66" : "#2a3f52",
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            <Picker
              selectedValue={tipo}
              onValueChange={setTipo}
              style={{ color: "#f0f4f8" }}
              dropdownIconColor="#5a7a94"
            >
              <Picker.Item
                label="Seleccionar tipo"
                value=""
                color="#3d5568"
              />
              <Picker.Item label="Pollo" value="pollo" color="#0f1923" />
              <Picker.Item label="Carne" value="carne" color="#0f1923" />
              <Picker.Item label="Pescado" value="pescado" color="#0f1923" />
              <Picker.Item label="Soja" value="soja" color="#0f1923" />
              <Picker.Item
                label="Soja Espinaca"
                value="soja_espinaca"
                color="#0f1923"
              />
              <Picker.Item
                label="Soja Calabaza"
                value="soja_calabaza"
                color="#0f1923"
              />
            </Picker>
          </View>

          {/* Badge tipo seleccionado */}
          {tipo !== "" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: accentColor,
                }}
              />
              <Text
                style={{
                  color: accentColor,
                  fontWeight: "700",
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}
              >
                {tipoLabels[tipo]?.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Insumos principales */}
          {tipo !== "" && principalesCount > 0 && (
            <>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#5a7a94",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Insumos principales
              </Text>
              {lista.slice(0, principalesCount).map((item) => (
                <InsumoInput
                  key={item}
                  item={item}
                  unidad={unidad[item]}
                  valor={valores[item]}
                  onChange={(v) => setValor(item, v)}
                  error={faltantes.includes(item)}
                  accentColor={accentColor}
                />
              ))}
            </>
          )}

          {/* Condimentos */}
          {tipo !== "" && (
            <>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#5a7a94",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginTop: 8,
                  marginBottom: 10,
                }}
              >
                Condimentos
              </Text>
              {lista.slice(principalesCount).map((item) => (
                <InsumoInput
                  key={item}
                  item={item}
                  unidad={unidad[item]}
                  valor={valores[item]}
                  onChange={(v) => setValor(item, v)}
                  error={faltantes.includes(item)}
                  accentColor="#5a7a94"
                />
              ))}
            </>
          )}

          {/* Kg finales */}
          {tipo !== "" && (
            <View
              style={{
                backgroundColor: "#1c2b3a",
                borderRadius: 14,
                padding: 20,
                marginTop: 8,
                borderWidth: 1,
                borderColor: accentColor + "44",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#5a7a94",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Kg finales
                </Text>
                <TextInput
                  value={String(kgFinal)}
                  onChangeText={(v) => {
                    setEditandoKg(true);
                    setKgFinal(Number(String(v).replace(",", ".")));
                  }}
                  onBlur={() => setEditandoKg(false)}
                  keyboardType="decimal-pad"
                  style={{
                    fontSize: 32,
                    fontWeight: "800",
                    color: accentColor,
                    letterSpacing: 0.5,
                    minWidth: 100,
                  }}
                />
              </View>
              <Text style={{ fontSize: 16, color: "#2a3f52", fontWeight: "600" }}>
                kg
              </Text>
            </View>
          )}

          {/* Botón guardar */}
          <TouchableOpacity
            onPress={guardar}
            style={{
              marginTop: 24,
              backgroundColor: "#e8a020",
              paddingVertical: 16,
              borderRadius: 12,
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
              Guardar producción
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Toast */}
        {toast !== "" && (
          <View
            style={{
              position: "absolute",
              bottom: 100,
              left: 20,
              right: 20,
              backgroundColor: toastOk ? "#10b98122" : "#ef444422",
              borderWidth: 1,
              borderColor: toastOk ? "#10b981" : "#ef4444",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              zIndex: 999,
            }}
          >
            <Text
              style={{
                color: toastOk ? "#10b981" : "#ef4444",
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              {toast}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Componente auxiliar para cada insumo
function InsumoInput({ item, unidad, valor, onChange, error, accentColor }) {
  return (
    <View
      style={{
        backgroundColor: "#1c2b3a",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: error ? "#ef4444" : "#2a3f52",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: error ? "#ef4444" : "#f0f4f8",
            marginBottom: 6,
          }}
        >
          {item}
        </Text>
        <TextInput
          keyboardType="decimal-pad"
          value={valor || ""}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor="#3d5568"
          style={{
            backgroundColor: "#0f1923",
            borderWidth: 1,
            borderColor: error ? "#ef444466" : "#2a3f52",
            borderRadius: 8,
            padding: 10,
            color: "#f0f4f8",
            fontSize: 15,
            fontWeight: "600",
          }}
        />
      </View>
      <View
        style={{
          marginLeft: 12,
          backgroundColor: accentColor + "22",
          borderRadius: 8,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderWidth: 1,
          borderColor: accentColor + "44",
        }}
      >
        <Text
          style={{
            color: accentColor,
            fontWeight: "700",
            fontSize: 12,
            letterSpacing: 0.5,
          }}
        >
          {unidad}
        </Text>
      </View>
    </View>
  );
}