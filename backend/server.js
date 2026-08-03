const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// =====================================
// Configuración de CORS y Seguridad (Corregida para Render)
// =====================================
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cache-Control", "Pragma", "Expires"]
};

app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Middleware Anti-Cache Global
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.json());

// =====================================
// Configuración de Base de Datos (PostgreSQL)
// =====================================
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 5000,
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "banco_ceesuv",
        password: "2026",
        port: 5432
      }
);

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente inactivo de PostgreSQL', err);
});

// =====================================
// Funciones Auxiliares
// =====================================
const generarPinUnico = async () => {
  let pin;
  let existe = true;

  while (existe) {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
    // Verificamos que el PIN no exista en la tabla alumnos
    const res = await pool.query("SELECT id FROM alumnos WHERE pin = $1", [pin]);
    if (res.rowCount === 0) {
      existe = false;
    }
  }
  return pin;
};

const asegurarUsuarioAlumno = async (alumnoId, nombreCompleto) => {
  const partes = nombreCompleto.trim().split(/\s+/);
  const primerNombre = partes[0] ? partes[0].toLowerCase() : "alumno";
  const primerApellido = partes.length >= 2 ? partes[partes.length - 1].toLowerCase() : "";

  let usuarioBase = primerApellido ? `${primerNombre}.${primerApellido}${alumnoId}` : `${primerNombre}${alumnoId}`;
  const nombreMostrado = `${partes[0] || ""} ${partes[1] || ""}`.trim();

  const checkUser = await pool.query(
    "SELECT id, pin, estado FROM usuarios WHERE alumno_id = $1",
    [alumnoId]
  );

  if (checkUser.rows.length > 0) {
    await pool.query(
      "UPDATE usuarios SET nombre = $1, usuario = $2 WHERE alumno_id = $3",
      [nombreMostrado, usuarioBase, alumnoId]
    );
    return checkUser.rows[0].pin;
  }

  const pinNuevo = await generarPinUnico();

  await pool.query(
    `INSERT INTO usuarios (nombre, usuario, password, rol, estado, pin, alumno_id)
     VALUES ($1, $2, $3, 'Alumno', 'Activo', $4, $5)
     ON CONFLICT (usuario) DO UPDATE SET nombre = EXCLUDED.nombre`,
    [nombreMostrado, usuarioBase, pinNuevo, pinNuevo, alumnoId]
  );

  return pinNuevo;
};

// =====================================
// Inicialización automática de Tablas
// =====================================
const inicializarBaseDeDatos = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        rol VARCHAR(20) NOT NULL DEFAULT 'Admin',
        estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
        pin VARCHAR(10) UNIQUE,
        alumno_id INT UNIQUE,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS alumnos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        grado VARCHAR(50) NOT NULL,
        coins INT DEFAULT 0,
        coins_ahorro INT DEFAULT 0,
        token_qr VARCHAR(100) UNIQUE NOT NULL,
        limite_credito NUMERIC(10,2) DEFAULT 200.00,
        credito_utilizado NUMERIC(10,2) DEFAULT 0.00,
        estatus VARCHAR(20) DEFAULT 'Activo'
      );

      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY,
        alumno_id INT REFERENCES alumnos(id) ON DELETE CASCADE,
        tipo VARCHAR(30) NOT NULL,
        cantidad INT NOT NULL,
        motivo VARCHAR(255),
        usuario VARCHAR(50),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS coins_ahorro INT DEFAULT 0;
      ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(10,2) DEFAULT 200.00;
      ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS credito_utilizado NUMERIC(10,2) DEFAULT 0.00;
      ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS estatus VARCHAR(20) DEFAULT 'Activo';
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pin VARCHAR(10) UNIQUE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS alumno_id INT UNIQUE;
    `);

    await pool.query(`
      INSERT INTO usuarios (nombre, usuario, password, rol, estado)
      VALUES ('Administrador', 'admin', 'admin123', 'Admin', 'Activo')
      ON CONFLICT (usuario) 
      DO UPDATE SET password = 'admin123', estado = 'Activo';
    `);

    console.log("✅ Tablas inicializadas y usuario admin configurado correctamente.");
  } catch (err) {
    console.error("❌ Error al inicializar la base de datos:", err);
  }
};

inicializarBaseDeDatos();

// =====================================
// Rutas de la API
// =====================================

app.get(["/", "/api"], (req, res) => {
  return res.status(200).send("Servidor Banco Escolar CEESUV funcionando correctamente.");
});

// ==========================================
// RUTA EXPLICITA DE CAMBIO DE ESTATUS (SEGURA)
// ==========================================
app.put("/api/alumnos-cambiar-estatus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const nuevoValor = req.body.estatus || req.body.estado || "Activo";

    // 1. Obtenemos los datos del alumno para asegurar su nombre o identificación real
    const alumnoRes = await pool.query(`SELECT nombre FROM alumnos WHERE id = $1`, [id]);
    if (alumnoRes.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }
    const nombreAlumno = alumnoRes.rows[0].nombre;

    // 🛡️ PROTECCIÓN: Verificar si este alumno está vinculado a un usuario Administrador
    const verificarAdmin = await pool.query(
      `SELECT u.rol FROM usuarios u WHERE u.alumno_id = $1 OR u.nombre ILIKE $2`,
      [id, nombreAlumno]
    );

    if (verificarAdmin.rows.length > 0 && verificarAdmin.rows.some(u => u.rol === 'Admin')) {
      return res.status(403).json({ mensaje: "No se puede inactivar una cuenta de Administrador." });
    }

    // 2. Actualizamos unívocamente la tabla alumnos por su ID exacto
    const resultadoAlumno = await pool.query(
      `UPDATE alumnos SET estatus = $1 WHERE id = $2`,
      [nuevoValor, id]
    );

    // 3. Actualizamos la tabla usuarios exclusivamente usando 'alumno_id' o coincidencia exacta de nombre, NUNCA por ID cruzado
    try {
      await pool.query(
        `UPDATE usuarios SET estado = $1 WHERE alumno_id = $2 AND rol != 'Admin'`,
        [nuevoValor, id]
      );
    } catch (errUser) {
      console.log("Nota: No se pudo actualizar estado en tabla usuarios por ID de alumno.");
    }

    const alumnoCompletoRes = await pool.query(
      `SELECT 
        a.id, 
        a.nombre, 
        a.grado, 
        a.coins, 
        COALESCE(a.coins_ahorro, 0) AS coins_ahorro, 
        a.token_qr,
        COALESCE(a.estatus, 'Activo') AS estatus
       FROM alumnos a
       WHERE a.id = $1`,
      [id]
    );

    return res.status(200).json(alumnoCompletoRes.rows[0] || { success: true });

  } catch (error) {
    console.error("Error crítico al cambiar estado:", error);
    return res.status(500).json({ mensaje: "Error al cambiar el estado.", detalle: error.message });
  }
});

// Consulta pública vía Código QR (Padres)
app.get(["/consulta/:token", "/api/consulta/:token"], async (req, res) => {
  try {
    const { token } = req.params;

    const alumnoResult = await pool.query(
      "SELECT id, nombre, grado, coins, COALESCE(coins_ahorro, 0) AS coins_ahorro FROM alumnos WHERE token_qr = $1",
      [token]
    );

    if (alumnoResult.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Código QR no válido o alumno no encontrado."
      });
    }

    const alumno = alumnoResult.rows[0];

    const movimientosResult = await pool.query(
      `SELECT tipo, cantidad, motivo, fecha 
       FROM movimientos 
       WHERE alumno_id = $1 
       ORDER BY fecha DESC 
       LIMIT 10`,
      [alumno.id]
    );

    return res.status(200).json({
      alumno: alumno,
      movimientos: movimientosResult.rows
    });

  } catch (error) {
    console.error("Error al consultar por QR:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor al consultar QR."
    });
  }
});

// Dashboard del Alumno Individual
app.get(["/api/alumno-dashboard/:alumnoId", "/api/alumnos/:identifier", "/alumnos/:identifier"], async (req, res) => {
  try {
    const identifier = req.params.alumnoId || req.params.identifier;
    let alumnoRes;

    if (!isNaN(identifier)) {
      alumnoRes = await pool.query(
        "SELECT id, nombre, grado, coins, COALESCE(coins_ahorro, 0) AS coins_ahorro, COALESCE(limite_credito, 200.00) AS limite_credito, COALESCE(credito_utilizado, 0.00) AS credito_utilizado FROM alumnos WHERE id = $1",
        [parseInt(identifier, 10)]
      );
    } else {
      alumnoRes = await pool.query(
        `SELECT a.id, a.nombre, a.grado, a.coins, COALESCE(a.coins_ahorro, 0) AS coins_ahorro, COALESCE(a.limite_credito, 200.00) AS limite_credito, COALESCE(a.credito_utilizado, 0.00) AS credito_utilizado 
         FROM alumnos a
         JOIN usuarios u ON u.alumno_id = a.id
         WHERE LOWER(u.usuario) = LOWER($1)`,
        [identifier]
      );
    }

    if (!alumnoRes || alumnoRes.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }

    const alumno = alumnoRes.rows[0];

    const movsRes = await pool.query(
      `SELECT id, tipo, cantidad, motivo, fecha 
       FROM movimientos 
       WHERE alumno_id = $1 
       ORDER BY fecha DESC 
       LIMIT 15`,
      [alumno.id]
    );

    return res.status(200).json({
      ...alumno,
      alumno: alumno,
      movimientos: movsRes.rows
    });
  } catch (error) {
    console.error("Error al obtener dashboard del alumno:", error);
    return res.status(500).json({ mensaje: "Error al obtener datos del alumno." });
  }
});

// Obtener todos los alumnos
app.get(["/alumnos", "/api/alumnos"], async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT 
        a.id,
        a.nombre,
        a.grado,
        a.coins,
        COALESCE(a.coins_ahorro, 0) AS coins_ahorro,
        a.token_qr,
        a.pin,  -- <--- Cambiado de u.pin a a.pin directamente
        COALESCE(a.estatus, 'Activo') AS estatus
       FROM alumnos a
       ORDER BY a.id`
    );

    return res.status(200).json(resultado.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al obtener alumnos." });
  }
});

// Agregar alumno
app.post(["/alumnos", "/api/alumnos"], async (req, res) => {
  try {
    const { nombre, grado, coins, coins_ahorro, estatus } = req.body;
    const tokenGenerado = `ceesuv-${Date.now()}-${Math.floor(Math.random() * 899999 + 100000)}`;
    const pinGenerado = await generarPinUnico();

    const resultado = await pool.query(
      `INSERT INTO alumnos (nombre, grado, coins, coins_ahorro, token_qr, pin, estatus)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombre, grado, coins || 0, coins_ahorro || 0, tokenGenerado, pinGenerado, estatus || 'Activo']
    );

    return res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al guardar alumno." });
  }
});

// Sincronizar usuarios y PINs
app.post(["/alumnos/generar-usuarios", "/api/alumnos/generar-usuarios"], async (req, res) => {
  try {
    const alumnos = await pool.query("SELECT id, nombre FROM alumnos");
    let creados = 0;

    for (const alum of alumnos.rows) {
      await asegurarUsuarioAlumno(alum.id, alum.nombre);
      creados++;
    }

    return res.status(200).json({
      mensaje: `Sincronización completada. ${creados} usuarios/PINs actualizados.`
    });
  } catch (error) {
    console.error("Error al sincronizar usuarios de alumnos:", error);
    return res.status(500).json({ mensaje: "Error al generar usuarios para alumnos." });
  }
});

// Editar alumno
app.put(["/alumnos/:id", "/api/alumnos/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, grado, coins, coins_ahorro, estatus } = req.body;

    const resultado = await pool.query(
      `UPDATE alumnos
       SET nombre=$1,
           grado=$2,
           coins=$3,
           coins_ahorro=$4,
           estatus=$5
       WHERE id=$6
       RETURNING *`,
      [nombre, grado, coins, coins_ahorro || 0, estatus || 'Activo', id]
    );

    const alumnoEditado = resultado.rows[0];

    if (alumnoEditado) {
      await asegurarUsuarioAlumno(alumnoEditado.id, alumnoEditado.nombre);
    }

    return res.status(200).json(alumnoEditado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al editar alumno." });
  }
});

// Eliminar alumno
app.delete(["/alumnos/:id", "/api/alumnos/:id"], async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM usuarios WHERE alumno_id=$1", [id]);
    await pool.query("DELETE FROM alumnos WHERE id=$1", [id]);

    return res.status(200).json({
      mensaje: "Alumno y usuario asociados eliminados correctamente."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al eliminar alumno." });
  }
});

// Movimientos
app.get(["/movimientos", "/api/movimientos"], async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        m.id,
        a.nombre AS alumno,
        m.tipo,
        m.cantidad,
        m.motivo,
        m.fecha,
        m.usuario
      FROM movimientos m
      INNER JOIN alumnos a ON m.alumno_id = a.id
      LEFT JOIN usuarios u ON u.alumno_id = a.id
      WHERE COALESCE(u.estado, 'Activo') = 'Activo'
      ORDER BY m.fecha DESC
    `);

    return res.status(200).json(resultado.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al obtener movimientos." });
  }
});

app.post(["/movimientos", "/api/movimientos"], async (req, res) => {
  try {
    const { alumno_id, tipo, cantidad, motivo, usuario } = req.body;

    const alumnoQuery = await pool.query(
      "SELECT coins, COALESCE(coins_ahorro, 0) AS coins_ahorro FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumnoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }

    let coinsDisponibles = Number(alumnoQuery.rows[0].coins);
    let coinsAhorro = Number(alumnoQuery.rows[0].coins_ahorro);
    const monto = Number(cantidad);

    if (tipo === "ENTRADA") {
      coinsDisponibles += monto;
    } else if (tipo === "SALIDA") {
      if (coinsDisponibles < monto) {
        return res.status(400).json({ mensaje: "El alumno no tiene suficientes Coins disponibles." });
      }
      coinsDisponibles -= monto;
    } else if (tipo === "AHORRO_DEPOSITO") {
      if (coinsDisponibles < monto) {
        return res.status(400).json({ mensaje: "El alumno no tiene suficiente saldo disponible para ahorrar." });
      }
      coinsDisponibles -= monto;
      coinsAhorro += monto;
    } else if (tipo === "AHORRO_RETIRO") {
      if (coinsAhorro < monto) {
        return res.status(400).json({ mensaje: "El alumno no tiene suficiente saldo en ahorro." });
      }
      coinsAhorro -= monto;
      coinsDisponibles += monto;
    } else if (tipo === "AHORRO_RENDIMIENTO") {
      coinsAhorro += monto;
    }

    await pool.query(
      "UPDATE alumnos SET coins = $1, coins_ahorro = $2 WHERE id = $3",
      [coinsDisponibles, coinsAhorro, alumno_id]
    );

    await pool.query(
      `INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario)
       VALUES ($1, $2, $3, $4, $5)`,
      [alumno_id, tipo, monto, motivo || 'Movimiento de saldo', usuario || 'Sistema']
    );

    return res.status(200).json({
      mensaje: "Movimiento registrado correctamente.",
      coins: coinsDisponibles,
      coins_ahorro: coinsAhorro
    });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    return res.status(500).json({ mensaje: "Error al registrar movimiento." });
  }
});

// Dashboard General
app.get(["/dashboard", "/api/dashboard"], async (req, res) => {
  try {
    const alumnos = await pool.query(`
      SELECT COUNT(a.id) AS total 
      FROM alumnos a 
      WHERE COALESCE(a.estatus, 'Activo') = 'Activo'
    `);
    
    const coins = await pool.query(`
      SELECT COALESCE(SUM(a.coins),0) AS total 
      FROM alumnos a 
      WHERE COALESCE(a.estatus, 'Activo') = 'Activo'
    `);

    const coinsAhorro = await pool.query(`
      SELECT COALESCE(SUM(a.coins_ahorro),0) AS total 
      FROM alumnos a 
      WHERE COALESCE(a.estatus, 'Activo') = 'Activo'
    `);

    const movimientos = await pool.query(`
      SELECT COUNT(m.id) AS total 
      FROM movimientos m 
      JOIN alumnos a ON m.alumno_id = a.id 
      WHERE COALESCE(a.estatus, 'Activo') = 'Activo'
    `);

    return res.status(200).json({
      alumnos: Number(alumnos.rows[0].total),
      coins: Number(coins.rows[0].total),
      coins_ahorro: Number(coinsAhorro.rows[0].total),
      movimientos: Number(movimientos.rows[0].total)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al obtener estadísticas." });
  }
});

// Usuarios
app.get(["/usuarios", "/api/usuarios"], async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nombre, usuario, rol, estado, pin, alumno_id, fecha_registro FROM usuarios ORDER BY id`
    );
    return res.status(200).json(resultado.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al obtener usuarios." });
  }
});

app.post(["/usuarios", "/api/usuarios"], async (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, usuario, password, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, usuario, rol, estado`,
      [nombre, usuario, password, rol]
    );

    return res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al guardar usuario." });
  }
});

// Login
app.post(["/login", "/api/login"], async (req, res) => {
  try {
    const payload =
      req.body && typeof req.body.usuario === "object" && req.body.usuario !== null
        ? req.body.usuario
        : req.body;

    const uRaw = payload.usuario || (typeof req.body.usuario === "string" ? req.body.usuario : "");
    const pRaw =
      payload.password ||
      payload.contrasena ||
      payload.pass ||
      payload.pin ||
      req.body.password ||
      req.body.pin ||
      "";

    const userClean = String(uRaw).trim();
    const passClean = String(pRaw).trim();

    if (!passClean && !userClean) {
      return res.status(400).json({ mensaje: "Credenciales requeridas." });
    }

    // Si ingresan un PIN de 4 dígitos, buscamos directamente en la tabla ALUMNOS
    if (passClean.length === 4 && !isNaN(passClean)) {
      const resPin = await pool.query(
        `SELECT id, nombre, grado, coins, COALESCE(coins_ahorro, 0) as coins_ahorro, estatus
         FROM alumnos
         WHERE pin = $1 AND COALESCE(estatus, 'Activo') = 'Activo'`,
        [passClean]
      );

      if (resPin.rows.length > 0) {
        return res.status(200).json({
          ...resPin.rows[0],
          rol: "Alumno",
          loginTipo: "PIN"
        });
      }
    }

    // Si es usuario y contraseña tradicional, se busca en la tabla USUARIOS (Admin / Docente)
    const resultado = await pool.query(
      `SELECT id, nombre, usuario, password, rol, estado 
       FROM usuarios 
       WHERE LOWER(usuario) = LOWER($1)`,
      [userClean]
    );

    if (resultado.rows.length === 0 || resultado.rows[0].password !== passClean) {
      return res.status(401).json({ mensaje: "Usuario, contraseña o PIN incorrecto." });
    }

    const usuarioEncontrado = resultado.rows[0];

    if (usuarioEncontrado.estado && usuarioEncontrado.estado.toLowerCase() !== "activo") {
      return res.status(403).json({ mensaje: "El usuario se encuentra inactivo." });
    }

    delete usuarioEncontrado.password;
    return res.status(200).json(usuarioEncontrado);
  } catch (error) {
    console.error("Error al intentar iniciar sesión:", error);
    return res.status(500).json({
      mensaje: "Error al intentar iniciar sesión.",
      detalles: error.message
    });
  }
});

// Compras
app.post(["/api/compras", "/compras"], async (req, res) => {
  try {
    const { alumno_id, producto_nombre, costo, usuario } = req.body;

    const alumnoQuery = await pool.query(
      "SELECT coins, COALESCE(coins_ahorro, 0) AS coins_ahorro FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumnoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }

    let coinsDisponibles = Number(alumnoQuery.rows[0].coins);
    const precioProducto = Number(costo);

    if (coinsDisponibles < precioProducto) {
      return res.status(400).json({ mensaje: "Saldo insuficiente para realizar la compra." });
    }

    coinsDisponibles -= precioProducto;

    await pool.query(
      "UPDATE alumnos SET coins = $1 WHERE id = $2",
      [coinsDisponibles, alumno_id]
    );

    await pool.query(
      `INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario)
       VALUES ($1, $2, $3, $4, $5)`,
      [alumno_id, 'COMPRA', precioProducto, `Compra: ${producto_nombre}`, usuario || 'Tienda Escolar']
    );

    return res.status(200).json({
      mensaje: "¡Compra realizada con éxito!",
      coins: coinsDisponibles
    });

  } catch (error) {
    console.error("Error al procesar la compra:", error);
    return res.status(500).json({ mensaje: "Error interno al procesar la compra." });
  }
});

// Compras con Tarjeta de Crédito
app.post(["/api/comprar-credito", "/comprar-credito"], async (req, res) => {
  try {
    const { alumno_id, monto_compra, concepto } = req.body;

    const alumnoQuery = await pool.query(
      "SELECT id, nombre, limite_credito, credito_utilizado FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumnoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }

    const alumno = alumnoQuery.rows[0];
    const limite = Number(alumno.limite_credito || 200);
    const utilizado = Number(alumno.credito_utilizado || 0);
    const disponible = limite - utilizado;
    const monto = Number(monto_compra);

    if (monto > disponible) {
      return res.status(400).json({ 
        mensaje: `Crédito insuficiente. Límite disponible: $${disponible.toFixed(2)}` 
      });
    }

    const nuevoCreditoUtilizado = utilizado + monto;

    await pool.query(
      "UPDATE alumnos SET credito_utilizado = $1 WHERE id = $2",
      [nuevoCreditoUtilizado, alumno_id]
    );

    await pool.query(
      `INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario)
       VALUES ($1, $2, $3, $4, $5)`,
      [alumno_id, 'COMPRA_CREDITO', monto, concepto || 'Compra a crédito en Tienda Escolar', alumno.nombre]
    );

    return res.status(200).json({
      exito: true,
      mensaje: "¡Compra a crédito realizada con éxito!",
      nuevo_disponible: limite - nuevoCreditoUtilizado
    });

  } catch (error) {
    console.error("Error al procesar la compra a crédito:", error);
    return res.status(500).json({ mensaje: "Error interno al procesar el crédito." });
  }
});

// Pagar Crédito con Coins
app.post(["/api/pagar-credito", "/pagar-credito"], async (req, res) => {
  try {
    const { alumno_id, monto_pago, usuario } = req.body;

    const alumnoQuery = await pool.query(
      "SELECT id, nombre, coins, credito_utilizado FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumnoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }

    const alumno = alumnoQuery.rows[0];
    const coinsDisponibles = Number(alumno.coins || 0);
    const utilizado = Number(alumno.credito_utilizado || 0);
    const monto = Number(monto_pago);

    if (!monto || monto <= 0) {
      return res.status(400).json({ mensaje: "Cantidad de pago inválida." });
    }
    if (monto > utilizado) {
      return res.status(400).json({ mensaje: "El monto supera el crédito utilizado actual." });
    }
    if (monto > coinsDisponibles) {
      return res.status(400).json({ mensaje: "No tienes suficientes Coins disponibles." });
    }

    const nuevoCoins = coinsDisponibles - monto;
    const nuevoCreditoUtilizado = utilizado - monto;

    await pool.query(
      "UPDATE alumnos SET coins = $1, credito_utilizado = $2 WHERE id = $3",
      [nuevoCoins, nuevoCreditoUtilizado, alumno_id]
    );

    await pool.query(
      `INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario)
       VALUES ($1, $2, $3, $4, $5)`,
      [alumno_id, 'PAGO_CREDITO', monto, 'Pago de tarjeta de crédito con Coins', usuario || alumno.nombre]
    );

    return res.status(200).json({
      exito: true,
      mensaje: "¡Crédito pagado exitosamente con tus Coins!",
      coins: nuevoCoins,
      credito_utilizado: nuevoCreditoUtilizado
    });

  } catch (error) {
    console.error("Error al procesar el pago de crédito:", error);
    return res.status(500).json({ mensaje: "Error interno al procesar el pago de crédito." });
  }
});

// Actualizar usuario
app.put(["/usuarios/:id", "/api/usuarios/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, usuario, rol } = req.body;

    const resultado = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, usuario = $2, rol = $3 
       WHERE id = $4 
       RETURNING id, nombre, usuario, rol, estado`,
      [nombre, usuario, rol, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    return res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({ mensaje: "Error al actualizar el usuario." });
  }
});

// Análisis IA con Groq
const { Groq } = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post("/api/analisis-ia", async (req, res) => {
  try {
    const { datosAlumnos, resumenMovimientos } = req.body;

    const prompt = `
      Actúa como un analista de datos escolares experto para la institución "Centro de Estudios Elementales y Superiores de Valles (CEESUV)".
      Analiza la siguiente información de los alumnos y el banco escolar:
      
      - Datos de alumnos activos: ${JSON.stringify(datosAlumnos || [])}
      - Resumen de movimientos/ahorros: ${JSON.stringify(resumenMovimientos || {})}

      Por favor, genera un informe ejecutivo profesional, motivador y claro en español que incluya:
      1. Un resumen general del estado del banco escolar y comportamiento.
      2. Destacar los grados o áreas con mejor rendimiento o ahorro.
      3. Dos recomendaciones prácticas para los administradores o profesores para el próximo mes.

      Mantén un tono formal, educativo y directo.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const textoAnalisis = completion.choices[0]?.message?.content || "No se pudo generar el análisis.";

    res.json({ analisis: textoAnalisis });
  } catch (error) {
    console.error("Error al generar análisis con Groq:", error);
    res.status(500).json({ error: "No se pudo generar el análisis inteligente con Groq." });
  }
});

// Transferencia por Tarjeta
app.post(['/api/transferencias', '/api/transferir-por-tarjeta', '/transferir-por-tarjeta'], async (req, res) => {
    const { remitente_id, remitenteId, tarjeta_destino, numeroTarjetaDestino, cantidad, monto, concepto, referencia } = req.body;

    const idRemitente = remitente_id || remitenteId;
    const tarjetaDest = tarjeta_destino || numeroTarjetaDestino;
    const montoTransferir = cantidad || monto;

    const valCantidad = Number(montoTransferir);
    if (!valCantidad || valCantidad <= 0) {
        return res.status(400).json({ error: "El monto debe ser mayor a cero." });
    }

    const tarjetaLimpia = tarjetaDest ? tarjetaDest.replace(/\s+/g, '') : '';

    if (!tarjetaLimpia.startsWith("48200000") || tarjetaLimpia.length !== 16) {
        return res.status(400).json({ error: "Número de tarjeta de destino inválido." });
    }

    const idDestinatarioStr = tarjetaLimpia.slice(8);
    const destinatarioId = parseInt(idDestinatarioStr, 10);

    if (Number(idRemitente) === Number(destinatarioId)) {
        return res.status(400).json({ error: "No puedes transferir coins a tu propia tarjeta." });
    }

    const textoConcepto = concepto ? concepto.trim() : "Transferencia CEESUV Coins";
    const textoReferencia = referencia ? referencia.trim() : String(Math.floor(100000 + Math.random() * 900000));

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const remitenteRes = await client.query("SELECT id, nombre, coins FROM alumnos WHERE id = $1 FOR UPDATE", [idRemitente]);
            if (remitenteRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: "No se encontró la cuenta del remitente." });
            }

            const remitente = remitenteRes.rows[0];
            if (Number(remitente.coins) < valCantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "Saldo insuficiente para realizar la transferencia." });
            }

            const destinatarioRes = await client.query("SELECT id, nombre, coins FROM alumnos WHERE id = $1 FOR UPDATE", [destinatarioId]);
            if (destinatarioRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: "La tarjeta ingresada no corresponde a ningún alumno activo." });
            }

            const destinatario = destinatarioRes.rows[0];

            await client.query("UPDATE alumnos SET coins = coins - $1 WHERE id = $2", [valCantidad, idRemitente]);
            await client.query("UPDATE alumnos SET coins = coins + $1 WHERE id = $2", [valCantidad, destinatarioId]);

            const motivoSalida = `Envío a ${destinatario.nombre} | Concepto: ${textoConcepto} | Ref: ${textoReferencia}`;
            const motivoEntrada = `Recepción de ${remitente.nombre} | Concepto: ${textoConcepto} | Ref: ${textoReferencia}`;

            await client.query(
                "INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario) VALUES ($1, 'SALIDA', $2, $3, $4)",
                [idRemitente, valCantidad, motivoSalida, remitente.nombre]
            );
            await client.query(
                "INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario) VALUES ($1, 'ENTRADA', $2, $3, $4)",
                [destinatarioId, valCantidad, motivoEntrada, remitente.nombre]
            );

            await client.query('COMMIT');

            res.json({ 
                success: true, 
                mensaje: `¡Transferencia exitosa! Enviaste ${valCantidad} coins a ${destinatario.nombre}.` 
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error al procesar la transferencia:", error);
        res.status(500).json({ error: "Error interno del servidor al procesar la transferencia." });
    }
});

const cron = require("node-cron");

cron.schedule("0 0 * * 1", async () => {
  console.log("⏰ Ejecutando tarea automática: Aplicando rendimientos de ahorro del 5%...");
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const alumnosRes = await client.query("SELECT id, nombre, coins_ahorro FROM alumnos WHERE coins_ahorro > 0");
    const alumnosAhorradores = alumnosRes.rows;
    let procesados = 0;

    for (const alumno of alumnosAhorradores) {
      const ahorroActual = Number(alumno.coins_ahorro);
      const rendimiento = Math.round(ahorroActual * 0.05);

      if (rendimiento > 0) {
        const nuevoAhorro = ahorroActual + rendimiento;

        await client.query("UPDATE alumnos SET coins_ahorro = $1 WHERE id = $2", [nuevoAhorro, alumno.id]);

        await client.query(
          `INSERT INTO movimientos (alumno_id, tipo, cantidad, motivo, usuario)
           VALUES ($1, 'AHORRO_RENDIMIENTO', $2, $3, $4)`,
          [alumno.id, rendimiento, 'Rendimiento semanal automático (5%)', 'Sistema Banco CEESUV']
        );

        procesados++;
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Rendimientos aplicados exitosamente a ${procesados} alumnos ahorradores.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al aplicar rendimientos automáticos por cron:", error);
  } finally {
    client.release();
  }
});

// ==========================================
// Inicialización del Servidor
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;