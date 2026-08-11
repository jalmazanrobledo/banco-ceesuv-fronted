import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Alumnos from "./pages/Alumnos";
import Movimientos from "./pages/Movimientos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import ConsultaAlumno from "./pages/ConsultaAlumno";
import Operaciones from "./pages/Operaciones";
import StudentDashboard from "./components/StudentDashboard";
import Reportes from "./pages/Reportes";

// Importamos el componente del ticker de divisas
import TickerDivisas from "./components/TickerDivisas";
import { obtenerDashboard } from "./services/api";

// Layout EXCLUSIVO para el panel interno (Admin y Docentes)
function LayoutPanel() {
  return (
    <>
      <TickerDivisas />
      <Outlet />
    </>
  );
}

// 1. Protege rutas que requieren estar logueado (Admin o Docente)
function RutaProtegida({ usuario, children }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si un alumno intenta entrar al panel administrativo, lo mandamos a su dashboard
  if (usuario.rol === 'Alumno') {
    return <Navigate to="/mi-cuenta" replace />;
  }

  return children;
}

// 2. Protege la ruta del Alumno (/mi-cuenta)
function RutaAlumno({ usuario, children }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 3. Protege rutas EXCLUSIVAS de Administrador
function RutaAdmin({ usuario, children }) {
  const rolLwr = usuario?.rol?.toLowerCase() || "";
  const esAdmin = rolLwr.includes("admin");

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si no es Administrador/Admin, redirecciona al dashboard
  if (!esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// 4. Redirección inteligente para la raíz "/"
function RedireccionInicial({ usuario }) {
  if (usuario) {
    if (usuario.rol === 'Alumno') {
      return <Navigate to="/mi-cuenta" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

// Componente Wrapper para la sesión del Alumno
function PortalAlumno({ usuario, onLogout }) {
  return (
    <StudentDashboard 
      alumno={{
        id: usuario?.alumno_id || usuario?.id,
        nombre: usuario?.nombre,
        grado: usuario?.grado
      }} 
      onLogout={onLogout} 
    />
  );
}

function App({ usuarioProp = null, onLogoutProp = () => {} }) {
  const [usuario, setUsuario] = useState(usuarioProp);
  const [cargando, setCargando] = useState(true);

  // Valida la sesión activa mediante la cookie del backend al arrancar la app
  useEffect(() => {
    async function verificarSesion() {
      try {
        const data = await obtenerDashboard();
        setUsuario(data.usuario || { rol: "Admin", nombre: "Administrador" });
      } catch (err) {
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }
    verificarSesion();
  }, []);

  const handleLogout = () => {
    setUsuario(null);
    onLogoutProp();
  };

  if (cargando) {
    return <div style={{ textAlign: "center", marginTop: "15rem", fontFamily: "sans-serif" }}>Cargando Banco Escolar...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección inicial */}
        <Route path="/" element={<RedireccionInicial usuario={usuario} />} />

        {/* -----------------------------------------------------------
            RUTAS PÚBLICAS / ALUMNOS (SIN TICKER DE DIVISAS)
            ----------------------------------------------------------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/consulta/:token" element={<ConsultaAlumno />} />

        {/* Vista del Dashboard del Alumno */}
        <Route
          path="/mi-cuenta"
          element={
            <RutaAlumno usuario={usuario}>
              <PortalAlumno usuario={usuario} onLogout={handleLogout} />
            </RutaAlumno>
          }
        />

        {/* -----------------------------------------------------------
            RUTAS PRIVADAS / ADMIN Y DOCENTES (CON TICKER DE DIVISAS)
            ----------------------------------------------------------- */}
        <Route element={<LayoutPanel />}>
          
          <Route
            path="/dashboard"
            element={
              <RutaProtegida usuario={usuario}>
                <Dashboard />
              </RutaProtegida>
            }
          />

          <Route
            path="/alumnos"
            element={
              <RutaProtegida usuario={usuario}>
                <Alumnos />
              </RutaProtegida>
            }
          />

          <Route
            path="/operaciones"
            element={
              <RutaProtegida usuario={usuario}>
                <Operaciones />
              </RutaProtegida>
            }
          />

          <Route
            path="/movimientos"
            element={
              <RutaProtegida usuario={usuario}>
                <Movimientos />
              </RutaProtegida>
            }
          />

          {/* Ruta para la nueva página de Reportes */}
          <Route
            path="/reportes"
            element={
              <RutaProtegida usuario={usuario}>
                <Reportes />
              </RutaProtegida>
            }
          />

          {/* Ruta EXCLUSIVA para Administradores */}
          <Route
            path="/usuarios"
            element={
              <RutaAdmin usuario={usuario}>
                <Usuarios />
              </RutaAdmin>
            }
          />

        </Route>

        {/* Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;