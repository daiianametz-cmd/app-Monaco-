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

      const res = await db.getAllAsync(
        `SELECT * FROM ${tipo} ORDER BY fecha DESC`
      );

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
        <View style={{ flexDirection: "row", marginTop: 15, gap: 10 }}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => {
                setTipo(t.value);
                setFiltro("todos");
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: tipo === t.value ? "#4da6ff" : "#e0e0e0",
              }}
            >
              <Text style={{ color: tipo === t.value ? "#fff" : "#333" }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔥 NUEVO: FILTRO POR TIPO HAMBURGUESA */}
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

        {/* TOTAL */}
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

        {/* LISTA */}
        {data.map((item) => {
          const abierto = abiertos[item.id];

          return (
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
              <Text>🍔 {item.tipo || item.producto}</Text>

              <Text style={{ fontWeight: "600" }}>
                ⚖️ {(item.kg || item.cantidad)} kg
              </Text>

              <Text>👤 {item.usuario}</Text>

              {tipo === "produccion" && (
                <>
                  <TouchableOpacity
                    onPress={() => toggleDetalle(item.id)}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#4da6ff",
                      padding: 8,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ color: "#fff" }}>
                      {abierto ? "Cerrar detalle" : "Ver detalle"}
                    </Text>
                  </TouchableOpacity>

                  {abierto && (
                    <View style={{ marginTop: 10 }}>
                      {detalles[item.id]?.map((d, i) => (
                        <Text key={i}>
                          🧂 {d.insumo}: {d.cantidad} {d.unidad}
                        </Text>
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