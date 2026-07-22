import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerAlumnos, registrarMovimiento } from "../services/api";

function Operaciones() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoId, setAlumnoId] = useState("");
  const [tabActiva, setTabActiva] = useState("directo"); // 'directo' o 'ahorro'

  // Formulario Operación Directa
  const [tipoDirecto, setTipoDirecto] = useState("ENTRADA");
  const [montoDirecto, setMontoDirecto] = useState(50);
  const [motivoDirecto, setMotivoDirecto] = useState("Buena conducta (+50)");

  // Formulario Ahorro
  const [tipoAhorro, setTipoAhorro] = useState("DEPOSITO"); // 'DEPOSITO', 'RETIRO', 'RENDIMIENTO'
  const [montoAhorro, setMontoAhorro] = useState(30);
  const [porcentajeRendimiento, setPorcentajeRendimiento] = useState(10); // 10% semanal/mensual

  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const data = await obtenerAlumnos();
      setAlumnos(data || []);
      if (data && data.length > 0 && !alumnoId) {
        setAlumnoId(data[0].id);
      }
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
    }
  };

  const alumnoSeleccionado = alumnos.find((a) => String(a.id) === String(alumnoId));

  // Opciones predefinidas rápidas para agilizar la captura en clase
  const aplicarAtajo = (monto, motivo, tipo) => {
    setMontoDirecto(monto);
    setMotivoDirecto(motivo);
    setTipoDirecto(tipo);
  };

  // 1. Ejecutar Abono o Cargo Directo
  const handleOperacionDirecta = async (e) => {
    e.preventDefault();
    if (!alumnoId || montoDirecto <= 0) return;

    try {
      await registrarMovimiento({
        alumno_id: alumnoId,
        tipo: tipoDirecto,
        cantidad: Number(montoDirecto),
        motivo: motivoDirecto
      });

      setMensaje({ tipo: "exito", texto: `¡Operación registrada con éxito a ${alumnoSeleccionado.nombre}!` });
      cargarAlumnos();
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error al procesar la transacción." });
    }
  };

  // 2. Ejecutar Operación de Ahorro / Rendimiento
  const handleOperacionAhorro = async (e) => {
    e.preventDefault();
    if (!alumnoId) return;

    let cantidadCalculada = Number(montoAhorro);
    let motivoFinal = "";

    if (tipoAhorro === "DEPOSITO") {
      motivoFinal = `Depósito a cuenta de ahorro (${cantidadCalculada} coins)`;
    } else if (tipoAhorro === "RETIRO") {
      motivoFinal = `Retiro de cuenta de ahorro (${cantidadCalculada} coins)`;
    } else if (tipoAhorro === "RENDIMIENTO") {
      const ahorroActual = alumnoSeleccionado?.coins_ahorro || 0;
      cantidadCalculada = Math.round((ahorroActual * porcentajeRendimiento) / 100);
      motivoFinal = `Interés/Crecimiento de Ahorro (+${porcentajeRendimiento}%)`;
      if (cantidadCalculada <= 0) {
        setMensaje({ tipo: "error", texto: "El alumno no tiene saldo en ahorro suficiente para generar rendimiento." });
        return;
      }
    }

    try {
      await registrarMovimiento({
        alumno_id: alumnoId,
        tipo: `AHORRO_${tipoAhorro}`,
        cantidad: cantidadCalculada,
        motivo: motivoFinal
      });

      setMensaje({ tipo: "exito", texto: `¡Ahorro actualizado para ${alumnoSeleccionado.nombre}!` });
      cargarAlumnos();
    } catch (error) {
      setMensaje({ tipo: "error", texto: "Error al procesar la operación de ahorro." });
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F7FA", fontFamily: "sans-serif" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "30px" }}>
        {/* ENCABEZADO */}
        <div style={{ marginBottom: "25px" }}>
          <h1 style={{ color: "#0B2341", margin: 0, fontSize: "28px" }}>
            🏦 Operaciones Bancarias
          </h1>
          <p style={{ color: "#666", margin: "5px 0 0 0", fontSize: "15px" }}>
            Gestión de ingresos, cargos, cuenta de ahorro y rendimiento de intereses
          </p>
        </div>

        {mensaje && (
          <div style={{
            padding: "12px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "bold",
            backgroundColor: mensaje.tipo === "exito" ? "#D4EDDA" : "#F8D7DA",
            color: mensaje.tipo === "exito" ? "#155724" : "#721C24"
          }}>
            {mensaje.texto}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "25px" }}>
          
          {/* SELECCIÓN DE ALUMNO Y TARJETA DE SALDOS */}
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h3 style={{ color: "#0B2341", marginTop: 0 }}>👤 Seleccionar Alumno</h3>
            
            <select
              value={alumnoId}
              onChange={(e) => {
                setAlumnoId(e.target.value);
                setMensaje(null);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #CCC",
                fontSize: "15px",
                fontWeight: "bold",
                backgroundColor: "#FFF",
                marginBottom: "20px"
              }}
            >
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} - ({a.grado})
                </option>
              ))}
            </select>

            {alumnoSeleccionado && (
              <div style={{ background: "#F8F9FA", padding: "18px", borderRadius: "10px", border: "1px solid #E9ECEF" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#0B2341" }}>{alumnoSeleccionado.nombre}</h4>
                <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "13px" }}>Grado: <strong>{alumnoSeleccionado.grado}</strong></p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ background: "#E8F4FD", padding: "12px", borderRadius: "8px", color: "#0B2341" }}>
                    <span style={{ fontSize: "12px", color: "#555" }}>Saldo Disponible:</span>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#17A2B8" }}>
                      🪙 {alumnoSeleccionado.coins} Coins
                    </div>
                  </div>

                  <div style={{ background: "#FFF3CD", padding: "12px", borderRadius: "8px", color: "#856404" }}>
                    <span style={{ fontSize: "12px", color: "#856404" }}>Cuenta de Ahorro:</span>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#D4AF37" }}>
                      🏦 {alumnoSeleccionado.coins_ahorro || 0} Coins
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PANEL DE ACCIONES */}
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            
            {/* PESTAÑAS DE NAVEGACIÓN */}
            <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid #EEE", pb: "10px", marginBottom: "20px" }}>
              <button
                onClick={() => setTabActiva("directo")}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: tabActiva === "directo" ? "#0B2341" : "#E9ECEF",
                  color: tabActiva === "directo" ? "white" : "#333"
                }}
              >
                ⚡ Transacciones (+ / -)
              </button>
              <button
                onClick={() => setTabActiva("ahorro")}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: tabActiva === "ahorro" ? "#D4AF37" : "#E9ECEF",
                  color: tabActiva === "ahorro" ? "#0B2341" : "#333"
                }}
              >
                🏦 Ahorro y Rendimiento
              </button>
            </div>

            {/* CONTENIDO PESTAÑA 1: DIRECTO */}
            {tabActiva === "directo" && (
              <form onSubmit={handleOperacionDirecta}>
                <h4 style={{ margin: "0 0 15px 0", color: "#0B2341" }}>Botones Rápida Captura:</h4>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
                  <button type="button" onClick={() => aplicarAtajo(50, "Buena conducta (+50)", "ENTRADA")} style={{ padding: "8px 12px", background: "#28A745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                    🟢 +50 Buena Conducta
                  </button>
                  <button type="button" onClick={() => aplicarAtajo(30, "Cumplimiento de tarea (+30)", "ENTRADA")} style={{ padding: "8px 12px", background: "#28A745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                    🟢 +30 Tarea Cumplida
                  </button>
                  <button type="button" onClick={() => aplicarAtajo(50, "Falta / Indisciplina (-50)", "SALIDA")} style={{ padding: "8px 12px", background: "#DC3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                    🔴 -50 Mala Conducta
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Tipo de Operación:</label>
                    <select value={tipoDirecto} onChange={(e) => setTipoDirecto(e.target.value)} style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #CCC" }}>
                      <option value="ENTRADA">➕ Ingreso (Abonar)</option>
                      <option value="SALIDA">➖ Egreso (Descontar)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Cantidad de Coins:</label>
                    <input type="number" value={montoDirecto} onChange={(e) => setMontoDirecto(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #CCC", boxSizing: "border-box" }} />
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold" }}>Concepto / Motivo:</label>
                  <input type="text" value={motivoDirecto} onChange={(e) => setMotivoDirecto(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #CCC", boxSizing: "border-box" }} />
                </div>

                <button type="submit" style={{ width: "100%", padding: "12px", background: "#0B2341", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}>
                  💾 Registrar Movimiento Directo
                </button>
              </form>
            )}

            {/* CONTENIDO PESTAÑA 2: AHORRO */}
            {tabActiva === "ahorro" && (
              <form onSubmit={handleOperacionAhorro}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold" }}>Tipo de Operación de Ahorro:</label>
                  <select value={tipoAhorro} onChange={(e) => setTipoAhorro(e.target.value)} style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #CCC" }}>
                    <option value="DEPOSITO">📥 Depositar en Ahorro (Mover de Disponible a Ahorro)</option>
                    <option value="RETIRO">📤 Retirar de Ahorro (Mover de Ahorro a Disponible)</option>
                    <option value="RENDIMIENTO">📈 Aplicar Crecimiento / Rendimiento (% Interés)</option>
                  </select>
                </div>

                {tipoAhorro !== "RENDIMIENTO" ? (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "bold" }}>Monto a transferir:</label>
                    <input type="number" value={montoAhorro} onChange={(e) => setMontoAhorro(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #CCC", boxSizing: "border-box" }} />
                  </div>
                ) : (
                  <div style={{ background: "#FFF3CD", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "bold", color: "#856404" }}>Porcentaje de Rendimiento (%):</label>
                    <input type="number" value={porcentajeRendimiento} onChange={(e) => setPorcentajeRendimiento(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #CCC", boxSizing: "border-box" }} />
                    <small style={{ color: "#856404", display: "block", marginTop: "5px" }}>
                      Se calculará el {porcentajeRendimiento}% sobre el total ahorrado ({alumnoSeleccionado?.coins_ahorro || 0} coins).
                    </small>
                  </div>
                )}

                <button type="submit" style={{ width: "100%", padding: "12px", background: "#D4AF37", color: "#0B2341", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}>
                  🏦 Ejecutar Operación de Ahorro
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Operaciones;