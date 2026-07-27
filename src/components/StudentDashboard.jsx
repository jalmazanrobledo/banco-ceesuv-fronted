import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function StudentDashboard({ alumno, onLogout }) {
  const [datos, setDatos] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Consulta datos actualizados del alumno y sus transacciones
      const res = await axios.get(`${process.env.REACT_APP_API_URL || ''}/api/alumno-dashboard/${alumno.id}`);
      setDatos(res.data.alumno);
      setMovimientos(res.data.movimientos || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="animate-pulse text-lg">Cargando tus CEESUV Coins...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Navbar Superior */}
      <header className="max-w-4xl mx-auto flex items-center justify-between bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-xl">
            🎓
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{datos?.nombre || alumno.nombre}</h2>
            <span className="text-xs text-slate-400">Alumno • {datos?.grado || 'CEESUV'}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-300 transition"
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        
        {/* Tarjeta Principal de Balance */}
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-amber-500 rounded-2xl p-6 text-slate-950 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none">
            🪙
          </div>
          <p className="text-xs uppercase font-bold tracking-wider opacity-80 mb-1">Saldo Disponible</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-black font-mono">{datos?.coins || 0}</span>
            <span className="text-xl font-bold">COINS</span>
          </div>
          <div className="bg-slate-950/15 backdrop-blur-md px-3 py-1.5 rounded-lg inline-block text-xs font-semibold">
            Equivalente: ${((datos?.coins || 0) * 1).toFixed(2)} MXN
          </div>
        </div>

        {/* Historial de Movimientos */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            📊 Mis Últimos Movimientos
          </h3>

          {movimientos.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Aún no tienes movimientos registrados.</p>
          ) : (
            <div className="space-y-3">
              {movimientos.map((m) => {
  const esPositivo = m.tipo === 'ENTRADA' || m.tipo === 'AHORRO_RETIRO';
  const monto = m.cantidad; // En server.js la columna se llama 'cantidad'

  return (
    <div
      key={m.id}
      className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-700/50"
    >
      <div className="flex items-center gap-3">
        <span className={`text-xl p-2 rounded-lg ${esPositivo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {esPositivo ? '📈' : '🛍️'}
        </span>
        <div>
          <p className="font-semibold text-sm">{m.motivo || m.tipo}</p>
          <p className="text-xs text-slate-400">{new Date(m.fecha).toLocaleDateString('es-MX')}</p>
        </div>
      </div>
      <span className={`font-mono font-bold text-base ${esPositivo ? 'text-emerald-400' : 'text-red-400'}`}>
        {esPositivo ? `+${monto}` : `-${monto}`} COINS
      </span>
    </div>
  );
})}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}