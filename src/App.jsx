import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Alumnos from "./pages/Alumnos";
import Movimientos from "./pages/Movimientos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import ConsultaAlumno from "./pages/ConsultaAlumno";
import Operaciones from "./pages/Operaciones";

// Importamos el componente del ticker de divisas
import TickerDivisas from "./components/TickerDivisas";

// Layout EXCLUSIVO para el panel interno (Admin y Docentes)
function LayoutPanel() {
  return (
    <>
      <TickerDivisas />
      <Outlet />
    </>
  );
}

// 1. Protege rutas que requieren estar logueado (Cualquier rol)
function RutaProtegida({ children }) {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");

  if (!usuarioGuardado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 2. Protege rutas EXCLUSIVAS de Administrador
function RutaAdmin({ children }) {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

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

// 3. Redirección inteligente para la raíz "/"
function RedireccionInicial() {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");
  
  if (usuarioGuardado) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección inicial */}
        <Route path="/" element={<RedireccionInicial />} />

        {/* -----------------------------------------------------------
            RUTAS PÚBLICAS / ALUMNOS (SIN TICKER DE DIVISAS)
           ----------------------------------------------------------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/consulta/:token" element={<ConsultaAlumno />} />


        {/* -----------------------------------------------------------
            RUTAS PRIVADAS / ADMIN Y DOCENTES (CON TICKER DE DIVISAS)
           ----------------------------------------------------------- */}
        <Route element={<LayoutPanel />}>
          
          <Route
            path="/dashboard"
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            }
          />

          <Route
            path="/alumnos"
            element={
              <RutaProtegida>
                <Alumnos />
              </RutaProtegida>
            }
          />

          <Route
            path="/operaciones"
            element={
              <RutaProtegida>
                <Operaciones />
              </RutaProtegida>
            }
          />

          <Route
            path="/movimientos"
            element={
              <RutaProtegida>
                <Movimientos />
              </RutaProtegida>
            }
          />

          {/* Ruta EXCLUSIVA para Administradores */}
          <Route
            path="/usuarios"
            element={
              <RutaAdmin>
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