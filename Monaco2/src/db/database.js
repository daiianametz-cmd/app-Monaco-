import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("app.db");

export const initDB = async () => {
  try {
    console.log("🧠 INIT DB");

    // 👤 USUARIOS
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE,
        password TEXT,
        rol TEXT
      );
    `);

    // 📦 INSUMOS (YA EXISTENTE, NO SE TOCA)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS insumos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        categoria TEXT,
        cantidad REAL,
        unidad TEXT,
        stock_minimo REAL
      );
    `);

    // 🆕 MOVIMIENTOS (AGREGADO PARA REPORTES)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT,
        descripcion TEXT,
        fecha TEXT
      );
    `);

    console.log("✅ DB lista");
  } catch (error) {
    console.log("❌ Error initDB:", error);
  }
};