import { 
  FaCoins, 
  FaMoneyBillWave, 
  FaHistory, 
  FaSignOutAlt, 
  FaUserGraduate, // <-- Cambiado de FaUserGraduation a FaUserGraduate
  FaGraduationCap 
} from 'react-icons/fa';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos guardados en el login
    const userSession = localStorage.getItem('usuario');
    if (userSession) {
      const parsedUser = JSON.parse(userSession);
      setAlumno(parsedUser);
      // Si tienes endpoint de movimientos del alumno, se cargarían aquí
      setMovimientos(parsedUser.movimientos || []);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Cargando panel de alumno...
      </div>
    );
  }

  // Conversión de coins a MXN (ajusta según tu equivalencia)
  const coins = alumno?.coins || 0;
  const equivalenteMXN = (coins * 1.00).toFixed(2); // Ejemplo 1 coin = $1 MXN

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Navbar Superior Institucional */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-wrap justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <FaGraduationCap className="text-2xl" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">CEESUV</h1>
            <p className="text-xs text-indigo-400 font-medium">Portal del Estudiante</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{alumno?.nombre || 'Alumno'}</p>
            <p className="text-xs text-slate-400">Matrícula: {alumno?.username || 'N/A'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium shadow"
          >
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Banner de Bienvenida */}
<div className="bg-gradient-to-r from-indigo-900 via-slate-800 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg flex items-center justify-between">
  <div>
    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
      <FaUserGraduate className="text-indigo-400" /> {/* <-- Usar FaUserGraduate aquí */}
      ¡Hola, {alumno?.nombre || 'Estudiante'}!
    </h2>
    <p className="text-slate-400 text-sm mt-1">
      Consulta tu saldo acumulado de CEES Coins y el historial de tus actividades escolares.
    </p>
  </div>
</div>

        {/* Tarjetas Estadísticas de Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Coins */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Saldo en Coins</p>
              <h3 className="text-3xl font-bold text-amber-400 mt-2 flex items-baseline gap-1">
                {coins} <span className="text-sm font-normal text-slate-400">COINS</span>
              </h3>
            </div>
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <FaCoins className="text-3xl" />
            </div>
          </div>

          {/* Card Equivalente MXN */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Valor Estimado</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-2">
                ${equivalenteMXN} <span className="text-sm font-normal text-slate-400">MXN</span>
              </h3>
            </div>
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FaMoneyBillWave className="text-3xl" />
            </div>
          </div>
        </div>

        {/* Tabla / Lista de Últimos Movimientos */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex items-center gap-2">
            <FaHistory className="text-indigo-400" />
            <h3 className="font-semibold text-lg text-white">Mis Últimos Movimientos</h3>
          </div>

          <div className="p-6">
            {movimientos.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-base font-medium">Aún no tienes movimientos registrados.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tus abonos y canjes de coins aparecerán reflejados aquí.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 bg-slate-800/50">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Concepto / Motivo</th>
                      <th className="py-3 px-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {movimientos.map((mov, index) => (
                      <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4">{mov.fecha || 'N/A'}</td>
                        <td className="py-3 px-4">{mov.concepto || 'Transacción'}</td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          mov.tipo === 'abono' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {mov.tipo === 'abono' ? '+' : '-'}{mov.monto} COINS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}