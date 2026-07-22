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
      {/* HEADER LOGO CON FONDO BLANCO */}
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="/logo-ceesuv.png" alt="Logo CEESUV" style={styles.logo} />
        </div>
        <div>
          <h2 style={styles.title}>CEESUV</h2>
          <span style={styles.subtitle}>Banco Escolar</span>
        </div>
      </div>

      {/* TARJETA USUARIO (DORADO + TEXTO NEGRO) */}
      {usuario && (
        <div style={styles.goldCard}>
          <span style={{ fontSize: "20px" }}>👤</span>
          <div>
            <p style={styles.goldCardTitle}>{usuario.nombre || usuario.usuario}</p>
            <span style={styles.goldCardSub}>{usuario.rol}</span>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN (TODOS LOS BOTONES EN DORADO + TEXTO NEGRO) */}
      <nav style={styles.nav}>
        <Link to="/dashboard" style={styles.goldLink}>🏠 Inicio</Link>
        <Link to="/alumnos" style={styles.goldLink}>👨‍🎓 Alumnos</Link>
        <Link to="/movimientos" style={styles.goldLink}>💰 Movimientos</Link>
        
        {esAdmin && (
          <Link to="/usuarios" style={styles.goldLink}>
            👥 Usuarios
          </Link>
        )}
        <Link to="/operaciones" style={{ textDecoration: 'none' }}>
          <button style={/* estilo similar a tus otros botones */}>
            💳 Operaciones
          </button>
          </Link>

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
  logoContainer: {
    width: "50px",
    height: "50px",
    backgroundColor: "white",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  logo: {
    width: "100%",
    height: "100%",
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
  /* 👈 TARJETA DE USUARIO EN DORADO */
  goldCard: {
    backgroundColor: "#D4AF37",
    color: "#0B2341",
    padding: "10px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  },
  goldCardTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "bold",
    color: "#0B2341",
  },
  goldCardSub: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#0B2341",
    opacity: 0.85,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1,
  },
  /* 👈 ESTILO UNIFORME DORADO PARA TODOS LOS BOTONES */
  goldLink: {
    color: "#0B2341",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: "bold",
    backgroundColor: "#D4AF37",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    display: "block",
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