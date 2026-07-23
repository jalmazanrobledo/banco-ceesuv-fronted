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
    <>
      <style>{`
        .movimientos-container {
          display: flex;
          min-height: 100vh;
          background: #F4F7FA;
          flex-direction: row;
        }

        .movimientos-main {
          flex: 1;
          padding: 30px;
          box-sizing: border-box;
          width: 100%;
        }

        .search-card {
          background: white;
          padding: 20px;
          border-radius: 15px;
          margin-top: 25px;
          box-shadow: 0 5px 15px rgba(0,0,0,.15);
        }

        .search-input {
          width: 350px;
          max-width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #ccc;
          outline: none;
          box-sizing: border-box;
        }

        .table-card {
          margin-top: 25px;
          background: white;
          border-radius: 10px;
          overflow-x: auto; /* Permite scroll horizontal en celulares */
          box-shadow: 0 5px 15px rgba(0,0,0,.15);
        }

        /* Estilos móviles (< 768px) */
        @media (max-width: 768px) {
          .movimientos-container {
            flex-direction: column;
          }

          .movimientos-main {
            padding: 15px;
          }

          .search-input {
            width: 100%;
          }
        }
      `}</style>

      <div className="movimientos-container">
        <Sidebar />

        <div className="movimientos-main">
          <h1 style={{ color: "#0B2341", margin: 0 }}>
            💰 Movimientos CEESUV Coins
          </h1>

          <h3 style={{ color: "#666", marginTop: "5px" }}>
            Historial general de transacciones y ahorro
          </h3>

          <div className="search-card">
            <input
              type="text"
              placeholder="🔎 Buscar alumno por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="table-card">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#333",
                minWidth: "650px"
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
                  <th style={{ padding: "15px" }}>Alumno</th>
                  <th style={{ padding: "15px" }}>Tipo</th>
                  <th style={{ padding: "15px" }}>Coins</th>
                  <th style={{ padding: "15px" }}>Motivo</th>
                  <th style={{ padding: "15px" }}>Usuario</th>
                </tr>
              </thead>

              <tbody>
                {movimientosFiltrados.length > 0 ? (
                  movimientosFiltrados.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "15px" }}>
                        {m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}
                      </td>

                      <td style={{ padding: "15px", fontWeight: "bold", color: "#0B2341" }}>
                        {m.alumno}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                          color: obtenerColorTipo(m.tipo),
                          fontWeight: "bold"
                        }}
                      >
                        {m.tipo}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                          fontWeight: "bold",
                          color: obtenerColorTipo(m.tipo)
                        }}
                      >
                        🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}
                      </td>

                      <td style={{ padding: "15px" }}>{m.motivo}</td>

                      <td style={{ padding: "15px" }}>{m.usuario || "Sistema"}</td>
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
      </div>
    </>
  );
}

export default Movimientos;