import { db } from "./database";

export async function seedDatabase() {
  try {
    // 🔥 BORRA TODO (solo para debug)
    await db.execAsync("DELETE FROM insumos;");

    const items = [
      { nombre: "Bolsas", categoria: "empaquetado" },
      { nombre: "Etiqueta Pollo", categoria: "empaquetado" },
      { nombre: "Etiqueta Pescado", categoria: "empaquetado" },
      { nombre: "Cajas", categoria: "empaquetado" },
      { nombre: "Lavandina", categoria: "limpieza" },
      { nombre: "Detergente", categoria: "limpieza" },
    ];

    for (const item of items) {
      await db.runAsync(
        `INSERT INTO insumos (nombre, categoria, cantidad, unidad, stock_minimo)
         VALUES (?, ?, 0, 'unidades', 0)`,
        [item.nombre, item.categoria]
      );
    }

    console.log("🌱 Seed ejecutado con datos");
  } catch (e) {
    console.log("❌ Error en seed:", e);
  }
}
