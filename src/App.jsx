import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Alumnos from "./pages/Alumnos";
import Movimientos from "./pages/Movimientos";
import Usuarios from "./pages/Usuarios";
import Login from "./pages/Login";
import ConsultaAlumno from "./pages/ConsultaAlumno";

// 1. Protege rutas que requieren estar logueado (Cualquier rol)
function RutaProtegida({ children }) {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");

  if (!usuarioGuardado) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 2. Protege rutas EXCLUSIVAS de Administrador
function RutaAdmin({ children }) {
  const usuarioGuardado = localStorage.getItem("usuarioCEESUV");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  // Si no hay sesión o el rol NO es Administrador, lo mandamos al dashboard
  if (!usuario || usuario.rol?.toLowerCase() !== "administrador") {
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

        {/* 👇 RUTA PÚBLICA PARA EL CÓDIGO QR (PADRES) 👇 */}
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