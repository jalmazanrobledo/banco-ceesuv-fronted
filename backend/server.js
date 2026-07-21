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
// En Render se usará process.env.DATABASE_URL. Si no existe, usará la configuración local.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Requerido para DBs en la nube como Render
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
    // 1. Crear las tablas si no existen
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
        token_qr VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY,
        alumno_id INT REFERENCES alumnos(id) ON DELETE CASCADE,
        tipo VARCHAR(10) NOT NULL,
        cantidad INT NOT NULL,
        motivo VARCHAR(255),
        usuario VARCHAR(50),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Registra o actualiza 'admin' con la contraseña que prefieras
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

// Ejecutamos la inicialización
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

    // 1. Buscar alumno por su token_qr
    const alumnoResult = await pool.query(
      "SELECT id, nombre, grado, coins FROM alumnos WHERE token_qr = $1",
      [token]
    );

    if (alumnoResult.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Código QR no válido o alumno no encontrado."
      });
    }

    const alumno = alumnoResult.rows[0];

    // 2. Buscar últimos 10 movimientos del alumno
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
      "SELECT * FROM alumnos ORDER BY id"
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
    const { nombre, grado, coins } = req.body;

    const tokenGenerado = `ceesuv-${Date.now()}-${Math.floor(Math.random() * 899999 + 100000)}`;

    const resultado = await pool.query(
      `INSERT INTO alumnos
      (nombre, grado, coins, token_qr)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [nombre, grado, coins, tokenGenerado]
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
    const { nombre, grado, coins } = req.body;

    const resultado = await pool.query(
      `UPDATE alumnos
       SET nombre=$1,
           grado=$2,
           coins=$3
       WHERE id=$4
       RETURNING *`,
      [nombre, grado, coins, id]
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
// Agregar o descontar CEESUV Coins
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

    const alumno = await pool.query(
      "SELECT coins FROM alumnos WHERE id = $1",
      [alumno_id]
    );

    if (alumno.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Alumno no encontrado."
      });
    }

    let saldoActual = alumno.rows[0].coins;
    let nuevoSaldo = saldoActual;

    if (tipo === "ENTRADA") {
      nuevoSaldo += Number(cantidad);
    }

    if (tipo === "SALIDA") {
      nuevoSaldo -= Number(cantidad);

      if (nuevoSaldo < 0) {
        return res.status(400).json({
          mensaje: "El alumno no tiene suficientes CEESUV Coins."
        });
      }
    }

    await pool.query(
      "UPDATE alumnos SET coins = $1 WHERE id = $2",
      [nuevoSaldo, alumno_id]
    );

    await pool.query(
      `INSERT INTO movimientos
      (alumno_id, tipo, cantidad, motivo, usuario)
      VALUES ($1,$2,$3,$4,$5)`,
      [
        alumno_id,
        tipo,
        cantidad,
        motivo,
        usuario
      ]
    );

    res.json({
      mensaje: "Movimiento registrado correctamente.",
      saldo: nuevoSaldo
    });

  } catch (error) {
    console.error(error);
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

    const movimientos = await pool.query(
      "SELECT COUNT(*) AS total FROM movimientos"
    );

    res.json({
      alumnos: Number(alumnos.rows[0].total),
      coins: Number(coins.rows[0].total),
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
    const { usuario, password } = req.body;

    // Limpiamos espacios alrededor de las entradas
    const userClean = usuario ? usuario.trim() : "";
    const passClean = password ? password.trim() : "";

    // 1. Buscamos el usuario por su nombre (sin importar mayúsculas/minúsculas)
    const resultado = await pool.query(
      `SELECT id, nombre, usuario, password, rol, estado 
       FROM usuarios 
       WHERE LOWER(usuario) = LOWER($1)`,
      [userClean]
    );

    if (resultado.rows.length === 0) {
      console.log(`[LOGIN FAIL] Usuario no encontrado: "${userClean}"`);
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos."
      });
    }

    const usuarioEncontrado = resultado.rows[0];

    // 2. Verificamos la contraseña
    if (usuarioEncontrado.password !== passClean) {
      console.log(`[LOGIN FAIL] Contraseña incorrecta para el usuario: "${userClean}"`);
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos."
      });
    }

    // 3. Verificamos el estado
    if (usuarioEncontrado.estado && usuarioEncontrado.estado.toLowerCase() !== "activo") {
      return res.status(403).json({
        mensaje: "El usuario se encuentra inactivo."
      });
    }

    // No enviamos la contraseña de vuelta al frontend por seguridad
    delete usuarioEncontrado.password;

    console.log(`[LOGIN SUCCESS] Inicio de sesión exitoso: ${usuarioEncontrado.usuario}`);
    res.json(usuarioEncontrado);

  } catch (error) {
    console.error("Error al intentar iniciar sesión:", error);
    res.status(500).json({
      mensaje: "Error al intentar iniciar sesión."
    });
  }
});

// ENDPOINT TEMPORAL DE EMERGENCIA PARA CREAR TABLAS Y ADMIN
app.get('/reset-db-directo', async (req, res) => {
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
      INSERT INTO usuarios (nombre, usuario, password, rol, estado)
      VALUES ('Administrador', 'admin', 'admin123', 'Admin', 'Activo')
      ON CONFLICT (usuario) DO UPDATE SET password = 'admin123', estado = 'Activo';
    `);
    res.send("<h1>¡ÉXITO TOTAL! Las tablas y el usuario admin/admin123 ya existen en la base de datos.</h1>");
  } catch (error) {
    res.status(500).send("<h1>Error:</h1> <pre>" + error.message + "</pre>");
  }
});

// Puerto dinámico asignado por Render (o 5000 para local)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("====================================");
  console.log(" Banco Escolar CEESUV");
  console.log(` Servidor iniciado en puerto: ${PORT}`);
  console.log("====================================");
});