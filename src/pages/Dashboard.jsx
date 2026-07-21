import { useEffect, useState } from "react";
import { FaUserGraduate, FaCoins, FaChalkboardTeacher, FaChartBar } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import { obtenerDashboard } from "../services/api";
function Dashboard() {
  
  const [datos, setDatos] = useState({
  alumnos: 0,
  coins: 0,
  movimientos: 0
});

useEffect(() => {

  async function cargar() {

    const respuesta = await obtenerDashboard();

    setDatos(respuesta);

  }

  cargar();

}, []);
  
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F4F7FA"
      }}
    ><Sidebar />

    <div
    style={{
        padding: "30px",
        flex: 1,
        }}
        >
      <h1 style={{ color: "#0B2341" }}>
        🏦 Banco Escolar CEESUV
      </h1>

      <h2 style={{ color: "#666" }}>
        Panel Principal
      </h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "40px",
          flexWrap: "wrap",
        }}
      >
        <Tarjeta
          icon={<FaUserGraduate size={35} />}
          titulo="Alumnos"
          valor={datos.alumnos}
        />

        <Tarjeta
          icon={<FaCoins size={35} />}
          titulo="CEESUV Coins"
          valor={datos.coins.toLocaleString()}
        />

        <Tarjeta
          icon={<FaChalkboardTeacher size={35} />}
          titulo="Docentes"
          valor="18"
        />

        <Tarjeta
          icon={<FaChartBar size={35} />}
          titulo="Movimientos"
          valor={datos.movimientos}
        />
      </div>
      </div>
    </div>
  );
}

function Tarjeta({ icon, titulo, valor }) {
  return (
    <div
      style={{
        background: "white",
        width: "220px",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0 5px 15px rgba(0,0,0,.15)",
        textAlign: "center",
      }}
    >
      <div style={{ color: "#0B2341" }}>{icon}</div>

      <h3>{titulo}</h3>

      <h1 style={{ color: "#D4AF37" }}>{valor}</h1>
    </div>

    
  );
}

export default Dashboard;