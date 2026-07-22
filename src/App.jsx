import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Alumnos from "./pages/Alumnos";
import Movimientos from "./pages/Movimientos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import ConsultaAlumno from "./pages/ConsultaAlumno";
import Operaciones from "./pages/Operaciones";

// 1. Protege rutas que requieren estar logueado (Cualquier rol)
function RutaProtegida({ children }) {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");

  if (!usuarioGuardado) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 2. Protege rutas EXCLUSIVAS de Administrador (CORREGIDO)
function RutaAdmin({ children }) {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const rolLwr = usuario?.rol?.toLowerCase() || "";
  const esAdmin = rolLwr.includes("admin");

  // Si no hay sesión o NO es Administrador/Admin, redirecciona al dashboard
  if (!usuario || !esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Pantalla de Login */}
        <Route path="/" element={<Login />} />

        <Route path="/operaciones" element={<Operaciones />} />

        {/* Ruta pública para el Código QR (Padres) */}
        <Route path="/consulta/:token" element={<ConsultaAlumno />} />

        {/* Rutas accesibles para Docentes y Administradores */}
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

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;