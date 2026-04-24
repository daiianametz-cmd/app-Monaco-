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

    // 🔥 USUARIOS INICIALES
    await db.execAsync(`
      INSERT OR IGNORE INTO usuarios (usuario, password, rol)
      VALUES 
      ('daiana', '2401', 'admin'),
      ('micaela', '1983', 'operaciones'),
      ('brian', '1424', 'ventas'),
      ('francisco', '8154', 'ventas'),
      ('tomas', '2412', 'admin');
    `);

    // 📦 INSUMOS
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

    // 🆕 MOVIMIENTOS
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT,
        descripcion TEXT,
        fecha TEXT,
        usuario TEXT,
        unidad TEXT
      );
    `);

    // 🔧 MIGRACIÓN SEGURA (usuario)
    try {
      await db.execAsync(`
        ALTER TABLE movimientos ADD COLUMN usuario TEXT;
      `);
      console.log("✅ Columna usuario agregada");
    } catch (e) {
      console.log("ℹ️ usuario ya existe");
    }

    // 🔧 MIGRACIÓN NUEVA (unidad)
    try {
      await db.execAsync(`
        ALTER TABLE movimientos ADD COLUMN unidad TEXT;
      `);
      console.log("✅ Columna unidad agregada");
    } catch (e) {
      console.log("ℹ️ unidad ya existe");
    }

    console.log("✅ DB lista");
  } catch (error) {
    console.log("❌ Error initDB:", error);
  }
};