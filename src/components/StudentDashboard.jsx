import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosEstudiante = async () => {
      try {
        // 1. Obtener la sesión activa del alumno desde localStorage
        const storedUser = localStorage.getItem("usuario");

        if (!storedUser) {
          navigate("/login");
          return;
        }

        const userObj = JSON.parse(storedUser);

        // 2. Extraer dinámicamente cualquier identificador posible que devuelva el login
        const identifier =
          userObj.id ||
          userObj.alumno_id ||
          userObj.usuario ||
          userObj.username ||
          userObj.nombre;

        if (!identifier) {
          // Si no hay un ID o usuario claro, usamos los datos almacenados directamente en login
          setAlumno(userObj);
          setMovimientos(userObj.movimientos || []);
          setCargando(false);
          return;
        }

        // 3. Consultar al backend codificando la variable para evitar errores con espacios o tildes
        const param = encodeURIComponent(identifier);
        const response = await fetch(
          `https://banco-ceesuv-backend.vercel.app/api/alumnos/${param}`
        );

        if (response.ok) {
          const data = await response.json();

          // Normalizar respuesta del backend
          const datosAlumno = Array.isArray(data) ? data[0] : (data.alumno || data);
          const listaMovimientos =
            data.movimientos || datosAlumno?.movimientos || userObj.movimientos || [];

          setAlumno(datosAlumno);
          setMovimientos(listaMovimientos);
        } else {
          // Si la llamada a la API falla, usamos la información guardada en la sesión actual
          setAlumno(userObj);
          setMovimientos(userObj.movimientos || []);
        }
      } catch (error) {
        console.error("Error al cargar datos del alumno:", error);
        // Respaldo dinámico en caso de error de red
        const storedUser = localStorage.getItem("usuario");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          setAlumno(userObj);
          setMovimientos(userObj.movimientos || []);
        }
      } finally {
        setCargando(false);
      }
    };

    cargarDatosEstudiante();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const obtenerColorTipo = (tipo) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return "#10B981";
    if (tipo === "SALIDA") return "#EF4444";
    if (tipo === "AHORRO_DEPOSITO") return "#3B82F6";
    if (tipo === "AHORRO_RETIRO") return "#F59E0B";
    return "#9CA3AF";
  };

  const obtenerSignoMonto = (tipo, cantidad) => {
    if (tipo === "ENTRADA" || tipo === "AHORRO_RENDIMIENTO") return `+${cantidad}`;
    if (tipo === "SALIDA") return `-${cantidad}`;
    return `${cantidad}`;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-lg">Cargando información del estudiante...</p>
      </div>
    );
  }

  // Variables dinámicas según el alumno logueado
  const nombreAlumno = alumno?.nombre || alumno?.usuario || "Estudiante";
  const coinsTotales = Number(alumno?.coins ?? 0);
  const matricula = alumno?.matricula || alumno?.id || "N/A";

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Encabezado */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-xl">
            🎓
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-400">CEESUV</h1>
            <p className="text-xs text-slate-400">Portal del Estudiante</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{nombreAlumno}</p>
            <p className="text-xs text-slate-400">Matrícula: {matricula}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Banner de Bienvenida Dinámico */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎓 ¡Bienvenido, {nombreAlumno}!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Aquí puedes consultar tu saldo acumulado de Coins y tus movimientos recientes en el sistema escolar.
          </p>
        </div>

        {/* Tarjetas de Saldo Dinámicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-sm text-slate-400 font-medium">Saldo Disponible</p>
              <p className="text-3xl font-extrabold text-amber-400 mt-1">
                {coinsTotales} <span className="text-sm text-slate-300">COINS</span>
              </p>
            </div>
            <div className="bg-amber-500/10 p-4 rounded-xl text-2xl">🪙</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <p className="text-sm text-slate-400 font-medium">Equivalente Estimado</p>
              <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                ${coinsTotales.toFixed(2)} <span className="text-sm text-slate-300">MXN</span>
              </p>
            </div>
            <div className="bg-emerald-500/10 p-4 rounded-xl text-2xl">💵</div>
          </div>
        </div>

        {/* Tabla Dinámica de Movimientos */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🕒 Mis Últimos Movimientos
          </h3>

          <div className="overflow-x-auto">
            {movimientos && movimientos.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-sm">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Coins</th>
                    <th className="p-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                  {movimientos.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-700/30 transition">
                      <td className="p-3 text-slate-300">
                        {m.fecha ? new Date(m.fecha).toLocaleString() : "N/A"}
                      </td>
                      <td
                        className="p-3 font-bold"
                        style={{ color: obtenerColorTipo(m.tipo) }}
                      >
                        {m.tipo}
                      </td>
                      <td
                        className="p-3 font-bold"
                        style={{ color: obtenerColorTipo(m.tipo) }}
                      >
                        🪙 {obtenerSignoMonto(m.tipo, m.cantidad)}
                      </td>
                      <td className="p-3 text-slate-300">{m.motivo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <p className="text-base">Aún no tienes movimientos registrados.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tus abonos y canjes de coins aparecerán reflejados en esta sección.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}