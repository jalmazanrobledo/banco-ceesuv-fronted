const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// =====================================
// Configuración de CORS para Vercel
// =====================================
app.use(cors({
  origin: [
    "https://banco-ceesuv-fronted.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());

// =====================================
// Configuración de Base de Datos
// =====================================
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "bancoescolarceesuv",
        password: "2026",
        port: 5432,
      }
);

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

    // Asegurar que la columna coins_ahorro exista en bases ya creadas
    await pool.query(`
      ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS coins_ahorro INT DEFAULT 0;
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
// Ruta principal
// =====================================
app.get("/", (req, res) => {
  res.send("Servidor Banco Escolar CEESUV funcionando correctamente.");
});

// =====================================
// Consulta pública vía Código QR (Padres)
// =====================================
app.get("/consulta/:token", async (req, res) => {
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

    res.json({
      alumno: alumno,
      movimientos: movimientosResult.rows
    });

  } catch (error) {
    console.error("Error al consultar por QR:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor al consultar QR."
    });
  }
});

// =====================================
// Obtener todos los alumnos
// =====================================
app.get("/alumnos", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT id, nombre, grado, coins, COALESCE(coins_ahorro, 0) AS coins_ahorro, token_qr FROM alumnos ORDER BY id"
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener alumnos."
    });
  }
});

// =====================================
// Agregar alumno (Genera token_qr único)
// =====================================
app.post("/alumnos", async (req, res) => {
  try {
    const { nombre, grado, coins, coins_ahorro } = req.body;

    const tokenGenerado = `ceesuv-${Date.now()}-${Math.floor(Math.random() * 899999 + 100000)}`;

    const resultado = await pool.query(
      `INSERT INTO alumnos
      (nombre, grado, coins, coins_ahorro, token_qr)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [nombre, grado, coins || 0, coins_ahorro || 0, tokenGenerado]
    );

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al guardar alumno."
    });
  }
});

// =====================================
// Editar alumno
// =====================================
app.put("/alumnos/:id", async (req, res) => {
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

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al editar alumno."
    });
  }
});

// =====================================
// Eliminar alumno
// =====================================
app.delete("/alumnos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM alumnos WHERE id=$1",
      [id]
    );

    res.json({
      mensaje: "Alumno eliminado correctamente."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al eliminar alumno."
    });
  }
});

// =====================================
// Agregar o descontar CEESUV Coins / Operaciones de Ahorro
// =====================================
app.post("/movimientos", async (req, res) => {
  try {
    const {
      alumno_id,
      tipo,
      cantidad,
      motivo,
      usuario
    } = req.body;

    const alumnoQuery = await pool.query(
      "SELECT coins, COALESCE(coins_ahorro, 0) AS coins_ahorro FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumnoQuery.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado."
      });
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

    // Actualizamos saldos en la tabla alumnos
    await pool.query(
      "UPDATE alumnos SET coins = $1, coins_ahorro = $2 WHERE id = $3",
      [coinsDisponibles, coinsAhorro, alumno_id]
    );

    // Registramos en la tabla movimientos
    await pool.query(
      `INSERT INTO movimientos
      (alumno_id, tipo, cantidad, motivo, usuario)
      VALUES ($1, $2, $3, $4, $5)`,
      [
        alumno_id,
        tipo,
        monto,
        motivo || 'Movimiento de saldo',
        usuario || 'Sistema'
      ]
    );

    res.json({
      mensaje: "Movimiento registrado correctamente.",
      coins: coinsDisponibles,
      coins_ahorro: coinsAhorro
    });

  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    res.status(500).json({
      mensaje: "Error al registrar movimiento."
    });
  }
});

// =====================================
// Dashboard
// =====================================
app.get("/dashboard", async (req, res) => {
  try {
    const alumnos = await pool.query(
      "SELECT COUNT(*) AS total FROM alumnos"
    );

    const coins = await pool.query(
      "SELECT COALESCE(SUM(coins),0) AS total FROM alumnos"
    );

    const coinsAhorro = await pool.query(
      "SELECT COALESCE(SUM(coins_ahorro),0) AS total FROM alumnos"
    );

    const movimientos = await pool.query(
      "SELECT COUNT(*) AS total FROM movimientos"
    );

    res.json({
      alumnos: Number(alumnos.rows[0].total),
      coins: Number(coins.rows[0].total),
      coins_ahorro: Number(coinsAhorro.rows[0].total),
      movimientos: Number(movimientos.rows[0].total)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener estadísticas."
    });
  }
});

// =====================================
// Obtener movimientos
// =====================================
app.get("/movimientos", async (req, res) => {
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
      INNER JOIN alumnos a
        ON m.alumno_id = a.id
      ORDER BY m.fecha DESC
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener movimientos."
    });
  }
});

// =====================================
// Obtener usuarios
// =====================================
app.get("/usuarios", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        id,
        nombre,
        usuario,
        rol,
        estado,
        fecha_registro
      FROM usuarios
      ORDER BY id`
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener usuarios."
    });
  }
});

// =====================================
// Agregar usuario
// =====================================
app.post("/usuarios", async (req, res) => {
  try {
    const {
      nombre,
      usuario,
      password,
      rol
    } = req.body;

    const resultado = await pool.query(
      `INSERT INTO usuarios
      (nombre, usuario, password, rol)
      VALUES ($1,$2,$3,$4)
      RETURNING id,nombre,usuario,rol,estado`,
      [nombre, usuario, password, rol]
    );

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al guardar usuario."
    });
  }
});

// =====================================
// Editar usuario
// =====================================
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      usuario,
      rol
    } = req.body;

    const resultado = await pool.query(
      `UPDATE usuarios
       SET nombre=$1,
           usuario=$2,
           rol=$3
       WHERE id=$4
       RETURNING id,nombre,usuario,rol,estado`,
      [nombre, usuario, rol, id]
    );

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al editar usuario."
    });
  }
});

// =====================================
// Cambiar estado del usuario
// =====================================
app.put("/usuarios/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const resultado = await pool.query(
      `UPDATE usuarios
       SET estado=$1
       WHERE id=$2
       RETURNING id,nombre,usuario,rol,estado`,
      [estado, id]
    );

    res.json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al cambiar el estado."
    });
  }
});

// =====================================
// Login de usuario
// =====================================
app.post("/login", async (req, res) => {
  try {
    const payload = (req.body && typeof req.body.usuario === 'object' && req.body.usuario !== null)
      ? req.body.usuario 
      : req.body;

    const uRaw = payload.usuario || (typeof req.body.usuario === 'string' ? req.body.usuario : "");
    const pRaw = payload.password || payload.contrasena || payload.pass || req.body.password || req.body.contrasena || "";

    const userClean = String(uRaw).trim();
    const passClean = String(pRaw).trim();

    if (!userClean || !passClean) {
      return res.status(400).json({ mensaje: "Usuario y contraseña requeridos." });
    }

    const resultado = await pool.query(
      `SELECT id, nombre, usuario, password, rol, estado 
       FROM usuarios 
       WHERE LOWER(usuario) = LOWER($1)`,
      [userClean]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos."
      });
    }

    const usuarioEncontrado = resultado.rows[0];

    if (usuarioEncontrado.password !== passClean) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos."
      });
    }

    if (usuarioEncontrado.estado && usuarioEncontrado.estado.toLowerCase() !== "activo") {
      return res.status(403).json({
        mensaje: "El usuario se encuentra inactivo."
      });
    }

    delete usuarioEncontrado.password;

    res.json(usuarioEncontrado);

  } catch (error) {
    console.error("Error al intentar iniciar sesión:", error);
    res.status(500).json({
      mensaje: "Error al intentar iniciar sesión.",
      detalles: error.message
    });
  }
});

// =====================================
// ENDPOINT DE RESETEO/RESTRUCTURACIÓN DE DB
// =====================================
app.get('/reset-db-directo', async (req, res) => {
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
    
    res.send("<h1 style='color:green; font-family:sans-serif;'>¡BASE DE DATOS REPARADA Y ESTRUCTURADA CORRECTAMENTE!</h1><p>Usuario: <b>admin</b> | Contraseña: <b>admin123</b></p>");
  } catch (error) {
    res.status(500).send("<h1>Error al resetear la base de datos:</h1> <pre>" + error.message + "</pre>");
  }
});

// Puerto dinámico asignado por Render
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("====================================");
  console.log(" Banco Escolar CEESUV");
  console.log(` Servidor iniciado en puerto: ${PORT}`);
  console.log("====================================");
});