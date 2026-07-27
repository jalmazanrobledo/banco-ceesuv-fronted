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
        let datosAlumno = userObj;
        let listaMovimientos = userObj.movimientos || [];

        // Identificador dinámico
        const identifier =
          userObj.id ||
          userObj.alumno_id ||
          userObj.usuario ||
          userObj.username ||
          userObj.nombre;

        // 1. Intento de consulta al endpoint individual con manejo de 404 / Fallback
        if (identifier) {
          const param = encodeURIComponent(identifier);
          try {
            const resAlumno = await fetch(
              `https://banco-ceesuv-backend.vercel.app/api/alumnos/${param}`
            );

            if (resAlumno.ok) {
              const data = await resAlumno.json();
              datosAlumno = Array.isArray(data) ? data[0] : (data.alumno || data);
              listaMovimientos =
                data.movimientos || datosAlumno?.movimientos || listaMovimientos;
            } else {
              // Si da 404 o falla, buscamos en el listado general de alumnos
              const resTodosAlumnos = await fetch(
                `https://banco-ceesuv-backend.vercel.app/api/alumnos`
              );
              if (resTodosAlumnos.ok) {
                const todosAlumnos = await resTodosAlumnos.json();
                const encontrado = todosAlumnos.find(
                  (a) =>
                    String(a.id) === String(identifier) ||
                    String(a.alumno_id) === String(identifier) ||
                    (a.nombre &&
                      userObj.nombre &&
                      a.nombre.toLowerCase() === userObj.nombre.toLowerCase())
                );
                if (encontrado) datosAlumno = encontrado;
              }
            }
          } catch (err) {
            console.warn("Consulta individual omitida o no disponible:", err);
          }
        }

        setAlumno(datosAlumno);

        // 2. Consulta de respaldo a /api/movimientos
        try {
          const resMovs = await fetch(
            `https://banco-ceesuv-backend.vercel.app/api/movimientos`
          );

          if (resMovs.ok) {
            const todosMovimientos = await resMovs.json();
            const nombreBuscado = (datosAlumno.nombre || userObj.nombre || "").toLowerCase();
            const idBuscado = String(
              datosAlumno.id || datosAlumno.alumno_id || userObj.id || ""
            );

            const misMovs = todosMovimientos.filter((m) => {
              const alumnoMov = (m.alumno || m.nombre || "").toLowerCase();
              const alumnoIdMov = String(
                m.alumno_id || m.alumnoId || m.id_alumno || ""
              );
              return (
                (idBuscado && alumnoIdMov === idBuscado) ||
                (nombreBuscado && alumnoMov.includes(nombreBuscado))
              );
            });

            if (misMovs.length > 0) {
              listaMovimientos = misMovs;
            }
          }
        } catch (err) {
          console.warn("Consulta a /api/movimientos no disponible:", err);
        }

        setMovimientos(listaMovimientos);
      } catch (error) {
        console.error("Error al procesar datos del alumno:", error);
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
    return "#333";
  };

  const obtenerSignoMonto = (tipo, cantidad) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return `+${cantidad}`;
    if (tipo === "SALIDA") return `-${cantidad}`;
    return `${cantidad}`;
  };

  if (cargando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0c1527",
          color: "white",
          padding: "40px",
          textAlign: "center"
        }}
      >
        <p>Cargando información del estudiante...</p>
      </div>
    );
  }

  const nombreAlumno = alumno?.nombre || alumno?.usuario || "Estudiante";
  const coinsTotales = Number(alumno?.coins ?? 0);
  const matricula = alumno?.matricula || alumno?.id || "N/A";

  return (
    <>
      <style>{`
        body {
          margin: 0;
          background-color: #0c1527;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: white;
        }

        .portal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 40px;
          background-color: #0f1c32;
          border-bottom: 1px solid #1a2a47;
        }

        .portal-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          background-color: #2563eb;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 20px;
        }

        .brand-title {
          font-size: 18px;
          font-weight: bold;
          color: #60a5fa;
          margin: 0;
        }

        .brand-sub {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .user-info-bar {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn-logout {
          background-color: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-logout:hover {
          background-color: #dc2626;
        }

        .portal-container {
          max-width: 1100px;
          margin: 30px auto;
          padding: 0 20px;
        }

        .card-dark {
          background-color: #132238;
          border: 1px solid #1e3250;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .grid-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .card-stat {
          background-color: #132238;
          border: 1px solid #1e3250;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .stat-title {
          color: #94a3b8;
          font-size: 14px;
          margin: 0 0 6px 0;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
        }

        .badge-icon {
          background: rgba(255,255,255,0.05);
          padding: 12px;
          border-radius: 12px;
          font-size: 24px;
        }

        .tabla-movs {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          text-align: left;
        }

        .tabla-movs th {
          padding: 12px;
          color: #94a3b8;
          border-bottom: 1px solid #1e3250;
          font-size: 14px;
        }

        .tabla-movs td {
          padding: 14px 12px;
          border-bottom: 1px solid #1e3250;
          font-size: 14px;
        }
      `}</style>

      <div>
        {/* Navbar */}
        <header className="portal-header">
          <div className="portal-brand">
            <div className="brand-icon">🎓</div>
            <div>
              <p className="brand-title">CEESUV</p>
              <p className="brand-sub">Portal del Estudiante</p>
            </div>
          </div>

          <div className="user-info-bar">
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
                {nombreAlumno}
              </p>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>
                Matrícula: {matricula}
              </p>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              🚪 Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="portal-container">
          <div className="card-dark">
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              🎓 ¡Bienvenido, {nombreAlumno}!
            </h2>
            <p style={{ margin: "8px 0 0 0", color: "#94a3b8", fontSize: "14px" }}>
              Aquí puedes consultar tu saldo acumulado de Coins y tus movimientos recientes en el sistema escolar.
            </p>
          </div>

          <div className="grid-cards">
            <div className="card-stat">
              <div>
                <p className="stat-title">Saldo Disponible</p>
                <p className="stat-value" style={{ color: "#f59e0b" }}>
                  {coinsTotales} <span style={{ fontSize: "14px", color: "#94a3b8" }}>COINS</span>
                </p>
              </div>
              <div className="badge-icon">🪙</div>
            </div>

            <div className="card-stat">
              <div>
                <p className="stat-title">Equivalente Estimado</p>
                <p className="stat-value" style={{ color: "#10b981" }}>
                  ${coinsTotales.toFixed(2)} <span style={{ fontSize: "14px", color: "#94a3b8" }}>MXN</span>
                </p>
              </div>
              <div className="badge-icon">💵</div>
            </div>
          </div>

          <div className="card-dark">
            <h3 style={{ margin: 0, fontSize: "18px" }}>🕒 Mis Últimos Movimientos</h3>

            {movimientos && movimientos.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="tabla-movs">
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
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
                <p style={{ margin: 0, fontSize: "15px" }}>Aún no tienes movimientos registrados.</p>
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