import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { consultarPorQR } from "../services/api";

function ConsultaAlumno() {
  const { token } = useParams();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerDatos() {
      setCargando(true);
      try {
        if (token) {
          const resultado = await consultarPorQR(token);
          if (resultado && (resultado.alumno || resultado.nombre)) {
            setDatos(resultado.alumno ? resultado : { alumno: resultado, movimientos: resultado.movimientos || [] });
          } else {
            setDatos(null);
          }
        }
      } catch (error) {
        console.error("Error al consultar el QR:", error);
        setDatos(null);
      } finally {
        setCargando(false);
      }
    }

    obtenerDatos();
  }, [token]);

  // VISTA DE CARGA
  if (cargando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0B2341",
          color: "white",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "20px"
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "15px" }}>⏳</div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>Cargando información...</h2>
        <p style={{ color: "#D4AF37", fontSize: "14px", marginTop: "5px" }}>Banco Escolar CEESUV</p>
      </div>
    );
  }

  // VISTA DE ERROR
  if (!datos) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#F4F7FA",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            background: "white",
            padding: "35px 25px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            maxWidth: "380px",
            width: "100%"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>❌</div>
          <h2 style={{ color: "#B22222", margin: "0 0 10px 0", fontSize: "20px" }}>
            Código QR no válido
          </h2>
          <p style={{ color: "#666", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
            El código escaneado no corresponde a ningún alumno registrado en el sistema CEESUV.
          </p>
        </div>
      </div>
    );
  }

  const { alumno, movimientos = [] } = datos;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0B2341 0%, #1A3A60 220px, #F4F7FA 220px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px 15px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        boxSizing: "border-box"
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px", marginTop: "10px" }}>
        
        {/* ENCABEZADO INSTITUCIONAL CEESUV */}
        <div style={{ textAlign: "center", color: "white", marginBottom: "20px" }}>
          <img
            src="/logo-ceesuv.png"
            alt="Logo CEESUV"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "white",
              padding: "5px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              marginBottom: "10px",
              objectFit: "contain"
            }}
          />
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", letterSpacing: "0.5px" }}>
            CEESUV
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9, color: "#D4AF37", fontWeight: "600" }}>
            Portal de Consulta de Banco Escolar
          </p>
        </div>

        {/* TARJETA DE SALDOS Y ALUMNO */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "22px 20px",
            boxShadow: "0 10px 25px rgba(11, 35, 65, 0.12)",
            marginBottom: "20px"
          }}
        >
          {/* INFORMACIÓN DEL ALUMNO */}
          <div style={{ textAlign: "center", borderBottom: "1px solid #EEE", paddingBottom: "15px", marginBottom: "18px" }}>
            <h2 style={{ margin: "0 0 6px 0", color: "#0B2341", fontSize: "21px" }}>{alumno.nombre}</h2>
            <span
              style={{
                display: "inline-block",
                background: "#E8F0FE",
                color: "#1A73E8",
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "bold"
              }}
            >
              {alumno.grado || "Sin grado asignado"}
            </span>
          </div>

          {/* TARJETAS DE DISPONIBLE Y AHORRO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* DISPONIBLE */}
            <div
              style={{
                background: "linear-gradient(135deg, #1A73E8 0%, #0B57D0 100%)",
                color: "white",
                padding: "15px 10px",
                borderRadius: "12px",
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(26, 115, 232, 0.25)"
              }}
            >
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9, display: "block" }}>
                DISPONIBLE
              </span>
              <div style={{ fontSize: "22px", fontWeight: "bold", marginTop: "4px" }}>
                🪙 {alumno.coins || 0}
              </div>
            </div>

            {/* EN AHORRO */}
            <div
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #B48A16 100%)",
                color: "white",
                padding: "15px 10px",
                borderRadius: "12px",
                textAlign: "center",
                boxShadow: "0 4px 10px rgba(212, 175, 55, 0.25)"
              }}
            >
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.9, display: "block" }}>
                EN AHORRO
              </span>
              <div style={{ fontSize: "22px", fontWeight: "bold", marginTop: "4px" }}>
                🏦 {alumno.coins_ahorro || 0}
              </div>
            </div>
          </div>
        </div>

        {/* HISTORIAL DE MOVIMIENTOS */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.06)"
          }}
        >
          <h3 style={{ color: "#0B2341", marginTop: 0, marginBottom: "15px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            📊 Historial de Movimientos
          </h3>

          {movimientos.length === 0 ? (
            <p style={{ color: "#777", fontSize: "14px", textAlign: "center", margin: "15px 0" }}>
              Aún no hay movimientos registrados para este alumno.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {movimientos.map((m, index) => {
                const esPositivo = m.tipo === "ENTRADA" || m.tipo === "AHORRO_RENDIMIENTO";
                return (
                  <li
                    key={index}
                    style={{
                      padding: "12px 0",
                      borderBottom: index !== movimientos.length - 1 ? "1px solid #F0F0F0" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: esPositivo ? "#2E7D32" : "#D32F2F",
                          background: esPositivo ? "#E8F5E9" : "#FFEBEE",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          display: "inline-block",
                          marginBottom: "4px"
                        }}
                      >
                        {m.tipo}
                      </span>
                      <div style={{ fontSize: "13px", color: "#444", fontWeight: "500" }}>{m.motivo}</div>
                    </div>

                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: esPositivo ? "#2E7D32" : "#D32F2F"
                      }}
                    >
                      {esPositivo ? `+${m.cantidad}` : `-${m.cantidad}`} 🪙
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* PIE DE PÁGINA */}
        <div style={{ textAlign: "center", color: "#888", fontSize: "11px", marginTop: "20px", marginBottom: "20px" }}>
          © {new Date().getFullYear()} Centro de Estudios Elementales y Superiores de Valles
        </div>

      </div>
    </div>
  );
}

export default ConsultaAlumno;