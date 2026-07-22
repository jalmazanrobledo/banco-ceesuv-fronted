import { useEffect, useState } from "react";
import { obtenerAlumnos, registrarMovimiento } from "../services/api";
import Sidebar from "../components/Sidebar";

function Operaciones() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");
  const [pestana, setPestana] = useState("directa"); // 'directa' o 'ahorro'

  // Formulario Operación Directa
  const [tipoDirecto, setTipoDirecto] = useState("ENTRADA");
  const [montoDirecto, setMontoDirecto] = useState("");
  const [motivoDirecto, setMotivoDirecto] = useState("");

  // Formulario Ahorro y Rendimiento
  const [tipoAhorro, setTipoAhorro] = useState("AHORRO_DEPOSITO"); // AHORRO_DEPOSITO, AHORRO_RETIRO, AHORRO_RENDIMIENTO
  const [montoAhorro, setMontoAhorro] = useState("");
  const [porcentajeInteres, setPorcentajeInteres] = useState("5");
  const [motivoAhorro, setMotivoAhorro] = useState("Abono a fondo de ahorro");

  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  async function cargarAlumnos() {
    try {
      const data = await obtenerAlumnos();
      setAlumnos(data || []);
    } catch (e) {
      console.error("Error al cargar alumnos:", e);
    }
  }

  // Alumno actualmente seleccionado en el select
  const alumnoActual = alumnos.find((a) => String(a.id) === String(alumnoSeleccionado));

  // Calcular rendimiento automático según porcentaje
  const calcularRendimiento = () => {
    if (!alumnoActual) return 0;
    const ahorroActual = alumnoActual.coins_ahorro || 0;
    const pct = parseFloat(porcentajeInteres) || 0;
    return Math.round((ahorroActual * pct) / 100);
  };

  // Enviar Operación Directa (ENTRADA / SALIDA)
  const handleOperacionDirecta = async (e) => {
    e.preventDefault();
    if (!alumnoSeleccionado || !montoDirecto) {
      alert("Selecciona un alumno e ingresa una cantidad.");
      return;
    }

    try {
      await registrarMovimiento({
        alumno_id: alumnoSeleccionado,
        tipo: tipoDirecto,
        cantidad: parseInt(montoDirecto),
        motivo: motivoDirecto || (tipoDirecto === "ENTRADA" ? "Abono general" : "Cargo general")
      });

      setMensaje({ tipo: "exito", texto: "¡Movimiento registrado con éxito!" });
      setMontoDirecto("");
      setMotivoDirecto("");
      cargarAlumnos();
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al registrar la operación." });
    }
  };

  // Enviar Operaciones de Ahorro / Rendimiento
  const handleOperacionAhorro = async (e) => {
    e.preventDefault();
    if (!alumnoSeleccionado) {
      alert("Selecciona un alumno primero.");
      return;
    }

    let cantidadFinal = parseInt(montoAhorro);
    let motivoFinal = motivoAhorro;

    if (tipoAhorro === "AHORRO_RENDIMIENTO") {
      cantidadFinal = calcularRendimiento();
      motivoFinal = `Pago de Rendimiento (${porcentajeInteres}%)`;
      if (cantidadFinal <= 0) {
        alert("El saldo ahorrado actual es 0, no genera rendimientos.");
        return;
      }
    } else if (!montoAhorro || cantidadFinal <= 0) {
      alert("Ingresa un monto válido para ahorrar o retirar.");
      return;
    }

    try {
      await registrarMovimiento({
        alumno_id: alumnoSeleccionado,
        tipo: tipoAhorro,
        cantidad: cantidadFinal,
        motivo: motivoFinal
      });

      setMensaje({ tipo: "exito", texto: "¡Operación de ahorro registrada con éxito!" });
      setMontoAhorro("");
      cargarAlumnos();
    } catch (err) {
      setMensaje({ tipo: "error", texto: "Error al procesar el ahorro o saldo insuficiente." });
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F4F7FA" }}>
      <Sidebar />

      <div style={{ flex: 1, padding: "30px" }}>
        <h1 style={{ color: "#0B2341", margin: 0 }}>💳 Módulo de Operaciones</h1>
        <p style={{ color: "#666" }}>Gestión de saldo disponible, ahorro e intereses de alumnos.</p>

        {mensaje && (
          <div
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              marginBottom: "20px",
              background: mensaje.tipo === "exito" ? "#D4EDDA" : "#F8D7DA",
              color: mensaje.tipo === "exito" ? "#155724" : "#721C24",
              fontWeight: "bold"
            }}
          >
            {mensaje.texto}
          </div>
        )}

        {/* SELECCIÓN DE ALUMNO */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            marginBottom: "25px"
          }}
        >
          <label style={{ fontWeight: "bold", color: "#0B2341", display: "block", marginBottom: "8px" }}>
            👤 Seleccionar Alumno:
          </label>
          <select
            value={alumnoSeleccionado}
            onChange={(e) => {
              setAlumnoSeleccionado(e.target.value);
              setMensaje(null);
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #CCC",
              fontSize: "16px"
            }}
          >
            <option value="">-- Selecciona un Alumno --</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} - {a.grado || "Sin grado"}
              </option>
            ))}
          </select>

          {/* TARJETAS DE SALDO EN TIEMPO REAL */}
          {alumnoActual && (
            <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
              <div style={{ flex: 1, background: "#E8F0FE", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", color: "#1A73E8", fontWeight: "bold" }}>DISPONIBLE</span>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0B2341" }}>
                  🪙 {alumnoActual.coins || 0} Coins
                </div>
              </div>
              <div style={{ flex: 1, background: "#FEF3D6", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "12px", color: "#B45309", fontWeight: "bold" }}>CUENTA DE AHORRO</span>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#B45309" }}>
                  🏦 {alumnoActual.coins_ahorro || 0} Coins
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            onClick={() => setPestana("directa")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              background: pestana === "directa" ? "#0B2341" : "#E0E0E0",
              color: pestana === "directa" ? "white" : "#333"
            }}
          >
            🟢 Operación Directa (Abono / Cargo)
          </button>
          <button
            onClick={() => setPestana("ahorro")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              background: pestana === "ahorro" ? "#D4AF37" : "#E0E0E0",
              color: pestana === "ahorro" ? "#0B2341" : "#333"
            }}
          >
            🏦 Ahorro y Rendimientos
          </button>
        </div>

        {/* FORMULARIO 1: OPERACIÓN DIRECTA */}
        {pestana === "directa" && (
          <form
            onSubmit={handleOperacionDirecta}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)"
            }}
          >
            <h3 style={{ marginTop: 0, color: "#0B2341" }}>Abono o Cargo Directo</h3>

            <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
              <button
                type="button"
                onClick={() => setTipoDirecto("ENTRADA")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "2px solid green",
                  background: tipoDirecto === "ENTRADA" ? "#D4EDDA" : "white",
                  color: "green",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                ➕ Abono (ENTRADA)
              </button>
              <button
                type="button"
                onClick={() => setTipoDirecto("SALIDA")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "2px solid red",
                  background: tipoDirecto === "SALIDA" ? "#F8D7DA" : "white",
                  color: "red",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                ➖ Cargo / Gasto (SALIDA)
              </button>
            </div>

            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Cantidad Coins:</label>
            <input
              type="number"
              value={montoDirecto}
              onChange={(e) => setMontoDirecto(e.target.value)}
              placeholder="Ej. 50"
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC", marginBottom: "15px" }}
            />

            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Motivo / Concepto:</label>
            <input
              type="text"
              value={motivoDirecto}
              onChange={(e) => setMotivoDirecto(e.target.value)}
              placeholder="Ej. Participación en clase / Compra en tiendita"
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC", marginBottom: "20px" }}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "#0B2341",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              💾 Registrar Movimiento Directo
            </button>
          </form>
        )}

        {/* FORMULARIO 2: AHORRO Y RENDIMIENTOS */}
        {pestana === "ahorro" && (
          <form
            onSubmit={handleOperacionAhorro}
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,.08)"
            }}
          >
            <h3 style={{ marginTop: 0, color: "#0B2341" }}>Operaciones de Ahorro e Intereses</h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Tipo de Operación:</label>
              <select
                value={tipoAhorro}
                onChange={(e) => {
                  setTipoAhorro(e.target.value);
                  if (e.target.value === "AHORRO_DEPOSITO") setMotivoAhorro("Transferencia a Cuenta de Ahorro");
                  if (e.target.value === "AHORRO_RETIRO") setMotivoAhorro("Retiro de Ahorro a Disponible");
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC" }}
              >
                <option value="AHORRO_DEPOSITO">📥 Depositar en Ahorro (Pasa de Disponible ➔ Ahorro)</option>
                <option value="AHORRO_RETIRO">📤 Retirar de Ahorro (Pasa de Ahorro ➔ Disponible)</option>
                <option value="AHORRO_RENDIMIENTO">📈 Generar Rendimiento / Interés Ganado</option>
              </select>
            </div>

            {/* SI ES RENDIMIENTO AUTOMÁTICO */}
            {tipoAhorro === "AHORRO_RENDIMIENTO" ? (
              <div style={{ background: "#FFF8E1", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Porcentaje de Interés (%):</label>
                <input
                  type="number"
                  value={porcentajeInteres}
                  onChange={(e) => setPorcentajeInteres(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC", marginBottom: "10px" }}
                />
                <div style={{ fontSize: "15px", color: "#B45309", fontWeight: "bold" }}>
                  💡 Interés ganado calculado: +{calcularRendimiento()} Coins
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Monto Coins:</label>
                <input
                  type="number"
                  value={montoAhorro}
                  onChange={(e) => setMontoAhorro(e.target.value)}
                  placeholder="Ej. 20"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC" }}
                />
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "#D4AF37",
                color: "#0B2341",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              🚀 Procesar Operación de Ahorro
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Operaciones;