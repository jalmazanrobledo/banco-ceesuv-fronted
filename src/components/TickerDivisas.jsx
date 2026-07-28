import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el Ticker de Divisas Dinámico
  const [tasas, setTasas] = useState(null);
  const [cargandoDivisas, setCargandoDivisas] = useState(true);

  // Estados para la gestión de ahorros
  const [montoAhorro, setMontoAhorro] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // Estados para la Tienda / Compras
  const [procesandoCompra, setProcesandoCompra] = useState(null);
  const [mensajeTienda, setMensajeTienda] = useState(null);

  // Estado para el índice activo del carrusel de la tienda
  const [indiceActivo, setIndiceActivo] = useState(0);

  // Catálogo de productos de ejemplo
  const productosTienda = [
    { id: 1, nombre: "Lápiz CEESUV", costo: 5, icono: "✏️" },
    { id: 2, nombre: "Libreta Profesional", costo: 15, icono: "📓" },
    { id: 3, nombre: "Pase de Tarea Extra", costo: 30, icono: "⭐" },
    { id: 4, nombre: "Goma y Sacapuntas", costo: 8, icono: "📐" }
  ];

  // Obtener tasas de cambio en vivo
  useEffect(() => {
    async function obtenerTiposCambio() {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        
        if (data && data.rates) {
          const usdMxn = data.rates.MXN;
          const eurMxn = data.rates.MXN / data.rates.EUR;
          const cadMxn = data.rates.MXN / data.rates.CAD;

          setTasas({
            usd: usdMxn.toFixed(2),
            eur: eurMxn.toFixed(2),
            cad: cadMxn.toFixed(2)
          });
        }
      } catch (error) {
        console.error("Error al obtener divisas reales:", error);
      } finally {
        setCargandoDivisas(false);
      }
    }

    obtenerTiposCambio();
  }, []);

  // Rotación automática del carrusel cada 3.5 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActivo((prev) => (prev + 1) % productosTienda.length);
    }, 3500);
    return () => clearInterval(intervalo);
  }, [productosTienda.length]);

  const cargarDatosEstudiante = async () => {
    try {
      const storedUser = localStorage.getItem("usuario");
      if (!storedUser) {
        navigate("/login");
        return;
      }

      const userObj = JSON.parse(storedUser);
      let datosAlumno = userObj;
      let listaMovimientos = userObj.movimientos || [];

      const identifier =
        userObj.id ||
        userObj.alumno_id ||
        userObj.usuario ||
        userObj.username ||
        userObj.nombre;

      if (identifier) {
        const param = encodeURIComponent(identifier);
        try {
          const resAlumno = await fetch(
            `https://banco-ceesuv-backend.vercel.app/api/alumnos/${param}?_t=${new Date().getTime()}`
          );

          if (resAlumno.ok) {
            const data = await resAlumno.json();
            datosAlumno = Array.isArray(data) ? data[0] : (data.alumno || data);
            listaMovimientos =
              data.movimientos || datosAlumno?.movimientos || listaMovimientos;
          } else {
            const resTodosAlumnos = await fetch(
              `https://banco-ceesuv-backend.vercel.app/api/alumnos`
            );
            if (resTodosAlumnos.ok) {
              const todosAlumnos = await resTodosAlumnos.json();
              const encontrado = todosAlumnos.find(
                (a) =>
                  String(a.id) === String(identifier) ||
                  String(a.alumno_id) === String(identifier) ||
                  (a.nombre &&
                    userObj.nombre &&
                    a.nombre.toLowerCase() === userObj.nombre.toLowerCase())
              );
              if (encontrado) datosAlumno = encontrado;
            }
          }
        } catch (err) {
          console.warn("Consulta individual omitida o no disponible:", err);
        }
      }

      setAlumno(datosAlumno);

      try {
        const resMovs = await fetch(
          `https://banco-ceesuv-backend.vercel.app/api/movimientos`
        );

        if (resMovs.ok) {
          const todosMovimientos = await resMovs.json();
          const nombreBuscado = (datosAlumno.nombre || userObj.nombre || "").toLowerCase();
          const idBuscado = String(
            datosAlumno.id || datosAlumno.alumno_id || userObj.id || ""
          );

          const misMovs = todosMovimientos.filter((m) => {
            const alumnoMov = (m.alumno || m.nombre || "").toLowerCase();
            const alumnoIdMov = String(
              m.alumno_id || m.alumnoId || m.id_alumno || ""
            );
            return (
              (idBuscado && alumnoIdMov === idBuscado) ||
              (nombreBuscado && alumnoMov.includes(nombreBuscado))
            );
          });

          if (misMovs.length > 0) {
            listaMovimientos = misMovs;
          }
        }
      } catch (err) {
        console.warn("Consulta a /api/movimientos no disponible:", err);
      }

      setMovimientos(listaMovimientos);
    } catch (error) {
      console.error("Error al procesar datos del alumno:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosEstudiante();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleOperacionAhorro = async (tipoAccion) => {
    if (!montoAhorro || isNaN(montoAhorro) || Number(montoAhorro) <= 0) {
      setMensajeAccion({ tipo: "error", texto: "Ingresa una cantidad válida." });
      return;
    }

    const alumnoId = alumno?.alumno_id || alumno?.id;
    
    if (!alumnoId) {
      setMensajeAccion({ tipo: "error", texto: "No se identificó el ID del alumno." });
      return;
    }

    setProcesando(true);
    setMensajeAccion(null);

    try {
      const response = await fetch("https://banco-ceesuv-backend.vercel.app/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumno_id: Number(alumnoId),
          tipo: tipoAccion,
          cantidad: Number(montoAhorro),
          motivo: tipoAccion === "AHORRO_DEPOSITO" ? "Depósito a cuenta de ahorro" : "Retiro desde cuenta de ahorro",
          usuario: alumno?.nombre || "Estudiante"
        })
      });

      if (response.ok) {
        setMensajeAccion({ tipo: "success", texto: "¡Operación realizada con éxito!" });
        setMontoAhorro("");
        await cargarDatosEstudiante();
      } else {
        let mensajeError = "Error al procesar la operación.";
        try {
          const data = await response.json();
          if (data && data.mensaje) mensajeError = data.mensaje;
        } catch (e) {}
        setMensajeAccion({ tipo: "error", texto: mensajeError });
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensajeAccion({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setProcesando(false);
    }
  };

  const handleComprar = async (producto) => {
    const alumnoId = alumno?.alumno_id || alumno?.id;

    if (!alumnoId) {
      setMensajeTienda({ tipo: "error", texto: "No se identificó el ID del alumno." });
      return;
    }

    if (Number(alumno?.coins || 0) < producto.costo) {
      setMensajeTienda({ tipo: "error", texto: `Saldo insuficiente para comprar ${producto.nombre}.` });
      return;
    }

    setProcesandoCompra(producto.id);
    setMensajeTienda(null);

    try {
      const response = await fetch("https://banco-ceesuv-backend.vercel.app/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumno_id: Number(alumnoId),
          producto_nombre: producto.nombre,
          costo: producto.costo,
          usuario: alumno?.nombre || "Estudiante"
        })
      });

      if (response.ok) {
        setMensajeTienda({ tipo: "success", texto: `¡Has adquirido ${producto.nombre} con éxito!` });
        await cargarDatosEstudiante();
      } else {
        let mensajeError = "Error al procesar la compra.";
        try {
          const data = await response.json();
          if (data && data.mensaje) mensajeError = data.mensaje;
        } catch (e) {}
        setMensajeTienda({ tipo: "error", texto: mensajeError });
      }
    } catch (error) {
      console.error("Error de red en compra:", error);
      setMensajeTienda({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setProcesandoCompra(null);
    }
  };

  const obtenerColorTipo = (tipo) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return "#10B981";
    if (tipo === "SALIDA" || tipo === "COMPRA") return "#EF4444";
    if (tipo === "AHORRO_DEPOSITO") return "#3B82F6";
    if (tipo === "AHORRO_RETIRO") return "#F59E0B";
    return "#333";
  };

  const obtenerSignoMonto = (tipo, cantidad) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO" || tipo === "AHORRO_RETIRO") return `+${cantidad}`;
    if (tipo === "SALIDA" || tipo === "AHORRO_DEPOSITO" || tipo === "COMPRA") return `-${cantidad}`;
    return `${cantidad}`;
  };

  if (cargando) {
    return (
      <>
        <style>{`
          @keyframes girar {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .loader-icon {
            display: inline-block;
            animation: girar 2s linear infinite;
            font-size: 40px;
            margin-bottom: 15px;
          }
        `}</style>
        <div
          style={{
            minHeight: "100vh",
            background: "#0c1527",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
            textAlign: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          <div>
            <span className="loader-icon">⏳</span>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: "500", color: "#94a3b8" }}>
              Cargando información del estudiante...
            </p>
          </div>
        </div>
      </>
    );
  }

  const nombreAlumno = alumno?.nombre || alumno?.usuario || "Estudiante";
  const coinsDisponibles = Number(alumno?.coins ?? 0);
  const coinsAhorro = Number(alumno?.coins_ahorro ?? 0);
  const coinsTotales = coinsDisponibles + coinsAhorro;
  const matricula = alumno?.matricula || alumno?.id || "N/A";

  // Valores dinámicos del Ticker con respaldo
  const usdMxn = tasas?.usd || "17.50";
  const eurMxn = tasas?.eur || "19.05";
  const cadMxn = tasas?.cad || "12.80";

  return (
    <>
      <style>{`
        body {
          margin: 0;
          background-color: #0c1527;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: white;
          -webkit-text-size-adjust: 100%;
        }

        .dashboard-wrapper {
          min-height: 100vh;
          background-image: linear-gradient(rgba(12, 21, 39, 0.45), rgba(12, 21, 39, 0.50)), url('/fachada-ceesuv.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .portal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background-color: #0c1527;
          border-bottom: 1px solid #1a2a47;
          flex-wrap: wrap;
          gap: 15px;
        }

        .portal-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-title {
          font-size: 15px;
          font-weight: bold;
          color: #f59e0b;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .badge-envivo {
          background-color: #10b981;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .ticker-divisas {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 13px;
          font-family: 'Courier New', Courier, monospace;
          color: #94a3b8;
        }

        .ticker-item {
          color: #10b981;
          font-weight: bold;
        }

        .badge-coin-ticker {
          background-color: rgba(212, 175, 55, 0.15);
          border: 1px solid #D4AF37;
          color: #D4AF37;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 11px;
        }

        .user-info-bar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .btn-logout {
          background-color: #ef4444;
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
          transition: 0.2s;
        }

        .btn-logout:hover {
          background-color: #dc2626;
        }

        .portal-container {
          max-width: 1100px;
          margin: 20px auto;
          padding: 0 15px;
        }

        .card-dark {
          background-color: rgba(19, 34, 56, 0.88);
          backdrop-filter: blur(6px);
          border: 1px solid #1e3250;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .grid-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .carrusel-contenedor {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          width: 100%;
          height: 240px;
          margin-top: 15px;
        }

        .tarjeta-producto {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(12, 21, 39, 0.85);
          border: 1px solid #1e3250;
          border-radius: 16px;
          padding: 16px;
          margin: 0 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
          width: 180px;
          box-sizing: border-box;
        }

        .tarjeta-inactiva {
          transform: scale(0.85);
          opacity: 0.4;
          filter: brightness(0.7);
        }

        .tarjeta-activa {
          transform: scale(1.1);
          opacity: 1;
          filter: brightness(1);
          border-color: #10b981;
          z-index: 10;
        }

        .card-stat {
          background-color: rgba(19, 34, 56, 0.88);
          backdrop-filter: blur(6px);
          border: 1px solid #1e3250;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .stat-title {
          color: #94a3b8;
          font-size: 13px;
          margin: 0 0 4px 0;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
        }

        .badge-icon {
          background: rgba(255,255,255,0.05);
          padding: 10px;
          border-radius: 10px;
          font-size: 20px;
        }

        .tabla-movs {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          text-align: left;
          min-width: 500px;
        }

        .tabla-movs th {
          padding: 10px;
          color: #94a3b8;
          border-bottom: 1px solid #1e3250;
          font-size: 13px;
        }

        .tabla-movs td {
          padding: 12px 10px;
          border-bottom: 1px solid #1e3250;
          font-size: 13px;
        }

        .input-ahorro {
          background: rgba(12, 21, 39, 0.9);
          border: 1px solid #1e3250;
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          width: 100%;
          max-width: 100%;
        }

        .ahorro-acciones {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-accion {
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          transition: 0.2s;
        }

        .btn-guardar {
          background-color: #2563eb;
          color: white;
        }
        .btn-guardar:hover { background-color: #1d4ed8; }

        .btn-retirar {
          background-color: #d97706;
          color: white;
        }
        .btn-retirar:hover { background-color: #b45309; }

        .btn-comprar {
          background-color: #10b981;
          color: white;
          width: 100%;
          margin-top: 8px;
          padding: 7px;
          font-size: 12px;
        }
        .btn-comprar:hover { background-color: #059669; }

        @media (min-width: 768px) {
          .portal-header {
            padding: 12px 40px;
          }
          .portal-container {
            margin: 30px auto;
            padding: 0 20px;
          }
          .card-dark {
            padding: 24px;
            margin-bottom: 24px;
          }
          .card-stat {
            padding: 20px;
          }
          .stat-title {
            font-size: 14px;
          }
          .stat-value {
            font-size: 24px;
          }
          .input-ahorro {
            max-width: 200px;
            width: auto;
            margin-right: 10px;
          }
          .ahorro-acciones {
            flex-direction: row;
            align-items: center;
          }
          .btn-accion:not(.btn-comprar) {
            width: auto;
          }
          .tabla-movs th, .tabla-movs td {
            padding: 14px 12px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="dashboard-wrapper">
        {/* Navbar con Ticker de Divisas Dinámico integrado */}
        <header className="portal-header">
          <div className="portal-brand">
            <span style={{ fontSize: "16px" }}>🏛️</span>
            <h1 className="brand-title">BANCO CEESUV</h1>
            <span className="badge-envivo">EN VIVO</span>
          </div>

          <div className="ticker-divisas">
            <div>USD/MXN: <span className="ticker-item">${usdMxn}</span></div>
            <div>EUR/MXN: <span className="ticker-item">${eurMxn}</span></div>
            <div>CAD/MXN: <span className="ticker-item">${cadMxn}</span></div>
            <div className="badge-coin-ticker">1 COIN = $1.00 MXN</div>
          </div>

          <div className="user-info-bar">
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
                {nombreAlumno}
              </p>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>
                Matrícula: {matricula}
              </p>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="portal-container">
          <div className="card-dark">
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              ¡Bienvenido, {nombreAlumno}!
            </h2>
            <p style={{ margin: "8px 0 0 0", color: "#94a3b8", fontSize: "14px" }}>
              Consulta tus saldos disponibles, gestiona tus ahorros, compra en la tienda escolar y revisa tus movimientos.
            </p>
          </div>

          {/* Tarjetas de Balances */}
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

          {/* Sección de Tienda / Compras con Carrusel Dinámico */}
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

            {/* Puntos / Indicadores del carrusel */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "12px", gap: "6px" }}>
              {productosTienda.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setIndiceActivo(index)}
                  style={{
                    border: "none",
                    height: "8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    width: index === indiceActivo ? "24px" : "8px",
                    background: index === indiceActivo ? "#10b981" : "#334155"
                  }}
                />
              ))}
            </div>

            {mensajeTienda && (
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: mensajeTienda.tipo === "error" ? "#ef4444" : "#10b981",
                  fontWeight: "bold",
                  textAlign: "center"
                }}
              >
                {mensajeTienda.texto}
              </p>
            )}
          </div>

          {/* Sección de Gestión de Ahorro */}
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
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: mensajeAccion.tipo === "error" ? "#ef4444" : "#10b981",
                  fontWeight: "bold"
                }}
              >
                {mensajeAccion.texto}
              </p>
            )}
          </div>

          {/* Tabla de Movimientos */}
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
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  Tus abonos, ahorros y canjes aparecerán reflejados en esta sección.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}