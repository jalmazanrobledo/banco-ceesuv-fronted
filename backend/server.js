const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bancoescolarceesuv",
  password: "2026",
  port: 5432,
});

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

    // Generamos un token por código en caso de que la DB no aplique el default
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

    // Obtener saldo actual
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

    // Actualizar saldo
    await pool.query(
      "UPDATE alumnos SET coins = $1 WHERE id = $2",
      [nuevoSaldo, alumno_id]
    );

    // Guardar movimiento
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

    const resultado = await pool.query(
      `SELECT id, nombre, usuario, rol, estado 
       FROM usuarios 
       WHERE usuario = $1 AND password = $2`,
      [usuario, password]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos."
      });
    }

    const usuarioEncontrado = resultado.rows[0];

    if (usuarioEncontrado.estado !== "Activo") {
      return res.status(403).json({
        mensaje: "El usuario se encuentra inactivo."
      });
    }

    res.json(usuarioEncontrado);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al intentar iniciar sesión."
    });
  }
});

app.listen(5000, () => {
  console.log("");
  console.log("====================================");
  console.log(" Banco Escolar CEESUV");
  console.log(" Servidor iniciado correctamente");
  console.log(" http://localhost:5000");
  console.log("====================================");
  console.log("");
});