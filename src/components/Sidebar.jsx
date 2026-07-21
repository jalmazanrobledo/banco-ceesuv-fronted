import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  // Leemos la información del usuario logueado
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  function cerrarSesion() {
    localStorage.removeItem("usuarioCEESUV");
    navigate("/");
  }

  const estiloLink = {
    color: "white",
    textDecoration: "none",
    padding: "12px 15px",
    display: "block",
    borderRadius: "8px",
    marginBottom: "8px",
    background: "rgba(255,255,255,0.05)"
  };

  // Convertimos a minúsculas para evitar fallas si en BD dice "administrador" o "Administrador"
  const esAdmin = usuario?.rol?.toLowerCase() === "administrador";

  return (
    <div
      style={{
        width: "250px",
        background: "#0B2341",
        color: "white",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "100vh"
      }}
    >
      <div>
        <h2 style={{ textAlign: "center", marginBottom: "5px" }}>
          🏦 CEESUV
        </h2>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#AAA", marginBottom: "25px" }}>
          Banco Escolar
        </p>

        {/* Info del usuario logueado */}
        {usuario && (
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px"
            }}
          >
            <strong>👤 {usuario.nombre}</strong>
            <br />
            <small style={{ color: "#4DA6FF" }}>Rol: {usuario.rol}</small>
          </div>
        )}

        <nav>
          <Link to="/dashboard" style={estiloLink}>
            🏠 Inicio
          </Link>

          <Link to="/alumnos" style={estiloLink}>
            👨‍🎓 Alumnos
          </Link>

          <Link to="/movimientos" style={estiloLink}>
            💰 Movimientos
          </Link>

          {/* Se muestra si es Administrador */}
          {esAdmin && (
            <Link to="/usuarios" style={estiloLink}>
              👤 Usuarios
            </Link>
          )}
        </nav>
      </div>

      <button
        onClick={cerrarSesion}
        style={{
          width: "100%",
          padding: "10px",
          background: "#D32F2F",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        🚪 Cerrar Sesión
      </button>
    </div>
  );
}

export default Sidebar;