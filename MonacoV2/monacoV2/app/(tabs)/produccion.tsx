import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function ProduccionScreen() {
  const [total, setTotal] = useState("");
  const [hueso, setHueso] = useState("");
  const [carne, setCarne] = useState("");

  const handleAceptar = () => {
    // Acá podés guardar los datos o enviarlos a tu backend
    console.log("Total:", total, "kg");
    console.log("Hueso:", hueso, "kg");
    console.log("Carne:", carne, "kg");
    alert(`Guardado:\nTotal: ${total} kg\nHueso: ${hueso} kg\nCarne: ${carne} kg`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Producción</Text>

      <Text>Total de pollo (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={total}
        onChangeText={setTotal}
        placeholder="Ej: 10"
      />

      <Text>Kilos de hueso</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={hueso}
        onChangeText={setHueso}
        placeholder="Ej: 3"
      />

      <Text>Kilos de carne</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={carne}
        onChangeText={setCarne}
        placeholder="Ej: 7"
      />

      <Button title="Aceptar" onPress={handleAceptar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});
