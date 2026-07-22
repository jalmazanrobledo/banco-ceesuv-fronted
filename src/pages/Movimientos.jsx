import { useEffect, useState } from "react";
import { obtenerMovimientos } from "../services/api";
import Sidebar from "../components/Sidebar";

function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    try {
      const datos = await obtenerMovimientos();
      setMovimientos(datos || []);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const movimientosFiltrados = movimientos.filter((m) =>
    (m.alumno || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  // Función para definir el color según el tipo de movimiento
  const obtenerColorTipo = (tipo) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return "green";
    if (tipo === "SALIDA") return "red";
    if (tipo === "AHORRO_DEPOSITO") return "#0B2341"; // Azul institucional
    if (tipo === "AHORRO_RETIRO") return "#D4AF37"; // Dorado
    return "#333";
  };

  // Función para mostrar el signo (+ o -)
  const obtenerSignoMonto = (tipo, cantidad) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return `+${cantidad}`;
    if (tipo === "SALIDA") return `-${cantidad}`;
    return `${cantidad}`; // Para depósitos y retiros de ahorro se muestra el valor de la transferencia
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F4F7FA"
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "30px"
        }}
      >
        <h1 style={{ color: "#0B2341", margin: 0 }}>
          💰 Movimientos CEESUV Coins
        </h1>

        <h3 style={{ color: "#666", marginTop: "5px" }}>
          Historial general de transacciones y ahorro
        </h3>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "25px",
            boxShadow: "0 5px 15px rgba(0,0,0,.15)"
          }}
        >
          <input
            type="text"
            placeholder="🔎 Buscar alumno por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "350px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              outline: "none"
            }}
          />
        </div>

        <table
          style={{
            width: "100%",
            marginTop: "25px",
            background: "white",
            borderCollapse: "collapse",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 5px 15px rgba(0,0,0,.15)"
          }}
        >
          <thead>
            <tr
              style={{
                background: "#0B2341",
                color: "white",
                textAlign: "left"
              }}
            >
              <th style={{ padding: "15px" }}>Fecha</th>
              <th>Alumno</th>
              <th>Tipo</th>
              <th>Coins</th>
              <th>Motivo</th>
              <th>Usuario</th>
            </tr>
          </thead>

          <tbody>
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "15px" }}>
                    {m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}
                  </td>

                  <td style={{ fontWeight: "bold", color: "#0B2341" }}>{m.alumno}</td>

                  <td
                    style={{
                      color: obtenerColorTipo(m.tipo),
                      fontWeight: "bold"
                    }}
                  >
                    {m.tipo}
                  </td>

                  <td
                    style={{
                      fontWeight: "bold",
                      color: obtenerColorTipo(m.tipo)
                    }}
                  >
                    🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}
                  </td>

                  <td>{m.motivo}</td>

                  <td>{m.usuario || "Sistema"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#777" }}>
                  No se encontraron movimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Movimientos;