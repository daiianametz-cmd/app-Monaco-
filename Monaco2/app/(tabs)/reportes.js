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

export default function Reportes() {
  const { role } = useContext(AuthContext);

  const [tipo, setTipo] = useState("ventas");
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const [error, setError] = useState("");

  const [abiertos, setAbiertos] = useState({});
  const [detalles, setDetalles] = useState({});

  const tabs = [
    { label: "VENTAS", value: "ventas" },
    { label: "PRODUCCIÓN", value: "produccion" },
    { label: "EMPAQUETADO", value: "empaquetado" },
    { label: "INSUMOS", value: "insumos" },
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

  useEffect(() => {
    if (!role) return;
    if (role !== "admin") {
      router.replace("/(tabs)/ventas");
    }
  }, [role]);

  const formatearFecha = (f) => new Date(f).toLocaleString();

  const formatearMovimiento = (item) => {
    const cantidad = item.kg || item.cantidad || 0;
    const unidad = item.unidad;

    const agregarKg = tipo === "ventas" || tipo === "produccion" || tipo === "empaquetado";

    // 🔥 FIX PEDIDO: SIEMPRE KG EN ESOS 3 MODULOS
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

    setAbiertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    if (detalles[id]) return;

    try {
      const res = await db.getAllAsync(
        `SELECT insumo, cantidad, unidad 
         FROM produccion_detalle 
         WHERE produccion_id = ?`,
        [id]
      );

      setDetalles((prev) => ({
        ...prev,
        [id]: res,
      }));
    } catch (e) {
      console.log(e);
    }
  };

  const cargar = async () => {
    try {
      setError("");

      let res = [];

      if (tipo === "insumos") {
        res = await db.getAllAsync(
          `SELECT * FROM movimientos 
           WHERE tipo IN ('ALTA','BAJA','STOCK')
           ORDER BY fecha DESC`
        );
      } else {
        res = await db.getAllAsync(
          `SELECT * FROM ${tipo} ORDER BY fecha DESC`
        );
      }

      let filtrados = res;

      if (filtro !== "todos") {
        filtrados = res.filter((item) => {
          const valor = (item.tipo || item.producto || "")
            .toLowerCase()
            .replaceAll(" ", "_");

          if (filtro === "soja") return valor === "soja";
          return valor.includes(filtro);
        });
      }

      setData(filtrados);

      if (filtrados.length === 0) {
        setError("ℹ️ No hay datos para mostrar.");
      }
    } catch (err) {
      console.log(err);
      setError("❌ Error al cargar datos");
    }
  };

  useEffect(() => {
    cargar();
  }, [tipo, filtro]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  const total = data.reduce((acc, item) => {
    return acc + (item.kg || item.cantidad || 0);
  }, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 20 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700" }}>
          📊 Reportes
        </Text>

        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ marginTop: 15, gap: 10 }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            {tabs.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => {
                  setTipo(t.value);
                  setFiltro("todos");
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: tipo === t.value ? "#4da6ff" : "#e0e0e0",
                  minWidth: 110,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: tipo === t.value ? "#fff" : "#333" }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* FILTROS */}
        {tipo !== "insumos" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 15 }}
          >
            <View style={{ flexDirection: "row", gap: 10 }}>
              {tiposHamburguesa.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setFiltro(t.value)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor:
                      filtro === t.value ? "#4da6ff" : "#e0e0e0",
                  }}
                >
                  <Text style={{ color: filtro === t.value ? "#fff" : "#333" }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* TOTAL */}
        {tipo !== "insumos" && (
          <View
            style={{
              backgroundColor: "#fff",
              padding: 18,
              borderRadius: 15,
              marginTop: 20,
            }}
          >
            <Text style={{ color: "#888" }}>Total</Text>
            <Text style={{ fontSize: 22, fontWeight: "700" }}>
              {total.toFixed(2)} kg
            </Text>
          </View>
        )}

        {/* LISTA */}
        {data.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: "#fff",
              padding: 15,
              borderRadius: 15,
              marginTop: 12,
            }}
          >
            <Text>📅 {formatearFecha(item.fecha)}</Text>

            {tipo === "insumos" ? (
              <>
                <Text>🧾 {item.descripcion}</Text>
                <Text>👤 {item.usuario}</Text>
              </>
            ) : (
              <>
                <Text>🍔 {item.tipo || item.producto}</Text>
                <Text style={{ fontWeight: "600" }}>
                  ⚖️ {formatearMovimiento(item)}
                </Text>
                <Text>👤 {item.usuario}</Text>

                {tipo === "produccion" && (
                  <>
                    <TouchableOpacity
                      onPress={() => toggleDetalle(item.id)}
                      style={{
                        marginTop: 10,
                        backgroundColor: "#4da6ff",
                        paddingVertical: 5,
                        paddingHorizontal: 12,
                        borderRadius: 30,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                        Ver más
                      </Text>
                    </TouchableOpacity>

                    {abiertos[item.id] && detalles[item.id] && (
                      <View style={{ marginTop: 10 }}>
                        {detalles[item.id].map((d, i) => (
                          <Text key={i} style={{ fontSize: 13, color: "#555" }}>
                            • {d.insumo} - {d.cantidad} {d.unidad}
                          </Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}