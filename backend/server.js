const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// =====================================
// Middleware Anti-Cache Global
// =====================================
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// =====================================
// Configuración de CORS para Vercel
// =====================================
const allowedOrigins = [
  "https://banco-ceesuv-fronted.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Bloqueado por la política de CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cache-Control", "Pragma", "Expires"]
  })
);

// Responder explícitamente a solicitudes preflight (OPTIONS)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// =====================================
// Configuración de Base de Datos (Optimizado para Vercel Serverless)
// =====================================
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 1, // Evita agotar conexiones en entornos serverless
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 5000,
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "bancoescolarceesuv",
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
    const res = await pool.query("SELECT id FROM usuarios WHERE pin = $1", [pin]);
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

  // Añadimos el alumnoId al final para garantizar que nunca se repita el campo usuario
  let usuarioBase = primerApellido ? `${primerNombre}.${primerApellido}${alumnoId}` : `${primerNombre}${alumnoId}`;
  const nombreMostrado = `${partes[0] || ""} ${partes[1] || ""}`.trim();

  const checkUser = await pool.query(
    "SELECT id, pin, estado FROM usuarios WHERE alumno_id = $1",
    [alumnoId]
  );

  if (checkUser.rows.length > 0) {
    // BLINDADO: Omitimos el estado en este UPDATE para que NUNCA se reactive solo si tú lo habías inactivado
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
        token_qr VARCHAR(100) UNIQUE NOT NULL
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
        "SELECT id, nombre, grado, coins, COALESCE(coins_ahorro, 0) AS coins_ahorro FROM alumnos WHERE id = $1",
        [parseInt(identifier, 10)]
      );
    } else {
      alumnoRes = await pool.query(
        `SELECT a.id, a.nombre, a.grado, a.coins, COALESCE(a.coins_ahorro, 0) AS coins_ahorro 
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

// Obtener todos los alumnos (Activos e Inactivos)
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
        u.pin,
        COALESCE(u.estado, 'Activo') AS estado
       FROM alumnos a
       LEFT JOIN usuarios u ON a.id = u.alumno_id
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
    const { nombre, grado, coins, coins_ahorro } = req.body;
    const tokenGenerado = `ceesuv-${Date.now()}-${Math.floor(Math.random() * 899999 + 100000)}`;

    const resultado = await pool.query(
      `INSERT INTO alumnos (nombre, grado, coins, coins_ahorro, token_qr)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, grado, coins || 0, coins_ahorro || 0, tokenGenerado]
    );

    const nuevoAlumno = resultado.rows[0];
    const pin = await asegurarUsuarioAlumno(nuevoAlumno.id, nuevoAlumno.nombre);

    return res.status(200).json({ ...nuevoAlumno, pin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al guardar alumno." });
  }
});

// Sincronizar/Generar usuarios y PINs para alumnos existentes
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
    const { nombre, grado, coins, coins_ahorro } = req.body;

    const resultado = await pool.query(
      `UPDATE alumnos
       SET nombre=$1,
           grado=$2,
           coins=$3,
           coins_ahorro=$4
       WHERE id=$5
       RETURNING *`,
      [nombre, grado, coins, coins_ahorro || 0, id]
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

// Movimientos de saldo (Solo alumnos activos)
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

// Dashboard General (Filtrando solo alumnos activos)
app.get(["/dashboard", "/api/dashboard"], async (req, res) => {
  try {
    const alumnos = await pool.query(`
      SELECT COUNT(a.id) AS total 
      FROM alumnos a 
      LEFT JOIN usuarios u ON u.alumno_id = a.id 
      WHERE COALESCE(u.estado, 'Activo') = 'Activo'
    `);
    
    const coins = await pool.query(`
      SELECT COALESCE(SUM(a.coins),0) AS total 
      FROM alumnos a 
      LEFT JOIN usuarios u ON u.alumno_id = a.id 
      WHERE COALESCE(u.estado, 'Activo') = 'Activo'
    `);

    const coinsAhorro = await pool.query(`
      SELECT COALESCE(SUM(a.coins_ahorro),0) AS total 
      FROM alumnos a 
      LEFT JOIN usuarios u ON u.alumno_id = a.id 
      WHERE COALESCE(u.estado, 'Activo') = 'Activo'
    `);

    const movimientos = await pool.query(`
      SELECT COUNT(m.id) AS total 
      FROM movimientos m 
      JOIN alumnos a ON m.alumno_id = a.id 
      LEFT JOIN usuarios u ON u.alumno_id = a.id 
      WHERE COALESCE(u.estado, 'Activo') = 'Activo'
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

// Obtener usuarios
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

// Agregar usuario administrativo
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

    if (passClean.length === 4 && !isNaN(passClean)) {
      const resPin = await pool.query(
        `SELECT u.id AS usuario_id, u.nombre, u.usuario, u.rol, u.estado, u.alumno_id, a.grado, a.coins, COALESCE(a.coins_ahorro,0) as coins_ahorro
         FROM usuarios u
         JOIN alumnos a ON u.alumno_id = a.id
         WHERE u.pin = $1 AND u.estado = 'Activo'`,
        [passClean]
      );

      if (resPin.rows.length > 0) {
        return res.status(200).json({
          ...resPin.rows[0],
          loginTipo: "PIN"
        });
      }
    }

    const resultado = await pool.query(
      `SELECT id, nombre, usuario, password, rol, estado, alumno_id 
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

// RESETEO DE BASE DE DATOS
app.get(['/reset-db-directo', '/api/reset-db-directo'], async (req, res) => {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS movimientos CASCADE;
      DROP TABLE IF EXISTS alumnos CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;

      CREATE TABLE usuarios (
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

      CREATE TABLE alumnos (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          grado VARCHAR(50) NOT NULL,
          coins INT DEFAULT 0,
          coins_ahorro INT DEFAULT 0,
          token_qr VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE movimientos (
          id SERIAL PRIMARY KEY,
          alumno_id INT REFERENCES alumnos(id) ON DELETE CASCADE,
          tipo VARCHAR(30) NOT NULL,
          cantidad INT NOT NULL,
          motivo VARCHAR(255),
          usuario VARCHAR(50),
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO usuarios (nombre, usuario, password, rol, estado)
      VALUES ('Administrador', 'admin', 'admin123', 'Admin', 'Activo');
    `);
    
    return res.status(200).send("<h1 style='color:green; font-family:sans-serif;'>¡BASE DE DATOS REPARADA Y ESTRUCTURADA CORRECTAMENTE!</h1><p>Usuario: <b>admin</b> | Contraseña: <b>admin123</b></p>");
  } catch (error) {
    return res.status(500).send("<h1>Error al resetear la base de datos:</h1> <pre>" + error.message + "</pre>");
  }
});

// =====================================
// Ruta para realizar compras en la tienda
// =====================================
app.post(["/api/compras", "/compras"], async (req, res) => {
  try {
    const { alumno_id, producto_nombre, costo, usuario } = req.body;

    // Verificar que el alumno exista y tenga sus saldos actuales
    const alumnoQuery = await pool.query(
      "SELECT coins, COALESCE(coins_ahorro, 0) AS coins_ahorro FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumnoQuery.rows.length === 0) {
      return res.status(404).json({ mensaje: "Alumno no encontrado." });
    }

    let coinsDisponibles = Number(alumnoQuery.rows[0].coins);
    const precioProducto = Number(costo);

    // Validar saldo suficiente
    if (coinsDisponibles < precioProducto) {
      return res.status(400).json({ mensaje: "Saldo insuficiente para realizar la compra." });
    }

    // Restar los coins disponibles
    coinsDisponibles -= precioProducto;

    // Actualizar saldo del alumno
    await pool.query(
      "UPDATE alumnos SET coins = $1 WHERE id = $2",
      [coinsDisponibles, alumno_id]
    );

    // Registrar el movimiento en la tabla
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

// =====================================
// RUTAS PUT (Actualizar y Estado de Usuarios)
// =====================================

app.put(["/usuarios/:id", "/api/usuarios/:id"], actualizarUsuarioLogica);

async function actualizarUsuarioLogica(req, res) {
  console.log("⚡ [PUT] Actualizando usuario ID:", req.params.id);
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
}

// Rutas amplias para atrapar solicitudes de estado sin importar si el frontend usa /usuarios o /alumnos
app.put([
  "/usuarios/:id/estado", 
  "/api/usuarios/:id/estado", 
  "/alumnos/:id/estado", 
  "/api/alumnos/:id/estado"
], cambiarEstadoLogica);

// Rutas amplias para atrapar solicitudes de estado sin importar si el frontend usa /usuarios o /alumnos
app.put([
  "/usuarios/:id/estado", 
  "/api/usuarios/:id/estado", 
  "/alumnos/:id/estado", 
  "/api/alumnos/:id/estado"
], cambiarEstadoLogica);

async function cambiarEstadoLogica(req, res) {
  console.log("⚡ [PUT] Cambiando estado de usuario/alumno ID:", req.params.id, "Nuevo estado:", req.body.estado);
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // 1. Actualizar el estado SÍ y SOLO SÍ es un usuario de tipo Alumno (evita tocar al Administrador)
    const resultado = await pool.query(
      `UPDATE usuarios 
       SET estado = $1 
       WHERE alumno_id = $2 OR (id = $2 AND rol != 'Admin')`,
      [estado, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensaje: "Usuario o alumno no encontrado." });
    }

    // 2. Buscar la información completa combinada del alumno para responder al frontend
    const alumnoCompletoRes = await pool.query(
      `SELECT 
        a.id, 
        a.nombre, 
        a.grado, 
        a.coins, 
        COALESCE(a.coins_ahorro, 0) AS coins_ahorro, 
        a.token_qr,
        u.pin,
        COALESCE(u.estado, 'Activo') AS estado
       FROM alumnos a
       LEFT JOIN usuarios u ON u.alumno_id = a.id
       WHERE a.id = $1`,
      [id]
    );

    if (alumnoCompletoRes.rows.length > 0) {
      return res.status(200).json(alumnoCompletoRes.rows[0]);
    }

    return res.status(200).json({ mensaje: "Estado actualizado correctamente." });
  } catch (error) {
    console.error("Error al cambiar estado de usuario:", error);
    return res.status(500).json({ mensaje: "Error al cambiar el estado." });
  }
}
const { GoogleGenAI } = require("@google/genai");

// Inicializa el SDK (asegúrate de tener tu GEMINI_API_KEY en tus variables de entorno .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoint para generar el análisis de reportes
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let textoAnalisis = "";
    if (typeof response.text === 'function') {
      textoAnalisis = response.text();
    } else if (typeof response.text === 'string') {
      textoAnalisis = response.text;
    } else if (response.candidates && response.candidates[0]?.content?.parts[0]?.text) {
      textoAnalisis = response.candidates[0].content.parts[0].text;
    }

    if (!textoAnalisis) {
      textoAnalisis = "No se pudo extraer el texto de la respuesta de la IA.";
    }

    res.json({ analisis: textoAnalisis });
  } catch (error) {
    console.error("Error al generar análisis con Gemini:", error);
    res.status(500).json({ error: "No se pudo generar el análisis inteligente." });
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
