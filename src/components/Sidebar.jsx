import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoCeesuv from "/logo-ceesuv.png"; // Importación directa del archivo

function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Función para cerrar sesión de manera segura
  const handleCerrarSesion = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const estylosBoton = (path) => {
    const isActive = location.pathname === path;
    return {
      width: "100%",
      padding: "12px 15px",
      marginBottom: "8px",
      backgroundColor: isActive ? "#D4AF37" : "transparent",
      color: isActive ? "#0B2341" : "#E0E0E0",
      border: isActive ? "none" : "1px solid rgba(212, 175, 55, 0.2)",
      borderRadius: "8px",
      fontWeight: "bold",
      textAlign: "left",
      cursor: "pointer",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      transition: "all 0.2s ease-in-out",
      boxSizing: "border-box"
    };
  };

  return (
    <>
      <style>{`
        .sidebar-wrapper {
          width: 240px;
          background-color: #0B2341;
          color: white;
          min-height: 100vh;
          padding: 20px 15px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mobile-header-bar {
          display: none;
          background-color: #0B2341;
          color: white;
          padding: 12px 20px;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }

        /* Ajuste para dispositivos móviles (< 768px) */
        @media (max-width: 768px) {
          .mobile-header-bar {
            display: flex;
          }

          .sidebar-wrapper {
            width: 100%;
            min-height: auto;
            display: ${menuAbierto ? "flex" : "none"};
            padding: 15px;
            border-bottom: 2px solid #D4AF37;
          }
        }
      `}</style>

      {/* BARRA SUPERIOR MÓVIL (Solo visible en pantallas pequeñas) */}
      <div className="mobile-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img 
            src={logoCeesuv} 
            alt="Logo CEESUV" 
            style={{ width: "30px", height: "30px", objectFit: "contain" }} 
          />
          <span style={{ fontWeight: "bold", color: "#D4AF37", fontSize: "16px" }}>CEESUV</span>
        </div>
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{
            background: "transparent",
            border: "1px solid #D4AF37",
            color: "#D4AF37",
            fontSize: "18px",
            padding: "4px 10px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {menuAbierto ? "✖ Cerrar" : "☰ Menú"}
        </button>
      </div>

      {/* CONTENEDOR DEL SIDEBAR */}
      <div className="sidebar-wrapper">
        <div>
          {/* LOGO / TITULO */}
          <div style={{ marginBottom: "25px", textAlign: "center" }}>
            {/* Contenedor blanco redondo para contraste perfecto */}
            <div
              style={{
                width: "90px",
                height: "90px",
                backgroundColor: "#FFFFFF",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
                padding: "8px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4), 0 0 0 2px #D4AF37",
                boxSizing: "border-box"
              }}
            >
              <img 
                src={logoCeesuv} 
                alt="Logo CEESUV" 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "contain" 
                }} 
              />
            </div>

            <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "20px", letterSpacing: "1px" }}>
              CEESUV
            </h2>
            <span style={{ fontSize: "11px", color: "#B0C4DE", fontWeight: "600", letterSpacing: "1px" }}>
              BANCO ESCOLAR
            </span>
          </div>

          {/* NAVEGACIÓN */}
          <nav style={{ display: "flex", flexDirection: "column" }}>
            <Link to="/dashboard" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/dashboard")}>
                🏠 Inicio
              </button>
            </Link>

            <Link to="/alumnos" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/alumnos")}>
                👨‍🎓 Alumnos
              </button>
            </Link>

            <Link to="/operaciones" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/operaciones")}>
                💳 Operaciones
              </button>
            </Link>

            <Link to="/movimientos" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/movimientos")}>
                💰 Movimientos
              </button>
            </Link>

            <Link to="/usuarios" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/usuarios")}>
                👥 Usuarios
              </button>
            </Link>
          </nav>
        </div>

        {/* BOTÓN CERRAR SESIÓN */}
        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <button
            onClick={handleCerrarSesion}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#DC3545",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;