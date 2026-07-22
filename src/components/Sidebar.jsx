import { Link, useLocation, useNavigate } from "react-router-dom";
import logoCeesuv from "/logo-ceesuv.png"; // Importación directa del archivo

function Sidebar() {
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
    <div
      style={{
        width: "240px",
        backgroundColor: "#0B2341",
        color: "white",
        minHeight: "100vh",
        padding: "20px 15px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}
    >
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
          <Link to="/dashboard" style={{ textDecoration: "none" }}>
            <button style={estylosBoton("/dashboard")}>
              🏠 Inicio
            </button>
          </Link>

          <Link to="/alumnos" style={{ textDecoration: "none" }}>
            <button style={estylosBoton("/alumnos")}>
              👨‍🎓 Alumnos
            </button>
          </Link>

          <Link to="/operaciones" style={{ textDecoration: "none" }}>
            <button style={estylosBoton("/operaciones")}>
              💳 Operaciones
            </button>
          </Link>

          <Link to="/movimientos" style={{ textDecoration: "none" }}>
            <button style={estylosBoton("/movimientos")}>
              💰 Movimientos
            </button>
          </Link>

          <Link to="/usuarios" style={{ textDecoration: "none" }}>
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
  );
}

export default Sidebar;