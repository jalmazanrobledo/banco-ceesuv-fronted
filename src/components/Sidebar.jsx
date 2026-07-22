import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const estylosBoton = (path) => ({
    width: "100%",
    padding: "12px 15px",
    marginBottom: "10px",
    backgroundColor: location.pathname === path ? "#D4AF37" : "#0B2341",
    color: location.pathname === path ? "#0B2341" : "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.2s ease-in-out"
  });

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
        justify: "space-between"
      }}
    >
      <div>
        {/* LOGO / TITULO */}
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h2 style={{ margin: 0, color: "#D4AF37", fontSize: "22px" }}>CEESUV</h2>
          <span style={{ fontSize: "12px", color: "#AAA" }}>BANCO ESCOLAR</span>
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ display: "flex", flexDirection: "column" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button style={estylosBoton("/")}>
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
      <div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#DC3545",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

export default Sidebar;