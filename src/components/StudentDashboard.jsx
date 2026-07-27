import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosEstudiante = async () => {
      try {
        const storedUser = localStorage.getItem("usuario");
        if (!storedUser) {
          navigate("/login");
          return;
        }

        const userObj = JSON.parse(storedUser);
        
        // Intentamos leer cualquier ID o usuario disponible
        const identifier = userObj.alumno_id || userObj.usuario || userObj.id || userObj.usuario_id;

        if (!identifier) {
          // Si por alguna razón el objeto local tiene los datos directos:
          setAlumno(userObj);
          setMovimientos(userObj.movimientos || []);
          setCargando(false);
          return;
        }

        const response = await fetch(
          `https://banco-ceesuv-backend.vercel.app/api/alumnos/${identifier}`
        );

        if (response.ok) {
          const data = await response.json();
          setAlumno(data.alumno || data);
          setMovimientos(data.movimientos || []);
        } else {
          // Si falla la API, usar los datos guardados en login como respaldo
          setAlumno(userObj);
          setMovimientos(userObj.movimientos || []);
        }
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosEstudiante();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const obtenerColorTipo = (tipo) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return "#10B981";
    if (tipo === "SALIDA") return "#EF4444";
    if (tipo === "AHORRO_DEPOSITO") return "#3B82F6";
    if (tipo === "AHORRO_RETIRO") return "#F59E0B";
    return "#9CA3AF";
  };

  const obtenerSignoMonto = (tipo, cantidad) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return `+${cantidad}`;
    if (tipo === "SALIDA") return `-${cantidad}`;
    return `${cantidad}`;
  };

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h2>Cargando portal del estudiante...</h2>
      </div>
    );
  }

  const coinsTotales = alumno?.coins ?? 0;

  return (
    <>
      <style>{`
        .student-body {
          min-height: 100vh;
          background-color: #0f172a;
          color: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
        }
        .header-dash {
          background-color: #1e293b;
          border-bottom: 1px solid #334155;
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-box {
          background-color: #2563eb;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 20px;
        }
        .title-ceesuv {
          color: #60a5fa;
          margin: 0;
          font-size: 18px;
          font-weight: bold;
        }
        .sub-ceesuv {
          color: #94a3b8;
          margin: 0;
          font-size: 12px;
        }
        .btn-logout {
          background-color: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-logout:hover {
          background-color: #b91c1c;
        }
        .main-container {
          max-width: 1000px;
          margin: 30px auto;
          padding: 0 20px;
        }
        .welcome-card {
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .stat-card {
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-label {
          color: #94a3b8;
          font-size: 14px;
          margin: 0 0 5px 0;
        }
        .card-value {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }
        .icon-badge {
          font-size: 28px;
          padding: 12px;
          border-radius: 12px;
        }
        .history-card {
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 16px;
          padding: 24px;
        }
        .custom-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .custom-table th {
          text-align: left;
          padding: 12px;
          color: #94a3b8;
          border-bottom: 1px solid #334155;
          font-size: 14px;
        }
        .custom-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #334155;
          font-size: 14px;
        }
      `}</style>

      <div className="student-body">
        {/* Encabezado */}
        <header className="header-dash">
          <div className="brand-logo">
            <div className="icon-box">🎓</div>
            <div>
              <h1 className="title-ceesuv">CEESUV</h1>
              <p className="sub-ceesuv">Portal del Estudiante</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
                {alumno?.nombre || "Juan Pablo Almazan"}
              </p>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>
                Matrícula: N/A
              </p>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="main-container">
          <div className="welcome-card">
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              🎓 ¡Bienvenido, {alumno?.nombre || "Estudiante"}!
            </h2>
            <p style={{ margin: "8px 0 0 0", color: "#94a3b8", fontSize: "14px" }}>
              Aquí puedes consultar tu saldo acumulado de Coins y tus movimientos recientes en el sistema escolar.
            </p>
          </div>

          <div className="cards-grid">
            <div className="stat-card">
              <div>
                <p className="card-label">Saldo Disponible</p>
                <p className="card-value" style={{ color: "#f59e0b" }}>
                  {coinsTotales} <span style={{ fontSize: "14px", color: "#cbd5e1" }}>COINS</span>
                </p>
              </div>
              <div className="icon-badge" style={{ background: "rgba(245, 158, 11, 0.1)" }}>🪙</div>
            </div>

            <div className="stat-card">
              <div>
                <p className="card-label">Equivalente Estimado</p>
                <p className="card-value" style={{ color: "#10b981" }}>
                  ${coinsTotales.toFixed(2)} <span style={{ fontSize: "14px", color: "#cbd5e1" }}>MXN</span>
                </p>
              </div>
              <div className="icon-badge" style={{ background: "rgba(16, 185, 129, 0.1)" }}>💵</div>
            </div>
          </div>

          <div className="history-card">
            <h3 style={{ margin: 0, fontSize: "18px" }}>🕒 Mis Últimos Movimientos</h3>

            {movimientos && movimientos.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="custom-table">
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
                        <td style={{ color: "#cbd5e1" }}>
                          {m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}
                        </td>
                        <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>
                          {m.tipo}
                        </td>
                        <td style={{ color: obtenerColorTipo(m.tipo), fontWeight: "bold" }}>
                          🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}
                        </td>
                        <td style={{ color: "#cbd5e1" }}>{m.motivo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                <p style={{ margin: 0, fontSize: "16px" }}>Aún no tienes movimientos registrados.</p>
                <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  Tus abonos y canjes de coins aparecerán reflejados en esta sección.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}