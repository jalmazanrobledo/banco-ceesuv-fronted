import { Link, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const rolLwr = usuario?.rol?.toLowerCase() || "";
  const esAdmin = rolLwr.includes("admin");

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioCEESUV");
    navigate("/");
  };

  return (
    <aside style={styles.sidebar}>
      {/* HEADER LOGO */}
      <div style={styles.header}>
        <img src="/logo-ceesuv.png" alt="Logo CEESUV" style={styles.logo} />
        <div>
          <h2 style={styles.title}>CEESUV</h2>
          <span style={styles.subtitle}>Banco Escolar</span>
        </div>
      </div>

      {/* TARJETA USUARIO */}
      {usuario && (
        <div style={styles.userCard}>
          <span style={{ fontSize: "20px" }}>👤</span>
          <div>
            <p style={styles.userName}>{usuario.nombre || usuario.usuario}</p>
            <span style={styles.userRole}>{usuario.rol}</span>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN */}
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.link}>🏠 Inicio</Link>
        <Link to="/alumnos" style={styles.link}>👨‍🎓 Alumnos</Link>
        <Link to="/movimientos" style={styles.link}>💰 Movimientos</Link>
        {esAdmin && (
          <Link to="/usuarios" style={{ ...styles.link, color: "#f39c12" }}>
            👥 Usuarios
          </Link>
        )}
      </nav>

      {/* BOTÓN CERRAR SESIÓN */}
      <button onClick={cerrarSesion} style={styles.logoutBtn}>
        🚪 Cerrar Sesión
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    minWidth: "250px",
    backgroundColor: "#0B2341",
    color: "white",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "25px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "15px",
  },
  logo: {
    width: "50px",      /* 👈 Esto evita que el logo se vuelva gigante */
    height: "50px",
    objectFit: "contain",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: "11px",
    color: "#D4AF37",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  userCard: {
    background: "rgba(255,255,255,0.08)",
    padding: "10px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  userName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "bold",
  },
  userRole: {
    fontSize: "11px",
    color: "#17a2b8",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
  },
  link: {
    color: "white",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "500",
    backgroundColor: "rgba(255,255,255,0.05)",
    transition: "0.2s",
  },
  logoutBtn: {
    marginTop: "auto",
    padding: "10px",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Sidebar;