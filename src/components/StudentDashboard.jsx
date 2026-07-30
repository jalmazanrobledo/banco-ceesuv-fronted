import React, { useState, useEffect } from "react";
import TarjetaDebito from "./TarjetaDebito"; // Asegúrate de ajustar la ruta si es necesario
import TransferenciaCoins from "./TransferenciaCoins"; // Asegúrate de ajustar la ruta si es necesario

export default function StudentDashboard({ alumno, onActualizarDatos }) {
  // Estados principales de saldos y datos del estudiante
  const [coinsDisponibles, setCoinsDisponibles] = useState(0);
  const [coinsAhorro, setCoinsAhorro] = useState(0);
  const [coinsTotales, setCoinsTotales] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [nombreAlumno, setNombreAlumno] = useState("");
  
  // Estados de navegación y UI
  const [vistaActiva, setVistaActiva] = useState("inicio");
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);
  
  // Estados de la tienda escolar y carrusel
  const [productosTienda, setProductosTienda] = useState([
    { id: 1, nombre: "Pase de Tarea", costo: 50, icono: "📝" },
    { id: 2, nombre: "Pase de Puntualidad", costo: 30, icono: "⏱️" },
    { id: 3, nombre: "Lápiz CEESUV", costo: 15, icono: "✏️" },
    { id: 4, nombre: "Privilegio de Elección de Asiento", costo: 80, icono: "🪑" }
  ]);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [procesandoCompra, setProcesandoCompra] = useState(null);
  const [mensajeTienda, setMensajeTienda] = useState(null);

  // Estados de la caja de ahorro
  const [montoAhorro, setMontoAhorro] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState(null);

  // Identificador único del alumno (puede ser matrícula, id o correo según tu backend)
  const identifier = alumno?.id || alumno?.matricula || alumno?.correo;

  // Función para cargar los datos del estudiante desde el backend
  const cargarDatosEstudiante = async () => {
    if (!identifier) return;
    try {
      const response = await fetch(`https://banco-ceesuv-backend.vercel.app/api/estudiantes/${identifier}`);
      if (response.ok) {
        const data = await response.json();
        setCoinsDisponibles(data.coinsDisponibles || 0);
        setCoinsAhorro(data.coinsAhorro || 0);
        setCoinsTotales((data.coinsDisponibles || 0) + (data.coinsAhorro || 0));
        setNombreAlumno(data.nombre || alumno?.nombre || "Estudiante");
      }

      // Cargar movimientos
      const resMovs = await fetch(`https://banco-ceesuv-backend.vercel.app/api/movimientos`);
      if (resMovs.ok) {
        const allMovs = await resMovs.json();
        // Filtramos los movimientos que correspondan al alumno actual
        const movsAlumno = allMovs.filter(m => 
          m.matricula === identifier || m.alumnoId === identifier || m.correo === identifier
        );
        setMovimientos(movsAlumno);
      }
    } catch (error) {
      console.error("Error al cargar los datos del estudiante:", error);
    }
  };

  useEffect(() => {
    cargarDatosEstudiante();
  }, [identifier]);

  // Efecto para el carrusel de la tienda escolar
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActivo((prevIndex) => (prevIndex + 1) % productosTienda.length);
    }, 3500);
    return () => clearInterval(intervalo);
  }, [productosTienda.length]);

  // Manejador para comprar en la tienda escolar
  const handleComprar = async (producto) => {
    if (coinsDisponibles < producto.costo) {
      setMensajeTienda({ tipo: "error", texto: "No tienes suficientes coins disponibles." });
      return;
    }

    setProcesandoCompra(producto.id);
    setMensajeTienda(null);

    try {
      const response = await fetch(`https://banco-ceesuv-backend.vercel.app/api/tienda/comprar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          productoId: producto.id,
          costo: producto.costo
        })
      });

      if (response.ok) {
        setMensajeTienda({ tipo: "exito", texto: `¡Has adquirido ${producto.nombre} con éxito!` });
        cargarDatosEstudiante();
        if (onActualizarDatos) onActualizarDatos();
      } else {
        const err = await response.json();
        setMensajeTienda({ tipo: "error", texto: err.mensaje || "Error al procesar la compra." });
      }
    } catch (error) {
      console.error("Error en la compra:", error);
      setMensajeTienda({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setProcesandoCompra(null);
    }
  };

  // Manejador para depósito o retiro de la caja de ahorro
  const handleOperacionAhorro = async (tipoOperacion) => {
    const cantidad = parseInt(montoAhorro);
    if (!cantidad || cantidad <= 0) {
      setMensajeAccion({ tipo: "error", texto: "Ingresa una cantidad válida." });
      return;
    }

    if (tipoOperacion === "AHORRO_DEPOSITO" && cantidad > coinsDisponibles) {
      setMensajeAccion({ tipo: "error", texto: "No tienes suficientes coins disponibles para ahorrar." });
      return;
    }

    if (tipoOperacion === "AHORRO_RETIRO" && cantidad > coinsAhorro) {
      setMensajeAccion({ tipo: "error", texto: "No tienes suficientes coins en tu caja de ahorro." });
      return;
    }

    setProcesando(true);
    setMensajeAccion(null);

    try {
      const response = await fetch(`https://banco-ceesuv-backend.vercel.app/api/ahorro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          tipo: tipoOperacion,
          cantidad: cantidad
        })
      });

      if (response.ok) {
        setMensajeAccion({ 
          tipo: "exito", 
          texto: tipoOperacion === "AHORRO_DEPOSITO" ? "¡Depósito realizado con éxito!" : "¡Retiro realizado con éxito!" 
        });
        setMontoAhorro("");
        cargarDatosEstudiante();
        if (onActualizarDatos) onActualizarDatos();
      } else {
        const err = await response.json();
        setMensajeAccion({ tipo: "error", texto: err.mensaje || "Error en la operación." });
      }
    } catch (error) {
      console.error("Error en caja de ahorro:", error);
      setMensajeAccion({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setProcesando(false);
    }
  };

  // Funciones auxiliares para la tabla de movimientos
  const obtenerColorTipo = (tipo) => {
    if (!tipo) return "#cbd5e1";
    if (tipo.includes("DEPOSITO") || tipo.includes("RECIBIDO") || tipo.includes("AHORRO_RETIRO")) return "#10b981";
    if (tipo.includes("RETIRO") || tipo.includes("ENVIO") || tipo.includes("COMPRA") || tipo.includes("AHORRO_DEPOSITO")) return "#ef4444";
    return "#f59e0b";
  };

  const obtenerSignoMonto = (tipo, cantidad) => {
    if (!tipo) return cantidad;
    if (tipo.includes("RETIRO") || tipo.includes("ENVIO") || tipo.includes("COMPRA") || tipo.includes("AHORRO_DEPOSITO")) {
      return `-${cantidad}`;
    }
    return `+${cantidad}`;
  };

  return (
    <main className="portal-container">
      <div className="card-dark">
        <h2 style={{ margin: 0, fontSize: "22px" }}>
          ¡Bienvenido, {nombreAlumno}!
        </h2>
        <p style={{ margin: "8px 0 15px 0", color: "#94a3b8", fontSize: "14px" }}>
          Consulta tus saldos, realiza transferencias y administra tus coins desde tu panel digital.
        </p>

        {/* MENÚ DE PESTAÑAS / TABS DE NAVEGACIÓN */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", borderTop: "1px solid #1e3250", paddingTop: "15px" }}>
          <button
            onClick={() => setVistaActiva("inicio")}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: vistaActiva === "inicio" ? "#D4AF37" : "#0c1527",
              color: vistaActiva === "inicio" ? "#0B2341" : "#94a3b8",
              transition: "0.2s"
            }}
          >
            💳 Mi Tarjeta y Transferencias
          </button>

          <button
            onClick={() => setVistaActiva("tienda")}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: vistaActiva === "tienda" ? "#D4AF37" : "#0c1527",
              color: vistaActiva === "tienda" ? "#0B2341" : "#94a3b8",
              transition: "0.2s"
            }}
          >
            🛒 Tienda Escolar
          </button>

          <button
            onClick={() => setVistaActiva("ahorro")}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: vistaActiva === "ahorro" ? "#D4AF37" : "#0c1527",
              color: vistaActiva === "ahorro" ? "#0B2341" : "#94a3b8",
              transition: "0.2s"
            }}
          >
            🏦 Caja de Ahorro
          </button>

          <button
            onClick={() => setVistaActiva("movimientos")}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: vistaActiva === "movimientos" ? "#D4AF37" : "#0c1527",
              color: vistaActiva === "movimientos" ? "#0B2341" : "#94a3b8",
              transition: "0.2s"
            }}
          >
            🕒 Historial de Movimientos
          </button>
        </div>
      </div>

      {/* VISTA 1: INICIO (SALDOS, TARJETA Y TRANSFERENCIAS) */}
      {vistaActiva === "inicio" && (
        <>
          <div className="grid-cards">
            <div className="card-stat">
              <div>
                <p className="stat-title">Saldo Disponible</p>
                <p className="stat-value" style={{ color: "#f59e0b" }}>
                  {coinsDisponibles} <span style={{ fontSize: "12px", color: "#94a3b8" }}>COINS</span>
                </p>
              </div>
              <div className="badge-icon">🪙</div>
            </div>

            <div className="card-stat">
              <div>
                <p className="stat-title">Saldo en Ahorro</p>
                <p className="stat-value" style={{ color: "#3b82f6" }}>
                  {coinsAhorro} <span style={{ fontSize: "12px", color: "#94a3b8" }}>COINS</span>
                </p>
              </div>
              <div className="badge-icon">🏦</div>
            </div>

            <div className="card-stat">
              <div>
                <p className="stat-title">Total Acumulado</p>
                <p className="stat-value" style={{ color: "#10b981" }}>
                  {coinsTotales} <span style={{ fontSize: "12px", color: "#94a3b8" }}>COINS</span>
                </p>
              </div>
              <div className="badge-icon">💰</div>
            </div>
          </div>

          <div className="card-dark" style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>💳 Tarjeta de Débito y Transferencias CEESUV</h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
              Consulta tu tarjeta digital oficial y envía coins a tus compañeros usando su número de tarjeta.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
              <TarjetaDebito alumno={alumno} />
            </div>

            <button
              onClick={() => setMostrarTransferencia(!mostrarTransferencia)}
              className="btn-accion btn-guardar"
              style={{ maxWidth: "260px", margin: "0 auto", display: "block" }}
            >
              {mostrarTransferencia ? "Ocultar Transferencias" : "🔄 Realizar Transferencia a Compañero"}
            </button>

            {mostrarTransferencia && (
              <div style={{ marginTop: "20px", borderTop: "1px solid #1e3250", paddingTop: "20px" }}>
                <TransferenciaCoins
                  alumnoActual={alumno}
                  onTransferenciaExitosa={() => {
                    cargarDatosEstudiante();
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* VISTA 2: TIENDA ESCOLAR */}
      {vistaActiva === "tienda" && (
        <div className="card-dark">
          <h3 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>🛒 Tienda Escolar</h3>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Canjea tus coins disponibles por artículos escolares o privilegios especiales.
          </p>

          <div className="carrusel-contenedor">
            {productosTienda.map((prod, index) => {
              const esActivo = index === indiceActivo;
              return (
                <div
                  key={prod.id}
                  className={`tarjeta-producto ${esActivo ? "tarjeta-activa" : "tarjeta-inactiva"}`}
                >
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>{prod.icono}</div>
                    <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "13px" }}>{prod.nombre}</p>
                    <p style={{ margin: 0, color: "#f59e0b", fontSize: "12px", fontWeight: "bold" }}>{prod.costo} COINS</p>
                  </div>
                  <button
                    className="btn-accion btn-comprar"
                    onClick={() => handleComprar(prod)}
                    disabled={procesandoCompra === prod.id}
                  >
                    {procesandoCompra === prod.id ? "Comprando..." : "Comprar"}
                  </button>
                </div>
              );
            })}
          </div>

          {mensajeTienda && (
            <p style={{ marginTop: "12px", fontSize: "14px", color: mensajeTienda.tipo === "error" ? "#ef4444" : "#10b981", fontWeight: "bold", textAlign: "center" }}>
              {mensajeTienda.texto}
            </p>
          )}
        </div>
      )}

      {/* VISTA 3: CAJA DE AHORRO */}
      {vistaActiva === "ahorro" && (
        <div className="card-dark">
          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>📥 Gestión de Caja de Ahorro</h3>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "15px" }}>
            Mueve coins de tu saldo disponible a tu alcancía de ahorro o retíralos cuando los necesites.
          </p>

          <div className="ahorro-acciones">
            <input
              type="number"
              placeholder="Cantidad de coins"
              className="input-ahorro"
              value={montoAhorro}
              onChange={(e) => setMontoAhorro(e.target.value)}
              min="1"
            />
            <button
              className="btn-accion btn-guardar"
              onClick={() => handleOperacionAhorro("AHORRO_DEPOSITO")}
              disabled={procesando}
            >
              {procesando ? "Procesando..." : "➡️ Depositar a Ahorro"}
            </button>
            <button
              className="btn-accion btn-retirar"
              onClick={() => handleOperacionAhorro("AHORRO_RETIRO")}
              disabled={procesando}
            >
              {procesando ? "Procesando..." : "⬅️ Retirar de Ahorro"}
            </button>
          </div>

          {mensajeAccion && (
            <p style={{ marginTop: "12px", fontSize: "14px", color: mensajeAccion.tipo === "error" ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
              {mensajeAccion.texto}
            </p>
          )}
        </div>
      )}

      {/* VISTA 4: MOVIMIENTOS */}
      {vistaActiva === "movimientos" && (
        <div className="card-dark">
          <h3 style={{ margin: 0, fontSize: "18px" }}>🕒 Mis Últimos Movimientos</h3>

          {movimientos && movimientos.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="tabla-movs">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Coins</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td style={{ color: "#cbd5e1" }}>
                        {m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}
                      </td>
                      <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>
                        {m.tipo}
                      </td>
                      <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>
                        🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}
                      </td>
                      <td style={{ color: "#cbd5e1" }}>{m.motivo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
              <p style={{ margin: 0, fontSize: "15px" }}>Aún no tienes movimientos registrados.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}