import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoCeesuv from "/logo-ceesuv.png";

function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const navigate = useNavigate();

  // OBTENER DATOS DEL USUARIO LOGUEADO DESDE LOCALSTORAGE
  const usuarioGuardado = JSON.parse(localStorage.getItem("usuario")) || {};

  // Busca el nombre dinámicamente en distintas propiedades comunes del backend
  const nombreUsuario = 
    usuarioGuardado.nombre_completo || 
    usuarioGuardado.nombre || 
    usuarioGuardado.username ||
    usuarioGuardado.usuario ||
    usuarioGuardado.nombreUsuario ||
    localStorage.getItem("nombreUsuario") || 
    localStorage.getItem("usuario") || 
    "Usuario";

  // Busca el rol dinámicamente
  const rolUsuario = (
    usuarioGuardado.rol || 
    usuarioGuardado.role ||
    localStorage.getItem("rol") || 
    "usuario"
  ).toLowerCase();

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setEsMovil(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          padding: 10px 15px;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }

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

      {/* BARRA SUPERIOR MÓVIL */}
      <div className="mobile-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              backgroundColor: "#FFFFFF",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1.5px #D4AF37",
              boxSizing: "border-box"
            }}
          >
            <img 
              src={logoCeesuv} 
              alt="Logo CEESUV" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }} 
            />
          </div>
          <span style={{ fontWeight: "bold", color: "#D4AF37", fontSize: "16px", letterSpacing: "1px" }}>
            CEESUV
          </span>
        </div>

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{
            background: "transparent",
            border: "1px solid #D4AF37",
            color: "#D4AF37",
            fontSize: "15px",
            fontWeight: "bold",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          {menuAbierto ? "✖ Cerrar" : "☰ Menú"}
        </button>
      </div>

      {/* DESPLIEGUE SIDEBAR */}
      <div className="sidebar-wrapper">
        <div>
          {/* FOTO FACHADA EN MÓVIL / LOGO EN ESCRITORIO */}
          {esMovil ? (
            <div style={{ marginBottom: "15px", width: "100%" }}>
              <img 
                src="/fachada-ceesuv.png" 
                alt="Fachada CEESUV" 
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  border: "2px solid #D4AF37",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                  display: "block"
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: "15px", textAlign: "center" }}>
              <div
                style={{
                  width: "85px",
                  height: "85px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px auto",
                  padding: "8px",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.4), 0 0 0 2px #D4AF37",
                  boxSizing: "border-box"
                }}
              >
                <img 
                  src={logoCeesuv} 
                  alt="Logo CEESUV" 
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} 
                />
              </div>

              <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "18px", letterSpacing: "1px" }}>
                CEESUV
              </h2>
              <span style={{ fontSize: "11px", color: "#B0C4DE", fontWeight: "600", letterSpacing: "1px" }}>
                BANCO ESCOLAR
              </span>
            </div>
          )}

          {/* TARJETA IDENTIFICADORA DE USUARIO CONECTADO */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.07)",
              borderLeft: "3px solid #D4AF37",
              borderRadius: "6px",
              padding: "10px 12px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <span style={{ fontSize: "20px" }}>👤</span>
            <div style={{ overflow: "hidden" }}>
              <div 
                style={{ 
                  fontSize: "13px", 
                  fontWeight: "bold", 
                  color: "#FFFFFF",
                  lineHeight: "1.2",
                  marginBottom: "2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {nombreUsuario}
              </div>
              <div 
                style={{ 
                  fontSize: "10px", 
                  color: "#D4AF37", 
                  textTransform: "uppercase", 
                  fontWeight: "bold",
                  letterSpacing: "0.5px"
                }}
              >
                {rolUsuario}
              </div>
            </div>
          </div>

          {/* NAVEGACIÓN */}
          <nav style={{ display: "flex", flexDirection: "column" }}>
            <Link to="/dashboard" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/dashboard")}>🏠 Inicio</button>
            </Link>
            <Link to="/alumnos" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/alumnos")}>👨‍🎓 Alumnos</button>
            </Link>
            <Link to="/operaciones" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/operaciones")}>💳 Operaciones</button>
            </Link>
            <Link to="/movimientos" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
              <button style={estylosBoton("/movimientos")}>💰 Movimientos</button>
            </Link>

            {/* CONDICIONAL: SOLO SE MUESTRA SI EL USUARIO ES ADMINISTRADOR */}
            {(rolUsuario === "admin" || rolUsuario === "administrador") && (
              <Link to="/usuarios" style={{ textDecoration: "none" }} onClick={() => setMenuAbierto(false)}>
                <button style={estylosBoton("/usuarios")}>👥 Usuarios</button>
              </Link>
            )}
          </nav>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "15px" }}>
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