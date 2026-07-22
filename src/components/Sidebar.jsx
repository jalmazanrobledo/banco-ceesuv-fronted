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
    <aside className="sidebar-container">
      {/* Encabezado con Logo del Colegio */}
      <div className="sidebar-header">
        <img src="/logo-ceesuv.png" alt="Logo CEESUV" className="sidebar-logo" />
        <div className="sidebar-title-container">
          <h1 className="sidebar-title">CEESUV</h1>
          <span className="sidebar-subtitle">Banco Escolar</span>
        </div>
      </div>

      {/* Información del Usuario */}
      {usuario && (
        <div className="user-card">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <p className="user-name">{usuario.nombre || usuario.usuario}</p>
            <span className="user-badge">{usuario.rol}</span>
          </div>
        </div>
      )}

      {/* Menú de Navegación */}
      <nav className="sidebar-nav">
        <Link to="/dashboard" className="nav-item">🏠 <span>Inicio</span></Link>
        <Link to="/alumnos" className="nav-item">👨‍🎓 <span>Alumnos</span></Link>
        <Link to="/movimientos" className="nav-item">💰 <span>Movimientos</span></Link>
        
        {esAdmin && (
          <Link to="/usuarios" className="nav-item nav-admin">👥 <span>Usuarios</span></Link>
        )}
      </nav>

      {/* Botón de Salir */}
      <div className="sidebar-footer">
        <button onClick={cerrarSesion} className="btn-logout">
          🚪 <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;