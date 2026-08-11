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
import Sidebar from "./components/Sidebar"; // Asegúrate de importar tu Sidebar

// Importamos el componente del ticker de divisas
import TickerDivisas from "./components/TickerDivisas";
import { obtenerDashboard } from "./services/api";

// Layout EXCLUSIVO para el panel interno (Admin y Docentes) que incluye Sidebar dinámico
function LayoutPanel({ usuario, onLogout }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar dinámico con datos de sesión reales */}
      <Sidebar usuario={usuario} onLogout={onLogout} />
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        <TickerDivisas />
        <div style={{ padding: "20px", flex: 1, backgroundColor: "#f8f9fa" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// 1. Protege rutas que requieren estar logueado (Admin o Docente)
function RutaProtegida({ usuario, children }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

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

  useEffect(() => {
    async function verificarSesion() {
      try {
        const sesionLocal = sessionStorage.getItem("sesion_activa_ceesuv");
        if (sesionLocal) {
          setUsuario(JSON.parse(sesionLocal));
          setCargando(false);
          return;
        }

        const data = await obtenerDashboard();
        setUsuario(data?.usuario || null);
      } catch (err) {
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }
    verificarSesion();
  }, []);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("sesion_activa_ceesuv");
      localStorage.clear();
    } catch (error) {
      console.error("Error al limpiar sesión", error);
    } finally {
      setUsuario(null);
      window.location.href = "/login";
    }
  };

  if (cargando) {
    return <div style={{ textAlign: "center", marginTop: "15rem", fontFamily: "sans-serif" }}>Cargando Banco Escolar...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedireccionInicial usuario={usuario} />} />

        <Route path="/login" element={<Login />} />
        <Route path="/consulta/:token" element={<ConsultaAlumno />} />

        <Route
          path="/mi-cuenta"
          element={
            <RutaAlumno usuario={usuario}>
              <PortalAlumno usuario={usuario} onLogout={handleLogout} />
            </RutaAlumno>
          }
        />

        {/* Pasamos el usuario y la función de cierre de sesión dinámicamente al layout del panel */}
        <Route element={<LayoutPanel usuario={usuario} onLogout={handleLogout} />}>
          
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

          <Route
            path="/reportes"
            element={
              <RutaProtegida usuario={usuario}>
                <Reportes />
              </RutaProtegida>
            }
          />

          <Route
            path="/usuarios"
            element={
              <RutaAdmin usuario={usuario}>
                <Usuarios />
              </RutaAdmin>
            }
          />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;