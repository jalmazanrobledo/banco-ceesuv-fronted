import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TarjetaDebito from "./TarjetaDebito";
import TarjetaCredito from "./TarjetaCredito";
import TransferenciaCoins from "./TransferenciaCoins";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [activeTab, setActiveTab] = useState("tarjetas");
  
  const [tasas, setTasas] = useState(null);
  const [cargandoDivisas, setCargandoDivisas] = useState(true);

  const [montoAhorro, setMontoAhorro] = useState("");
  const [mensajeAccion, setMensajeAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState("coins");

  const [montoCreditoPago, setMontoCreditoPago] = useState("");
  const [mensajeCreditoPago, setMensajeCreditoPago] = useState(null);
  const [procesandoPagoCredito, setProcesandoPagoCredito] = useState(false);

  const [procesandoCompra, setProcesandoCompra] = useState(null);
  const [mensajeTienda, setMensajeTienda] = useState(null);

  const [indiceActivo, setIndiceActivo] = useState(0);

  // Estado para Notificaciones Flotantes (Toast)
  const [notificacionToast, setNotificacionToast] = useState(null);

  // Estado para indicar qué campo se copió recientemente en el portapapeles
  const [copiadoTipo, setCopiadoTipo] = useState("");

  // Estados para el periodo seleccionado en el estado de cuenta (Mes y Año numéricos)
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const mostrarToast = (mensaje, tipo = "success") => {
    setNotificacionToast({ mensaje, tipo });
    setTimeout(() => {
      setNotificacionToast(null);
    }, 4000);
  };

  const copiarAlPortapapeles = (texto, tipo) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiadoTipo(tipo);
    mostrarToast(`¡${tipo} copiado al portapapeles!`, "success");
    setTimeout(() => {
      setCopiadoTipo("");
    }, 2000);
  };

  const productosTienda = [
    { id: 1, nombre: "Lápiz CEESUV", costo: 5, icono: "✏️" },
    { id: 2, nombre: "Libreta Profesional", costo: 15, icono: "📓" },
    { id: 3, nombre: "Pase de Tarea Extra", costo: 30, icono: "⭐" },
    { id: 4, nombre: "Goma y Sacapuntas", costo: 8, icono: "📐" }
  ];

  // Identificar si el alumno pertenece a Primaria
  const esPrimaria = (() => {
    const nivel = (alumno?.nivel || alumno?.nivel_escolar || alumno?.seccion || "").toLowerCase();
    const grado = String(alumno?.grado || "").toLowerCase();
    return nivel.includes("primaria") || grado.includes("primaria");
  })();

  // Lista de meses estructurada con número y nombre para el selector del estado de cuenta
  const listaMesesDisponibles = [
    { numero: 1, nombre: "ENERO" },
    { numero: 2, nombre: "FEBRERO" },
    { numero: 3, nombre: "MARZO" },
    { numero: 4, nombre: "ABRIL" },
    { numero: 5, nombre: "MAYO" },
    { numero: 6, nombre: "JUNIO" },
    { numero: 7, nombre: "JULIO" },
    { numero: 8, nombre: "AGOSTO" },
    { numero: 9, nombre: "SEPTIEMBRE" },
    { numero: 10, nombre: "OCTUBRE" },
    { numero: 11, nombre: "NOVIEMBRE" },
    { numero: 12, nombre: "DICIEMBRE" }
  ];

  const aniosDisponibles = [2026, 2027];

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
            `https://banco-ceesuv-backend.onrender.com/api/alumnos/${param}?_t=${new Date().getTime()}`
          );

          if (resAlumno.ok) {
            const data = await resAlumno.json();
            datosAlumno = Array.isArray(data) ? data[0] : (data.alumno || data);
            listaMovimientos =
              data.movimientos || datosAlumno?.movimientos || listaMovimientos;
          } else {
            const resTodosAlumnos = await fetch(
              `https://banco-ceesuv-backend.onrender.com/api/alumnos`
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
          console.warn("Consulta individual omitida:", err);
        }
      }

      setAlumno(datosAlumno);

      // Obtención de movimientos filtrados por periodo (mes y año)
      try {
        const alumnoId = datosAlumno?.alumno_id || datosAlumno?.id || identifier;
        if (alumnoId) {
          const resMovs = await fetch(
            `https://banco-ceesuv-backend.onrender.com/api/estado-cuenta/${alumnoId}?mes=${mesSeleccionado}&anio=${anioSeleccionado}`
          );

          if (resMovs.ok) {
            const dataEstadoCuenta = await resMovs.json();
            if (dataEstadoCuenta && dataEstadoCuenta.movimientos) {
              listaMovimientos = dataEstadoCuenta.movimientos;
            }
          }
        }
      } catch (err) {
        console.warn("Consulta de estado de cuenta por periodo no disponible, usando respaldo general:", err);
        try {
          const resMovs = await fetch(
            `https://banco-ceesuv-backend.onrender.com/api/movimientos`
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
        } catch (e) {
          console.warn("Consulta de movimientos general omitida:", e);
        }
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
  }, [navigate, mesSeleccionado, anioSeleccionado]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const nombreCompletoAlumno = (
    alumno?.nombre_completo ||
    `${alumno?.nombre || ""} ${alumno?.apellidos || alumno?.apellido || ""}`
  ).trim().toUpperCase() || alumno?.usuario || "ESTUDIANTE";

  const handleOperacionAhorro = async (tipoAccion) => {
    if (!montoAhorro || isNaN(montoAhorro) || Number(montoAhorro) <= 0) {
      const msg = "Ingresa una cantidad válida.";
      setMensajeAccion({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }

    const alumnoId = alumno?.alumno_id || alumno?.id;
    if (!alumnoId) {
      const msg = "No se identificó el ID del alumno.";
      setMensajeAccion({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }

    setProcesando(true);
    setMensajeAccion(null);

    try {
      const response = await fetch("https://banco-ceesuv-backend.onrender.com/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumno_id: Number(alumnoId),
          tipo: tipoAccion,
          cantidad: Number(montoAhorro),
          motivo: tipoAccion === "AHORRO_DEPOSITO" ? "Depósito a cuenta de ahorro" : "Retiro desde cuenta de ahorro",
          usuario: nombreCompletoAlumno
        })
      });

      if (response.ok) {
        const exitoMsg = "¡Operación de ahorro realizada con éxito!";
        setMensajeAccion({ tipo: "success", texto: exitoMsg });
        mostrarToast(exitoMsg, "success");
        setMontoAhorro("");
        await cargarDatosEstudiante();
      } else {
        let mensajeError = "Error al procesar la operación.";
        try {
          const data = await response.json();
          if (data && data.mensaje) mensajeError = data.mensaje;
        } catch (e) {}
        setMensajeAccion({ tipo: "error", texto: mensajeError });
        mostrarToast(mensajeError, "error");
      }
    } catch (error) {
      const errNet = "Error de conexión con el servidor.";
      setMensajeAccion({ tipo: "error", texto: errNet });
      mostrarToast(errNet, "error");
    } finally {
      setProcesando(false);
    }
  };

  const handlePagarCredito = async () => {
    if (esPrimaria) return;

    const monto = Number(montoCreditoPago);
    const utilizado = Number(alumno?.credito_utilizado || 0);
    const disponibles = Number(alumno?.coins || 0);

    if (!monto || monto <= 0) {
      const msg = "Ingresa una cantidad válida para abonar.";
      setMensajeCreditoPago({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }
    if (monto > utilizado) {
      const msg = "El monto supera tu crédito utilizado actual.";
      setMensajeCreditoPago({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }
    if (monto > disponibles) {
      const msg = "No tienes suficientes Coins disponibles para este pago.";
      setMensajeCreditoPago({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }

    const alumnoId = alumno?.alumno_id || alumno?.id;
    setProcesandoPagoCredito(true);
    setMensajeCreditoPago(null);

    try {
      const response = await fetch("https://banco-ceesuv-backend.onrender.com/api/pagar-credito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumno_id: Number(alumnoId),
          monto_pago: monto,
          usuario: nombreCompletoAlumno
        })
      });

      if (response.ok) {
        const exitoMsg = "¡Crédito pagado exitosamente con tus Coins!";
        setMensajeCreditoPago({ tipo: "success", texto: exitoMsg });
        mostrarToast(exitoMsg, "success");
        setMontoCreditoPago("");
        await cargarDatosEstudiante();
      } else {
        let msg = "Error al procesar el pago de crédito.";
        try {
          const data = await response.json();
          if (data && (data.mensaje || data.error)) msg = data.mensaje || data.error;
        } catch (e) {}
        setMensajeCreditoPago({ tipo: "error", texto: msg });
        mostrarToast(msg, "error");
      }
    } catch (err) {
      const errNet = "Error de conexión con el servidor.";
      setMensajeCreditoPago({ tipo: "error", texto: errNet });
      mostrarToast(errNet, "error");
    } finally {
      setProcesandoPagoCredito(false);
    }
  };

  const handleComprar = async (producto) => {
    if (esPrimaria && metodoPago === "credito") {
      const msg = "Los alumnos de Primaria no pueden realizar compras a crédito.";
      setMensajeTienda({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }

    const alumnoId = alumno?.alumno_id || alumno?.id;

    if (!alumnoId) {
      const msg = "No se identificó el ID del alumno.";
      setMensajeTienda({ tipo: "error", texto: msg });
      mostrarToast(msg, "error");
      return;
    }

    setProcesandoCompra(producto.id);
    setMensajeTienda(null);

    try {
      let response;

      if (metodoPago === "credito") {
        if (esPrimaria) {
          const msg = "Acceso denegado a crédito para Primaria.";
          setMensajeTienda({ tipo: "error", texto: msg });
          mostrarToast(msg, "error");
          setProcesandoCompra(null);
          return;
        }

        const limite = Number(alumno?.limite_credito || 200);
        const utilizado = Number(alumno?.credito_utilizado || 0);
        const disponibleCredito = limite - utilizado;

        if (producto.costo > disponibleCredito) {
          const msg = `Crédito insuficiente. Disponible: $${disponibleCredito.toFixed(2)}`;
          setMensajeTienda({ tipo: "error", texto: msg });
          mostrarToast(msg, "error");
          setProcesandoCompra(null);
          return;
        }

        response = await fetch("https://banco-ceesuv-backend.onrender.com/api/comprar-credito", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alumno_id: Number(alumnoId),
            monto_compra: producto.costo,
            concepto: `Compra en Tienda: ${producto.nombre}`
          })
        });

      } else {
        if (Number(alumno?.coins || 0) < producto.costo) {
          const msg = `Saldo insuficiente de coins para comprar ${producto.nombre}.`;
          setMensajeTienda({ tipo: "error", texto: msg });
          mostrarToast(msg, "error");
          setProcesandoCompra(null);
          return;
        }

        response = await fetch("https://banco-ceesuv-backend.onrender.com/api/compras", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alumno_id: Number(alumnoId),
            producto_nombre: producto.nombre,
            costo: producto.costo,
            usuario: nombreCompletoAlumno
          })
        });
      }

      if (response.ok) {
        const mensajeExito = metodoPago === "credito" 
          ? `¡Compra a crédito de ${producto.nombre} exitosa!` 
          : `¡Has adquirido ${producto.nombre} con éxito!`;

        setMensajeTienda({ tipo: "success", texto: mensajeExito });
        mostrarToast(mensajeExito, "success");
        await cargarDatosEstudiante();
      } else {
        let mensajeError = "Error al procesar la compra.";
        try {
          const data = await response.json();
          if (data && (data.mensaje || data.error)) mensajeError = data.mensaje || data.error;
        } catch (e) {}
        setMensajeTienda({ tipo: "error", texto: mensajeError });
        mostrarToast(mensajeError, "error");
      }
    } catch (error) {
      const errNet = "Error de conexión con el servidor.";
      setMensajeTienda({ tipo: "error", texto: errNet });
      mostrarToast(errNet, "error");
    } finally {
      setProcesandoCompra(null);
    }
  };

  const obtenerColorTipo = (tipo) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return "#10B981";
    if (tipo === "SALIDA" || tipo === "COMPRA" || tipo === "PAGO_CREDITO" || tipo === "COMPRA_CREDITO") return "#EF4444";
    if (tipo === "AHORRO_DEPOSITO") return "#3B82F6";
    if (tipo === "AHORRO_RETIRO") return "#F59E0B";
    return "#333";
  };

  const obtenerSignoMonto = (tipo, cantidad) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO" || tipo === "AHORRO_RETIRO") return `+${cantidad}`;
    if (tipo === "SALIDA" || tipo === "AHORRO_DEPOSITO" || tipo === "COMPRA" || tipo === "PAGO_CREDITO" || tipo === "COMPRA_CREDITO") return `-${cantidad}`;
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

  const coinsDisponibles = Number(alumno?.coins ?? 0);
  const coinsAhorro = Number(alumno?.coins_ahorro ?? 0);
  const coinsTotales = coinsDisponibles + coinsAhorro;
  const creditoUtilizado = esPrimaria ? 0 : Number(alumno?.credito_utilizado ?? 0);
  const limiteCredito = esPrimaria ? 0 : Number(alumno?.limite_credito ?? 200);
  const creditoDisponible = esPrimaria ? 0 : limiteCredito - creditoUtilizado;
  const matricula = alumno?.matricula || alumno?.id || "N/A";

  const usdMxn = tasas?.usd || "17.50";
  const eurMxn = tasas?.eur || "19.05";
  const cadMxn = tasas?.cad || "12.80";

  const movimientosAhorro = movimientos.filter(m => 
    m.tipo === "AHORRO_DEPOSITO" || m.tipo === "AHORRO_RETIRO" || m.tipo === "AHORRO_RENDIMIENTO"
  );

  const nombreMesActual = listaMesesDisponibles.find(m => m.numero === Number(mesSeleccionado))?.nombre || "MES";

  return (
    <>
      <style>{`
        body {
          margin: 0;
          background-color: #0c1527;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: white;
        }

        .dashboard-wrapper {
          min-height: 100vh;
          background-image: linear-gradient(rgba(12, 21, 39, 0.45), rgba(12, 21, 39, 0.50)), url('/fachada-ceesuv.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }

        .toast-notif {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          padding: 14px 20px;
          border-radius: 12px;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
          animation: slideInDown 0.3s ease-out forwards;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .toast-success { background: rgba(16, 185, 129, 0.9); }
        .toast-error { background: rgba(239, 68, 68, 0.9); }

        @keyframes slideInDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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

        .brand-logo-container {
          background-color: #ffffff;
          border: 2px solid #D4AF37;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .brand-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }

        .brand-title {
          font-size: 15px;
          font-weight: bold;
          color: #f59e0b;
          margin: 0;
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

        .modern-tabs-bar {
          display: flex;
          gap: 8px;
          background: rgba(12, 21, 39, 0.75);
          backdrop-filter: blur(12px);
          padding: 6px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 25px;
          overflow-x: auto;
        }

        .modern-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 12px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          color: #94a3b8;
          background: transparent;
          transition: 0.2s;
        }

        .modern-tab-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        .modern-tab-btn.active {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #0c1527;
          font-weight: bold;
        }

        .card-stat {
          background-color: rgba(19, 34, 56, 0.88);
          border: 1px solid #1e3250;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        }

        .btn-guardar { background-color: #2563eb; color: white; }
        .btn-retirar { background-color: #d97706; color: white; }
        .btn-comprar { background-color: #10b981; color: white; margin-top: 8px; font-size: 12px; }

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
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 180px;
          box-sizing: border-box;
          margin: 0 8px;
        }

        .tarjeta-inactiva { transform: scale(0.85); opacity: 0.4; filter: brightness(0.7); }
        .tarjeta-activa { transform: scale(1.1); opacity: 1; filter: brightness(1); border-color: #10b981; z-index: 10; }

        .alerta {
          padding: 12px;
          border-radius: 8px;
          margin-top: 12px;
          font-size: 13px;
        }
        .alerta-danger {
          background-color: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .alerta-warning {
          background-color: rgba(245, 158, 11, 0.2);
          color: #fcd34d;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
        .alerta-info {
          background-color: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        /* ESTILOS PROFESIONALES PARA EL ESTADO DE CUENTA TIPO BANCARIO Y SU IMPRESIÓN */
        .statement-sheet {
          background: #ffffff;
          color: #1e293b;
          padding: 30px;
          border-radius: 12px;
          max-width: 800px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .statement-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 3px solid #0f172a;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .bank-title {
          color: #0f172a;
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .bank-subtitle {
          margin: 0;
          font-size: 11px;
          color: #64748b;
          font-weight: bold;
        }
        .statement-meta-box {
          background: #f1f5f9;
          padding: 10px;
          border-radius: 6px;
          font-size: 11px;
          width: 250px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .statement-client-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .client-box, .branch-box {
          width: 48%;
          background: #f8fafc;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #d4af37;
        }
        .section-label {
          font-size: 10px;
          color: #64748b;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .client-box h3 {
          margin: 0 0 5px 0;
          font-size: 15px;
          color: #0f172a;
        }
        .financial-grid {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
        }
        .financial-col {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
        }
        .financial-col h4 {
          margin: 0 0 10px 0;
          font-size: 13px;
          color: #0f172a;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 5px;
        }
        .fin-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
        }
        .highlight-row {
          border-top: 1px dashed #cbd5e1;
          padding-top: 6px;
          font-weight: bold;
          color: #0f172a;
        }
        .movements-section h4 {
          font-size: 13px;
          color: #0f172a;
          margin-bottom: 10px;
        }
        .statement-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 20px;
        }
        .statement-table th {
          background: #0f172a;
          color: #ffffff;
          text-align: left;
          padding: 8px;
        }
        .statement-table td {
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b !important;
        }
        .statement-footer {
          text-align: center;
          font-size: 9px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }
          .statement-sheet, .statement-sheet * {
            visibility: visible !important;
          }
          .statement-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {notificacionToast && (
        <div className={`toast-notif ${notificacionToast.tipo === "error" ? "toast-error" : "toast-success"}`}>
          {notificacionToast.tipo === "error" ? "⚠️ " : "✅ "} {notificacionToast.mensaje}
        </div>
      )}

      <div className="dashboard-wrapper">
        <header className="portal-header">
          <div className="portal-brand">
            <div className="brand-logo-container">
              <img src="/logo-ceesuv.png" alt="Logo CEESUV" className="brand-logo" />
            </div>
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
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>{nombreCompletoAlumno}</p>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Matrícula: {matricula}</p>
            </div>
            <button onClick={handleLogout} className="btn-logout">🚪 Salir</button>
          </div>
        </header>

        <main className="portal-container">
          <div className="card-dark">
            <h2 style={{ margin: 0, fontSize: "22px" }}>¡Bienvenido, {nombreCompletoAlumno}!</h2>
            <p style={{ margin: "8px 0 0 0", color: "#94a3b8", fontSize: "14px" }}>
              Portal financiero institucional CEESUV. Administra tus cuentas, tarjetas, ahorros, pagos de crédito y estado de cuenta.
            </p>
          </div>

          <div className="grid-cards">
            <div className="card-stat">
              <div>
                <p className="stat-title">Saldo Disponible</p>
                <p className="stat-value" style={{ color: "#f59e0b" }}>{coinsDisponibles} <span style={{ fontSize: "12px", color: "#94a3b8" }}>COINS</span></p>
              </div>
              <div className="badge-icon">🪙</div>
            </div>

            <div className="card-stat">
              <div>
                <p className="stat-title">Saldo en Ahorro</p>
                <p className="stat-value" style={{ color: "#3b82f6" }}>{coinsAhorro} <span style={{ fontSize: "12px", color: "#94a3b8" }}>COINS</span></p>
              </div>
              <div className="badge-icon">🏦</div>
            </div>

            {!esPrimaria && (
              <div className="card-stat">
                <div>
                  <p className="stat-title">Crédito Utilizado</p>
                  <p className="stat-value" style={{ color: "#ef4444" }}>${creditoUtilizado.toFixed(2)} <span style={{ fontSize: "12px", color: "#94a3b8" }}>/ ${limiteCredito}</span></p>
                </div>
                <div className="badge-icon">💳</div>
              </div>
            )}
          </div>

          <nav className="modern-tabs-bar">
            <button onClick={() => setActiveTab('tarjetas')} className={`modern-tab-btn ${activeTab === 'tarjetas' ? 'active' : ''}`}>💳 Tarjetas</button>
            <button onClick={() => setActiveTab('transferencias')} className={`modern-tab-btn ${activeTab === 'transferencias' ? 'active' : ''}`}>🔄 Transferir</button>
            <button onClick={() => setActiveTab('ahorro')} className={`modern-tab-btn ${activeTab === 'ahorro' ? 'active' : ''}`}>🏛️ Ahorro</button>
            
            {!esPrimaria && (
              <button onClick={() => setActiveTab('credito')} className={`modern-tab-btn ${activeTab === 'credito' ? 'active' : ''}`}>💳 Pagar Crédito</button>
            )}

            <button onClick={() => setActiveTab('tienda')} className={`modern-tab-btn ${activeTab === 'tienda' ? 'active' : ''}`}>🛒 Tienda</button>
            <button onClick={() => setActiveTab('estadocuenta')} className={`modern-tab-btn ${activeTab === 'estadocuenta' ? 'active' : ''}`}>📄 Estado de Cuenta</button>
            <button onClick={() => setActiveTab('historial')} className={`modern-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}>🕒 Movimientos</button>
          </nav>

          <div>
            {activeTab === 'tarjetas' && (
              <div className="card-dark" style={{ textAlign: "center" }}>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>💳 Mis Tarjetas CEESUV</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>Consulta tus tarjetas digitales oficiales.</p>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "25px" }}>
                  <div>
                    <h4 style={{ color: "#FFF", marginBottom: "10px", fontSize: "14px" }}>Débito</h4>
                    <TarjetaDebito alumno={alumno} />
                  </div>
                  
                  {!esPrimaria && (
                    <div>
                      <h4 style={{ color: "#d4af37", marginBottom: "10px", fontSize: "14px" }}>Crédito</h4>
                      <TarjetaCredito alumno={alumno} />
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  marginTop: "30px", 
                  background: "rgba(12, 21, 39, 0.75)", 
                  border: "1px solid #1e3250", 
                  borderRadius: "14px", 
                  padding: "20px",
                  textAlign: "left",
                  maxWidth: "850px",
                  marginInline: "auto"
                }}>
                  <h4 style={{ color: "#d4af37", margin: "0 0 15px 0", fontSize: "16px", textAlign: "center" }}>
                    🏦 Datos de Tus Credenciales para Recibir Depósitos
                  </h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "15px" }}>
                    
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", boxSizing: "border-box" }}>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px", fontWeight: "bold" }}>
                        NÚMERO DE CUENTA (10 DÍGITOS)
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap" }}>
                          {alumno?.numero_cuenta || "No asignado"}
                        </span>
                        {alumno?.numero_cuenta && (
                          <button 
                            onClick={() => copiarAlPortapapeles(alumno.numero_cuenta, "Número de Cuenta")}
                            style={{ background: "#d4af37", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", color: "#0c1527", whiteSpace: "nowrap" }}
                          >
                            {copiadoTipo === "Número de Cuenta" ? "¡Copiado!" : "Copiar"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", boxSizing: "border-box" }}>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px", fontWeight: "bold" }}>
                        TARJETA DE DÉBITO (16 DÍGITOS)
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap" }}>
                          {(alumno?.tarjeta_debito || alumno?.tarjeta || alumno?.numero_tarjeta || "4820000000000001").replace(/\s+/g, "").match(/.{1,4}/g)?.join(" ")}
                        </span>
                        <button 
                          onClick={() => copiarAlPortapapeles(alumno?.tarjeta_debito || alumno?.tarjeta || alumno?.numero_tarjeta || "4820000000000001", "Tarjeta de Débito")}
                          style={{ background: "#eab308", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", color: "#0c1527", whiteSpace: "nowrap" }}
                        >
                          {copiadoTipo === "Tarjeta de Débito" ? "¡Copiado!" : "Copiar"}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", boxSizing: "border-box" }}>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px", fontWeight: "bold" }}>
                        CLABE INTERBANCARIA (18 DÍGITOS)
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap" }}>
                          {alumno?.clabe || "No asignada"}
                        </span>
                        {alumno?.clabe && (
                          <button 
                            onClick={() => copiarAlPortapapeles(alumno.clabe, "CLABE Interbancaria")}
                            style={{ background: "#d4af37", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "bold", color: "#0c1527", whiteSpace: "nowrap" }}
                          >
                            {copiadoTipo === "CLABE Interbancaria" ? "¡Copiado!" : "Copiar"}
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {activeTab === 'transferencias' && (
              <div className="card-dark">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap" }}>
                  <h3 style={{ margin: "0", fontSize: "18px", color: "#f59e0b" }}>💸 Módulo de Transferencias</h3>
                  <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "8px", padding: "6px 12px", color: "#10b981", fontWeight: "bold" }}>
                    Saldo disponible: {coinsDisponibles} COINS
                  </div>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
                  Envía coins a tus compañeros usando su número de cuenta.
                </p>
                <TransferenciaCoins alumnoActual={alumno} onTransferenciaExitosa={() => { cargarDatosEstudiante(); }} mostrarToast={mostrarToast} />
              </div>
            )}

            {activeTab === 'ahorro' && (
              <div className="card-dark">
                <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>📥 Gestión de Caja de Ahorro e Intereses</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "15px" }}>Mueve coins de tu saldo disponible a tu alcancía o consulta tus rendimientos generados.</p>
                
                <div className="ahorro-acciones" style={{ marginBottom: "20px" }}>
                  <input type="number" placeholder="Cantidad de coins" className="input-ahorro" value={montoAhorro} onChange={(e) => setMontoAhorro(e.target.value)} min="1" />
                  <button className="btn-accion btn-guardar" onClick={() => handleOperacionAhorro("AHORRO_DEPOSITO")} disabled={procesando}>
                    {procesando ? "Procesando..." : "➡️ Depositar a Ahorro"}
                  </button>
                  <button className="btn-accion btn-retirar" onClick={() => handleOperacionAhorro("AHORRO_RETIRO")} disabled={procesando}>
                    {procesando ? "Procesando..." : "⬅️ Retirar de Ahorro"}
                  </button>
                </div>

                {mensajeAccion && (
                  <p style={{ marginTop: "12px", fontSize: "14px", color: mensajeAccion.tipo === "error" ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
                    {mensajeAccion.texto}
                  </p>
                )}

                <hr style={{ borderColor: "#1e3250", margin: "25px 0" }} />

                <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#3b82f6" }}>📈 Historial de Ahorro e Intereses / Rendimientos</h4>
                {movimientosAhorro && movimientosAhorro.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table className="tabla-movs">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo de Operación</th>
                          <th>Monto</th>
                          <th>Detalle / Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientosAhorro.map((m, idx) => (
                          <tr key={m.id || idx}>
                            <td style={{ color: "#cbd5e1" }}>{m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}</td>
                            <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>{m.tipo}</td>
                            <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}</td>
                            <td style={{ color: "#cbd5e1" }}>{m.motivo || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "15px 0", fontSize: "13px" }}>Aún no hay movimientos registrados en tu caja de ahorro o rendimientos.</p>
                )}
              </div>
            )}

            {!esPrimaria && activeTab === 'credito' && (
              <div className="card-dark">
                <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>💳 Pagar Crédito con Coins</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "15px" }}>
                  Utiliza tus Coins disponibles para abonar a tu deuda de tarjeta de crédito y liberar línea de crédito.
                </p>
                
                <div style={{ background: "rgba(12, 21, 39, 0.6)", padding: "15px", borderRadius: "10px", marginBottom: "15px", border: "1px solid #1e3250" }}>
                  <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#94a3b8" }}>Crédito Utilizado: <strong style={{ color: "#ef4444" }}>${creditoUtilizado.toFixed(2)}</strong></p>
                  
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
                    Fecha Límite de Pago: <strong style={{ color: "#fff" }}>{alumno?.fecha_limite_pago ? new Date(alumno.fecha_limite_pago).toLocaleDateString() : "No asignada"}</strong>
                  </p>

                  {creditoUtilizado > 0 && alumno?.fecha_limite_pago && (() => {
                    const fechaLimite = new Date(alumno.fecha_limite_pago);
                    const hoy = new Date();
                    const diferenciaDias = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));

                    if (diferenciaDias < 0) {
                      return (
                        <div className="alerta alerta-danger">
                          ⚠️ <strong>¡Crédito Vencido!</strong> Tu fecha límite era el {fechaLimite.toLocaleDateString()}. Se está aplicando un 5% de interés moratorio semanal.
                        </div>
                      );
                    } else if (diferenciaDias <= 3) {
                      return (
                        <div className="alerta alerta-warning">
                          ⚠️ <strong>¡Atención!</strong> Tu crédito vence en {diferenciaDias} días ({fechaLimite.toLocaleDateString()}). Evita cargos extra pagando a tiempo.
                        </div>
                      );
                    } else {
                      return (
                        <div className="alerta alerta-info">
                          ℹ️ Tienes hasta el {fechaLimite.toLocaleDateString()} para liquidar tu crédito sin recargos.
                        </div>
                      );
                    }
                  })()}

                  <p style={{ margin: "10px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>Coins Disponibles para Pago: <strong style={{ color: "#10b981" }}>{coinsDisponibles} COINS</strong></p>
                </div>

                <div className="ahorro-acciones">
                  <input 
                    type="number" 
                    placeholder="Cantidad a pagar" 
                    className="input-ahorro" 
                    value={montoCreditoPago} 
                    onChange={(e) => setMontoCreditoPago(e.target.value)} 
                    min="1" 
                  />
                  <button 
                    className="btn-accion btn-guardar" 
                    onClick={handlePagarCredito} 
                    disabled={procesandoPagoCredito}
                  >
                    {procesandoPagoCredito ? "Procesando pago..." : "💳 Pagar Crédito con Coins"}
                  </button>
                </div>

                {mensajeCreditoPago && (
                  <p style={{ marginTop: "12px", fontSize: "14px", color: mensajeCreditoPago.tipo === "error" ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
                    {mensajeCreditoPago.texto}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'tienda' && (
              <div className="card-dark">
                <h3 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>🛒 Tienda Escolar</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 15px 0" }}>
                  {esPrimaria ? "Canjea tus coins." : "Canjea tus coins o usa crédito institucional."}
                </p>

                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <button onClick={() => setMetodoPago("coins")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: metodoPago === "coins" ? "2px solid #10b981" : "1px solid #1e3250", background: metodoPago === "coins" ? "rgba(16, 185, 129, 0.15)" : "rgba(12, 21, 39, 0.6)", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
                    🪙 Pagar con Coins ({coinsDisponibles})
                  </button>
                  
                  {!esPrimaria && (
                    <button onClick={() => setMetodoPago("credito")} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: metodoPago === "credito" ? "2px solid #d4af37" : "1px solid #1e3250", background: metodoPago === "credito" ? "rgba(212, 175, 55, 0.15)" : "rgba(12, 21, 39, 0.6)", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
                      💳 Tarjeta de Crédito (Disp: ${creditoDisponible.toFixed(2)})
                    </button>
                  )}
                </div>

                <div className="carrusel-contenedor">
                  {productosTienda.map((prod, index) => {
                    const esActivo = index === indiceActivo;
                    return (
                      <div key={prod.id} className={`tarjeta-producto ${esActivo ? "tarjeta-activa" : "tarjeta-inactiva"}`}>
                        <div>
                          <div style={{ fontSize: "28px", marginBottom: "6px" }}>{prod.icono}</div>
                          <p style={{ margin: "0 0 4px 0", fontWeight: "bold", fontSize: "13px" }}>{prod.nombre}</p>
                          <p style={{ margin: 0, color: "#f59e0b", fontSize: "12px", fontWeight: "bold" }}>{prod.costo} COINS</p>
                        </div>
                        <button className="btn-accion btn-comprar" onClick={() => handleComprar(prod)} disabled={procesandoCompra === prod.id}>
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

            {activeTab === 'estadocuenta' && (
  <div>
    {/* PANEL DE SELECCIÓN DE PERIODO Y ACCIONES (Se oculta al imprimir) */}
    <div className="no-print card-dark" style={{ marginBottom: "20px" }}>
      <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#d4af37", fontWeight: "bold" }}>📅 SELECCIONAR PERIODO DE CONSULTA</p>
      
      <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap", marginBottom: "15px" }}>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>MES:</label>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(Number(e.target.value))}
            className="input-ahorro"
            style={{ cursor: "pointer" }}
          >
            {listaMesesDisponibles.map((m) => (
              <option key={m.numero} value={m.numero} style={{ background: "#0c1527", color: "white" }}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>AÑO:</label>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
            className="input-ahorro"
            style={{ cursor: "pointer" }}
          >
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio} style={{ background: "#0c1527", color: "white" }}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignSelf: "flex-end" }}>
          <button 
            onClick={() => window.print()}
            className="btn-accion btn-guardar" 
            style={{ width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
          >
            🖨️ Imprimir Estado de Cuenta
          </button>

          <button 
            onClick={descargarPDFEstadoCuenta}
            className="btn-accion" 
            style={{ width: "auto", background: "#10b981", color: "white", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
          >
            📥 Descargar Estado de Cuenta
          </button>
        </div>
      </div>
    </div>

    {/* DOCUMENTO TIPO ESTADO DE CUENTA BANCARIO CON ID PARA CAPTURA */}
    <div id="estado-de-cuenta-pdf" className="statement-sheet">
      
      <div className="statement-header">
        <div className="bank-brand">
          <h1 className="bank-title">BANCO CEESUV</h1>
          <p className="bank-subtitle">Sistema Financiero Escolar</p>
        </div>
        <div className="statement-meta-box">
          <div className="meta-row"><span>Estado de Cuenta</span> <strong>Página 1/1</strong></div>
          <div className="meta-row"><span>Periodo</span> <strong>{nombreMesActual} {anioSeleccionado}</strong></div>
          <div className="meta-row"><span>Fecha de Corte</span> <strong>{new Date().toLocaleDateString()}</strong></div>
          <div className="meta-row"><span>No. de Cuenta</span> <strong>{alumno?.numero_cuenta || "CEESUV-2026"}</strong></div>
          <div className="meta-row"><span>No. de Cliente</span> <strong>{alumno?.alumno_id || alumno?.id}</strong></div>
        </div>
      </div>

      <div className="statement-client-section">
        <div className="client-box">
          <p className="section-label">DATOS DEL TITULAR</p>
          <h3>{nombreCompletoAlumno}</h3>
          <p>Nivel: {alumno?.nivel || alumno?.grado_nivel || (esPrimaria ? "Primaria" : "Secundaria / Bachillerato")}</p>
          <p>CEESUV - MÉXICO</p>
        </div>
        <div className="branch-box">
          <p className="section-label">SUCURSAL Y CONTACTO</p>
          <p><strong>SUCURSAL:</strong> CEESUV</p>
          <p><strong>DIRECCIÓN:</strong> ANT. CARR. MÉXICO-LAREDO No. 617, COL. 20 DE NOVIEMBRE</p>
          <p><strong>PLAZA:</strong> CIUDAD VALLES, S.L.P.</p>
          <p><strong>TELÉFONO:</strong> 481-382-12-02</p>
        </div>
      </div>

      <div className="financial-grid">
        <div className="financial-col">
          <h4>Información Financiera</h4>
          <div className="fin-row"><span>Rendimiento / Tasa Anual</span> <strong>2.5%</strong></div>
          <div className="fin-row"><span>Días del Periodo</span> <strong>30</strong></div>
          <div className="fin-row"><span>Intereses a Favor (+)</span> <strong>0.00 Coins</strong></div>
          <div className="fin-row"><span>ISR Retenido (-)</span> <strong>0.00 Coins</strong></div>
        </div>
        <div className="financial-col">
          <h4>Comportamiento ({nombreMesActual} {anioSeleccionado})</h4>
          <div className="fin-row"><span>Saldo Anterior</span> <strong>0.00</strong></div>
          <div className="fin-row"><span>Depósitos / Abonos (+)</span> <strong>{coinsDisponibles}</strong></div>
          <div className="fin-row"><span>Retiros / Cargos (-)</span> <strong>0.00</strong></div>
          <div className="fin-row highlight-row"><span>Saldo Final</span> <strong>{coinsDisponibles} Coins</strong></div>
        </div>
      </div>

      <div className="movements-section">
        <h4>Detalle de Movimientos Realizados ({nombreMesActual} {anioSeleccionado})</h4>
        <table className="statement-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>DESCRIPCIÓN / CONCEPTO</th>
              <th>REFERENCIA</th>
              <th>CARGOS</th>
              <th>ABONOS</th>
              <th>SALDO</th>
            </tr>
          </thead>
          <tbody>
            {movimientos && movimientos.length > 0 ? (
              movimientos.map((mov, idx) => (
                <tr key={mov.id || idx}>
                  <td>{mov.fecha ? new Date(mov.fecha).toLocaleDateString() : "N/A"}</td>
                  <td>{mov.descripcion || mov.motivo || "Movimiento general"}</td>
                  <td>{mov.referencia || "REF-" + idx}</td>
                  <td style={{ color: (mov.tipo === 'SALIDA' || mov.tipo === 'COMPRA') ? '#ef4444' : 'inherit' }}>
                    {(mov.tipo === 'SALIDA' || mov.tipo === 'COMPRA') ? `- ${mov.cantidad}` : ''}
                  </td>
                  <td style={{ color: (mov.tipo === 'ENTRADA' || mov.tipo === 'AHORRO_DEPOSITO') ? '#10b981' : 'inherit' }}>
                    {(mov.tipo === 'ENTRADA' || mov.tipo === 'AHORRO_DEPOSITO') ? `+ ${mov.cantidad}` : ''}
                  </td>
                  <td><strong>{mov.saldo_final || "-"}</strong></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "15px", color: "#666" }}>
                  No hay movimientos registrados en este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="statement-footer">
        <p>BANCO CEESUV S.A., INSTITUCIÓN DE BANCA ESCOLAR, GRUPO FINANCIERO CEESUV</p>
        <p>Este documento es una representación impresa de un estado de cuenta digital generado para control interno escolar.</p>
      </div>

    </div>
  </div>
)}

            {activeTab === 'historial' && (
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
                            <td style={{ color: "#cbd5e1" }}>{m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}</td>
                            <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>{m.tipo}</td>
                            <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}</td>
                            <td style={{ color: "#cbd5e1" }}>{m.motivo || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
                    <p style={{ margin: 0, fontSize: "15px" }}>Aún no tienes movimientos registrados en este periodo.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}