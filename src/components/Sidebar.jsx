import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoCeesuv from "/logo-ceesuv.png";

function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. LEER LA CLAVE CORRECTA ("usuarioCEESUV")
  const resSesion = JSON.parse(localStorage.getItem("usuarioCEESUV")) || {};
  
  // Extraer el objeto interno si el backend responde { usuario: { ... } } o la respuesta directa
  const datosUsuario = resSesion.usuario || resSesion;

  // 2. EXTRAER NOMBRE Y ROL DINÁMICAMENTE
  const nombreUsuario = 
    datosUsuario.nombre_completo || 
    datosUsuario.nombre || 
    datosUsuario.username ||
    datosUsuario.usuario ||
    "Usuario";

  const rolUsuario = (
    datosUsuario.rol || 
    datosUsuario.role || 
    datosUsuario.tipo ||
    "docente"
  ).toString().toLowerCase().trim();

  // 3. VALIDAR SI ES ADMINISTRADOR
  const esAdmin = 
    rolUsuario === "admin" || 
    rolUsuario === "administrador" ||
    datosUsuario.es_admin === true;

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem("usuarioCEESUV");
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
      {/* ... (Tus estilos CSS del sidebar) ... */}

      <div className="sidebar-wrapper">
        <div>
          {/* LOGO E IDENTIFICADOR */}
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

          {/* MENÚ DE NAVEGACIÓN */}
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

            {/* CONDICIONAL: SOLO SE MUESTRA SI ES ADMINISTRADOR */}
            {esAdmin && (
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