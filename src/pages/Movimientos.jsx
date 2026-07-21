import { useEffect, useState } from "react";
import { obtenerMovimientos } from "../services/api";
import Sidebar from "../components/Sidebar";

function Movimientos() {

  const [movimientos, setMovimientos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  async function cargar() {
    const datos = await obtenerMovimientos();
    setMovimientos(datos);
  }

  useEffect(() => {
    cargar();
  }, []);

  const movimientosFiltrados = movimientos.filter(m =>
    m.alumno.toLowerCase().includes(busqueda.toLowerCase())
  );

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

        <h1 style={{ color: "#0B2341" }}>
          💰 Movimientos CEESUV Coins
        </h1>

        <h2 style={{ color: "#666" }}>
          Historial de movimientos
        </h2>

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
            placeholder="🔎 Buscar alumno..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "350px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

        </div>

        <table
          style={{
            width: "100%",
            marginTop: "25px",
            background: "white",
            borderCollapse: "collapse",
            boxShadow: "0 5px 15px rgba(0,0,0,.15)"
          }}
        >

          <thead>

            <tr
              style={{
                background: "#0B2341",
                color: "white"
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

            {movimientosFiltrados.map((m) => (

              <tr key={m.id}>

                <td style={{ padding: "15px" }}>
                  {new Date(m.fecha).toLocaleString()}
                </td>

                <td>{m.alumno}</td>

                <td
                  style={{
                    color:
                      m.tipo === "ENTRADA"
                        ? "green"
                        : "red",
                    fontWeight: "bold"
                  }}
                >
                  {m.tipo}
                </td>

                <td
  style={{
    fontWeight: "bold",
    color: m.tipo === "ENTRADA" ? "green" : "red"
  }}
>
  {m.tipo === "ENTRADA"
    ? `+${m.cantidad}`
    : `-${m.cantidad}`}
</td>

                <td>{m.motivo}</td>

                <td>{m.usuario}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Movimientos;