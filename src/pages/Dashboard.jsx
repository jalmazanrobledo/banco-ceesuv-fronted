import { useEffect, useState } from "react";
import { FaUserGraduate, FaCoins, FaChartBar } from "react-icons/fa";
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
    >
      <Sidebar />

      {/* CONTENEDOR PRINCIPAL CON FONDO DE LA ESCUELA */}
      <div
        style={{
          position: "relative",
          padding: "30px",
          flex: 1,
          overflow: "hidden"
        }}
      >
        {/* Capa con la imagen de la escuela y difuminado */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('/fondo-escuela.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(5px) brightness(0.95)",
            transform: "scale(1.05)", // Evita bordes blancos generados por el blur
            zIndex: 1
          }}
        />

        {/* Capa de contraste semitransparente */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(244, 247, 250, 0.70)",
            zIndex: 2
          }}
        />

        {/* CONTENIDO PRINCIPAL (Encima del fondo) */}
        <div style={{ position: "relative", zIndex: 3 }}>
          <h1 style={{ color: "#0B2341", marginTop: 0 }}>
            🏦 Banco Escolar CEESUV
          </h1>

          <h2 style={{ color: "#555" }}>
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
              valor={datos.coins ? datos.coins.toLocaleString() : 0}
            />

            <Tarjeta
              icon={<FaChartBar size={35} />}
              titulo="Movimientos"
              valor={datos.movimientos}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tarjeta({ icon, titulo, valor }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        width: "220px",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0 8px 20px rgba(0,0,0,.12)",
        textAlign: "center",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.6)"
      }}
    >
      <div style={{ color: "#0B2341" }}>{icon}</div>

      <h3 style={{ color: "#0B2341", marginBottom: "10px" }}>{titulo}</h3>

      <h1 style={{ color: "#D4AF37", margin: 0 }}>{valor}</h1>
    </div>
  );
}

export default Dashboard;