import { useEffect, useState } from "react";
import { FaUserGraduate, FaCoins, FaChartBar } from "react-icons/fa";
import { obtenerDashboard } from "../services/api";

function Dashboard() {
  const [datos, setDatos] = useState({
    alumnos: 0,
    coins: 0,
    movimientos: 0
  });

  useEffect(() => {
    async function cargar() {
      try {
        const respuesta = await obtenerDashboard();
        if (respuesta) {
          setDatos(respuesta);
        }
      } catch (err) {
        console.error("Error al cargar dashboard", err);
      }
    }
    cargar();
  }, []);

  return (
    <>
      <style>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          background: #F4F7FA;
          flex-direction: row;
        }

        .dashboard-main {
          position: relative;
          padding: 30px;
          flex: 1;
          overflow: hidden;
          box-sizing: border-box;
          min-height: calc(100vh - 60px);
        }

        .cards-grid {
          display: flex;
          gap: 20px;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        .card-responsive {
          background: rgba(255, 255, 255, 0.92);
          width: 220px;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(0,0,0,.12);
          text-align: center;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-sizing: border-box;
        }

        /* Ajustes para Pantallas Móviles (< 768px) */
        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }

          .dashboard-main {
            padding: 20px 15px;
          }

          .dashboard-title {
            font-size: 22px !important;
          }

          .dashboard-subtitle {
            font-size: 16px !important;
          }

          .cards-grid {
            margin-top: 20px;
            flex-direction: column;
            gap: 15px;
          }

          .card-responsive {
            width: 100%; /* Las tarjetas toman todo el ancho en celular */
            padding: 20px;
          }
        }
      `}</style>

      {/* CONTENEDOR PRINCIPAL CON FONDO DE LA ESCUELA */}
      <div className="dashboard-main">
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
          <h1 className="dashboard-title" style={{ color: "#0B2341", marginTop: 0 }}>
            🏦 Banco Escolar CEESUV
          </h1>

          <h2 className="dashboard-subtitle" style={{ color: "#555" }}>
            Panel Principal
          </h2>

          <div className="cards-grid">
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
    </>
  );
}

function Tarjeta({ icon, titulo, valor }) {
  return (
    <div className="card-responsive">
      <div style={{ color: "#0B2341" }}>{icon}</div>

      <h3 style={{ color: "#0B2341", marginBottom: "10px" }}>{titulo}</h3>

      <h1 style={{ color: "#D4AF37", margin: 0 }}>{valor}</h1>
    </div>
  );
}

export default Dashboard;