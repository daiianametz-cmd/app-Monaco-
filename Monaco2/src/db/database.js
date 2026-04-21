import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("app.db");

export const initDB = async () => {
  try {
    console.log("🧠 INIT DB");

    // =====================================
    // 👤 USUARIOS
    // =====================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE,
        password TEXT,
        rol TEXT,
        nombre TEXT,
        foto TEXT
      );
    `);

    // MIGRACIONES SEGURAS
    await safeAlter(`ALTER TABLE usuarios ADD COLUMN nombre TEXT;`);
    await safeAlter(`ALTER TABLE usuarios ADD COLUMN foto TEXT;`);

    // DATOS INICIALES
    const users = await db.getAllAsync(`SELECT * FROM usuarios`);
    if (users.length === 0) {
      await db.execAsync(`
        INSERT INTO usuarios (usuario, password, rol, nombre) VALUES
        ('daiana', '2401', 'admin', 'Daiana'),
        ('micaela', '1983', 'operaciones', 'Micaela'),
        ('brian', '1424', 'ventas', 'Brian'),
        ('francisco', '8154', 'ventas', 'Francisco');
      `);
    }

    // =====================================
    // 🧠 SESSION (ajuste: AUTOINCREMENT)
    // =====================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        usuario TEXT,
        rol TEXT
      );
    `);

    await safeAlter(`ALTER TABLE session ADD COLUMN user_id INTEGER;`);

    // =====================================
    // 🧾 INSUMOS
    // =====================================
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

    // =====================================
    // 🏭 PRODUCCION
    // =====================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS produccion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        producto TEXT,
        cantidad REAL,
        usuario TEXT
      );
    `);

    await safeAlter(`ALTER TABLE produccion ADD COLUMN usuario TEXT;`);

    // =====================================
    // 📦 STOCK
    // =====================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stock_hamburguesas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT UNIQUE,
        sin_empaquetar REAL DEFAULT 0,
        empaquetado REAL DEFAULT 0
      );
    `);

    // =====================================
    // 📦 EMPAQUETADO
    // =====================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS empaquetado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        tipo TEXT,
        paquetes INTEGER,
        kg REAL,
        usuario TEXT
      );
    `);

    await safeAlter(`ALTER TABLE empaquetado ADD COLUMN usuario TEXT;`);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS produccion_detalle (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          produccion_id INTEGER,
          insumo TEXT,
          cantidad REAL,
          unidad TEXT
        );
      `);

    // =====================================
    // 💰 VENTAS
    // =====================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        tipo TEXT,
        kg REAL,
        usuario TEXT
      );
    `);

    await safeAlter(`ALTER TABLE ventas ADD COLUMN usuario TEXT;`);

    console.log("✅ DB LISTA PRO 🔥 (sin errores de migración)");
  } catch (e) {
    console.log("❌ ERROR INIT DB:", e);
  }
};

// =====================================
// 🛠️ HELPER MIGRACIONES
// =====================================
const safeAlter = async (query) => {
  try {
    await db.execAsync(query);
  } catch (e) {
    // Ignora si la columna ya existe
  }
};
