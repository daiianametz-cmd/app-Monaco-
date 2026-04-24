import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../src/context/AuthContext";
import { db } from "../../src/db/database";

const tabs = [
  { label: "Ventas", value: "ventas" },
  { label: "Producción", value: "produccion" },
  { label: "Empaquetado", value: "empaquetado" },
  { label: "Insumos", value: "insumos" },
];

const tiposHamburguesa = [
  { label: "Todos", value: "todos" },
  { label: "Pollo", value: "pollo" },
  { label: "Carne", value: "carne" },
  { label: "Pescado", value: "pescado" },
  { label: "Soja", value: "soja" },
  { label: "Soja Espinaca", value: "soja_espinaca" },
  { label: "Soja Calabaza", value: "soja_calabaza" },
];

const tipoColors = {
  pollo: "#e8a020",
  carne: "#ef4444",
  pescado: "#3b82f6",
  soja: "#10b981",
  soja_espinaca: "#22c55e",
  soja_calabaza: "#f97316",
};

export default function Reportes() {
  const { role } = useContext(AuthContext);

  const [tipo, setTipo] = useState("ventas");
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [error, setError] = useState("");
  const [abiertos, setAbiertos] = useState({});
  const [detalles, setDetalles] = useState({});

  useEffect(() => {
    if (!role) return;
    if (role !== "admin") router.replace("/(tabs)/ventas");
  }, [role]);

  const formatearFecha = (f) => new Date(f).toLocaleString();

  const formatearMovimiento = (item) => {
    const cantidad = item.kg || item.cantidad || 0;
    const unidad = item.unidad;
    const agregarKg = tipo === "ventas" || tipo === "produccion" || tipo === "empaquetado";
    if (!unidad && agregarKg) return `${cantidad} kg`;
    if (unidad === "kg") return `${(cantidad / 1000).toFixed(2)} kg`;
    if (unidad === "g") return `${cantidad} g`;
    if (unidad === "ml") return `${cantidad} ml`;
    if (unidad === "litro") return `${(cantidad / 1000).toFixed(2)} lt`;
    if (unidad === "atado") return `${cantidad} atado${cantidad === 1 ? "" : "s"}`;
    return agregarKg ? `${cantidad} kg` : `${cantidad} ${unidad || ""}`;
  };

  const toggleDetalle = async (id) => {
    if (tipo !== "produccion") return;
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
    if (detalles[id]) return;
    try {
      const res = await db.getAllAsync(
        `SELECT insumo, cantidad, unidad FROM produccion_detalle WHERE produccion_id = ?`,
        [id]
      );
      setDetalles((prev) => ({ ...prev, [id]: res }));
    } catch (e) { console.log(e); }
  };

  const cargar = async () => {
    try {
      setError("");
      let res = [];
      if (tipo === "insumos") {
        res = await db.getAllAsync(
          `SELECT * FROM movimientos WHERE tipo IN ('ALTA','BAJA','STOCK') ORDER BY fecha DESC`
        );
      } else {
        res = await db.getAllAsync(`SELECT * FROM ${tipo} ORDER BY fecha DESC`);
      }
      let filtrados = res;
      if (filtro !== "todos") {
        filtrados = res.filter((item) => {
          const valor = (item.tipo || item.producto || "").toLowerCase().replaceAll(" ", "_");
          if (filtro === "soja") return valor === "soja";
          return valor.includes(filtro);
        });
      }
      setData(filtrados);
      if (filtrados.length === 0) setError("No hay datos para mostrar.");
    } catch (err) {
      console.log(err);
      setError("Error al cargar datos");
    }
  };

  useEffect(() => { cargar(); }, [tipo, filtro]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  const total = data.reduce((acc, item) => acc + (item.kg || item.cantidad || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1923" }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e8a020" />}
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ height: 4, width: 40, backgroundColor: "#e8a020", borderRadius: 2, marginBottom: 16 }} />
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#f0f4f8", letterSpacing: 0.3 }}>
            Reportes
          </Text>
          <Text style={{ fontSize: 12, color: "#5a7a94", letterSpacing: 1.4, textTransform: "uppercase", marginTop: 4 }}>
            Historial de actividad
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => { setTipo(t.value); setFiltro("todos"); }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  backgroundColor: tipo === t.value ? "#e8a020" : "#1c2b3a",
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: tipo === t.value ? "#0f1923" : "#5a7a94",
                  fontWeight: "700",
                  fontSize: 12,
                  letterSpacing: 0.8,
                }}>
                  {t.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Filtros por tipo */}
        {tipo !== "insumos" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {tiposHamburguesa.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setFiltro(t.value)}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 8,
                    backgroundColor: filtro === t.value
                      ? (tipoColors[t.value] || "#e8a020") + "33"
                      : "#1c2b3a",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    color: filtro === t.value ? (tipoColors[t.value] || "#e8a020") : "#5a7a94",
                    fontWeight: "600",
                    fontSize: 12,
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Card total */}
        {tipo !== "insumos" && (
          <View style={{
            backgroundColor: "#1c2b3a",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#5a7a94", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                Total · {data.length} registros
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "800", color: "#e8a020", letterSpacing: -0.5 }}>
                {total.toFixed(2)}
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#5a7a94" }}> kg</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Error / vacío */}
        {!!error && (
          <View style={{ backgroundColor: "#1c2b3a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "#5a7a94", fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {/* Lista */}
        {data.map((item) => {
          const itemTipo = (item.tipo || item.producto || "").toLowerCase().replaceAll(" ", "_");
          const itemColor = tipoColors[itemTipo] || "#5a7a94";

          return (
            <View key={item.id} style={{
              backgroundColor: "#1c2b3a",
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}>
              {/* Fila superior: fecha + cantidad */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: "#5a7a94" }}>
                  {formatearFecha(item.fecha)}
                </Text>
                {tipo !== "insumos" && (
                  <Text style={{ fontSize: 14, fontWeight: "800", color: itemColor }}>
                    {formatearMovimiento(item)}
                  </Text>
                )}
              </View>

              {tipo === "insumos" ? (
                <Text style={{ fontSize: 14, color: "#f0f4f8", fontWeight: "500", marginBottom: 4 }}>
                  {item.descripcion}
                </Text>
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#f0f4f8", marginBottom: 4, textTransform: "capitalize" }}>
                  {item.tipo || item.producto}
                </Text>
              )}

              <Text style={{ fontSize: 12, color: "#5a7a94" }}>
                {item.usuario}
              </Text>

              {/* Expandible producción */}
              {tipo === "produccion" && (
                <>
                  <TouchableOpacity
                    onPress={() => toggleDetalle(item.id)}
                    style={{
                      marginTop: 12,
                      backgroundColor: abiertos[item.id] ? "#e8a02022" : "#ffffff0a",
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: abiertos[item.id] ? "#e8a020" : "#5a7a94", fontWeight: "700", fontSize: 12, letterSpacing: 0.5 }}>
                      {abiertos[item.id] ? "Ocultar detalle" : "Ver detalle"}
                    </Text>
                  </TouchableOpacity>

                  {abiertos[item.id] && detalles[item.id] && (
                    <View style={{ marginTop: 12, gap: 6 }}>
                      {detalles[item.id].map((d, i) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 13, color: "#5a7a94" }}>{d.insumo}</Text>
                          <Text style={{ fontSize: 13, color: "#f0f4f8", fontWeight: "600" }}>
                            {d.cantidad} {d.unidad}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}