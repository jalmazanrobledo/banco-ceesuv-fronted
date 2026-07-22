import { useEffect, useState } from "react";
import { obtenerAlumnos, registrarMovimiento } from "../services/api";
import Sidebar from "../components/Sidebar";

function Operaciones() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");
  
  // Estados para el Buscador Autocompletado
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);

  const [pestana, setPestana] = useState("directa"); // 'directa' o 'ahorro'

  // Formulario Operación Directa
  const [tipoDirecto, setTipoDirecto] = useState("ENTRADA");
  const [montoDirecto, setMontoDirecto] = useState("");
  const [motivoDirecto, setMotivoDirecto] = useState("");

  // Formulario Ahorro y Rendimiento
  const [tipoAhorro, setTipoAhorro] = useState("AHORRO_DEPOSITO");
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

  // Filtrado predictivo de alumnos segun lo escrito
  const alumnosFiltrados = alumnos.filter((a) => {
    const textoCompleto = `${a.nombre || ""} ${a.grado || ""} ${a.matricula || ""}`.toLowerCase();
    return textoCompleto.includes(busqueda.toLowerCase());
  });

  // Alumno actualmente seleccionado
  const alumnoActual = alumnos.find((a) => String(a.id) === String(alumnoSeleccionado));

  // Función al hacer clic en un alumno de la lista filtrada
  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno.id);
    setBusqueda(`${alumno.nombre} ${alumno.grado ? `(${alumno.grado})` : ""}`);
    setMostrarLista(false);
    setMensaje(null);
  };

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

        {/* SELECCIÓN DE ALUMNO CON BUSCADOR DINÁMICO */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,.08)",
            marginBottom: "25px",
            position: "relative"
          }}
        >
          <label style={{ fontWeight: "bold", color: "#0B2341", display: "block", marginBottom: "8px" }}>
            🔍 Buscar Alumno por Nombre o Grado:
          </label>

          {/* INPUT DE BÚSQUEDA */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={busqueda}
              placeholder="Escribe el nombre del alumno..."
              onChange={(e) => {
                setBusqueda(e.target.value);
                setMostrarLista(true);
                if (e.target.value === "") {
                  setAlumnoSeleccionado("");
                }
              }}
              onFocus={() => setMostrarLista(true)}
              style={{
                width: "100%",
                padding: "12px 15px",
                borderRadius: "8px",
                border: "1px solid #CCC",
                fontSize: "15px",
                boxSizing: "border-box"
              }}
            />

            {/* BOTÓN PARA LIMPIAR BÚSQUEDA */}
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setAlumnoSeleccionado("");
                  setMostrarLista(false);
                }}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "#888"
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* LISTA DESPLEGABLE PREDICTIVA */}
          {mostrarLista && busqueda.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #DDD",
                borderRadius: "0 0 8px 8px",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 100,
                listStyle: "none",
                margin: 0,
                padding: 0,
                boxShadow: "0 8px 16px rgba(0,0,0,0.15)"
              }}
            >
              {alumnosFiltrados.length > 0 ? (
                alumnosFiltrados.map((a) => (
                  <li
                    key={a.id}
                    onMouseDown={() => seleccionarAlumno(a)}
                    style={{
                      padding: "12px 15px",
                      cursor: "pointer",
                      borderBottom: "1px solid #EEE",
                      fontSize: "14px",
                      color: "#333",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F4F7FA")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <span><strong>{a.nombre}</strong></span>
                    <span style={{ fontSize: "12px", color: "#666", background: "#EAEAEA", padding: "2px 8px", borderRadius: "4px" }}>
                      {a.grado || "Sin grado"}
                    </span>
                  </li>
                ))
              ) : (
                <li style={{ padding: "12px 15px", color: "#888", fontSize: "14px" }}>
                  No se encontró ningún alumno con ese nombre.
                </li>
              )}
            </ul>
          )}

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
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC", marginBottom: "15px", boxSizing: "border-box" }}
            />

            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Motivo / Concepto:</label>
            <input
              type="text"
              value={motivoDirecto}
              onChange={(e) => setMotivoDirecto(e.target.value)}
              placeholder="Ej. Participación en clase / Compra en tiendita"
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC", marginBottom: "20px", boxSizing: "border-box" }}
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
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC", boxSizing: "border-box" }}
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
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CCC", marginBottom: "10px", boxSizing: "border-box" }}
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
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #CCC", boxSizing: "border-box" }}
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