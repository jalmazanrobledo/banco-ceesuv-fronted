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
import Sidebar from "./components/Sidebar";

import TickerDivisas from "./components/TickerDivisas";
import { obtenerDashboard } from "./services/api";

function LayoutPanel({ usuario, onLogout }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Sidebar usuario={usuario} onLogout={onLogout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        <TickerDivisas />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function RutaProtegida({ usuario, cargando, children }) {
  if (cargando) return <div style={{ textAlign: "center", marginTop: "15rem" }}>Verificando sesión...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  
  const rol = String(usuario.rol || "").toLowerCase();
  if (rol === 'alumno' || rol.includes('student')) return <Navigate to="/mi-cuenta" replace />;
  
  return children;
}

function RutaAlumno({ usuario, cargando, children }) {
  if (cargando) return <div style={{ textAlign: "center", marginTop: "15rem" }}>Verificando sesión...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

function RutaAdmin({ usuario, cargando, children }) {
  if (cargando) return <div style={{ textAlign: "center", marginTop: "15rem" }}>Verificando sesión...</div>;
  if (!usuario) return <Navigate to="/login" replace />;

  const rol = String(usuario.rol || "").toLowerCase();
  if (!rol.includes("admin")) return <Navigate to="/dashboard" replace />;
  
  return children;
}

function RedireccionInicial({ usuario }) {
  if (usuario) {
    const rol = String(usuario.rol || "").toLowerCase();
    return (rol === 'alumno' || rol.includes('student')) ? <Navigate to="/mi-cuenta" replace /> : <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function PortalAlumno({ usuario, onLogout }) {
  return <StudentDashboard usuarioProp={usuario} onLogout={onLogout} />;
}

function App({ usuarioProp = null }) {
  const [usuario, setUsuario] = useState(usuarioProp);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function verificarSesion() {
      try {
        const sesionLocal = sessionStorage.getItem("sesion_activa_ceesuv");
        if (sesionLocal) {
          setUsuario(JSON.parse(sesionLocal));
        } else {
          const data = await obtenerDashboard();
          setUsuario(data?.usuario || null);
        }
      } catch (err) {
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }
    verificarSesion();
  }, []);

  const handleLogout = async () => {
    sessionStorage.removeItem("sesion_activa_ceesuv");
    localStorage.clear();
    setUsuario(null);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedireccionInicial usuario={usuario} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/consulta/:token" element={<ConsultaAlumno />} />

        <Route path="/mi-cuenta" element={
          <RutaAlumno usuario={usuario} cargando={cargando}>
            <PortalAlumno usuario={usuario} onLogout={handleLogout} />
          </RutaAlumno>
        }/>

        <Route element={<LayoutPanel usuario={usuario} onLogout={handleLogout} />}>
          <Route path="/dashboard" element={<RutaProtegida usuario={usuario} cargando={cargando}><Dashboard /></RutaProtegida>} />
          <Route path="/alumnos" element={<RutaProtegida usuario={usuario} cargando={cargando}><Alumnos /></RutaProtegida>} />
          <Route path="/operaciones" element={<RutaProtegida usuario={usuario} cargando={cargando}><Operaciones /></RutaProtegida>} />
          <Route path="/movimientos" element={<RutaProtegida usuario={usuario} cargando={cargando}><Movimientos /></RutaProtegida>} />
          <Route path="/reportes" element={<RutaProtegida usuario={usuario} cargando={cargando}><Reportes /></RutaProtegida>} />
          <Route path="/usuarios" element={<RutaAdmin usuario={usuario} cargando={cargando}><Usuarios /></RutaAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;