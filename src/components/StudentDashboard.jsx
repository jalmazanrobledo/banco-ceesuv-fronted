import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCoins, 
  FaMoneyBillWave, 
  FaHistory, 
  FaSignOutAlt, 
  FaUserGraduate, 
  FaGraduationCap 
} from 'react-icons/fa';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userSession = localStorage.getItem('usuario');
    if (!userSession) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userSession);
      setAlumno(parsedUser);

      // Intentamos identificar la clave primaria del usuario (id, _id, username, etc.)
      const userId = parsedUser.id || parsedUser._id || parsedUser.username;

      // URL de tu Backend (Ajusta el endpoint según tu API)
      const API_URL = `https://banco-ceesuv-backend.vercel.app/api/alumnos/${userId}`; // O la URL de tu backend

      fetch(API_URL)
        .then((res) => {
          if (!res.ok) throw new Error("Error al consultar BD");
          return res.json();
        })
        .then((data) => {
          // Si el backend devuelve un objeto con los datos completos
          setAlumno(data);
          setMovimientos(data.movimientos || data.history || data.transacciones || []);
        })
        .catch((err) => {
          console.log("No se pudo conectar al endpoint directo, usando datos locales:", err);
          // Respaldo por si los datos están directo en la sesión
          setMovimientos(parsedUser.movimientos || parsedUser.history || []);
        })
        .finally(() => setLoading(false));

    } catch (e) {
      console.error("Error al procesar la sesión:", e);
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando datos del estudiante...
      </div>
    );
  }

  // Extracción flexible de campos
  const nombreMostrar = alumno?.nombre || alumno?.name || alumno?.usuario || 'Estudiante';
  const matriculaMostrar = alumno?.matricula || alumno?.username || alumno?.id || 'N/A';
  
  // Soporte para distintas claves de saldo/coins en la base de datos
  const coins = alumno?.coins ?? alumno?.saldo ?? alumno?.puntos ?? 0;
  const equivalenteMXN = (Number(coins) * 1.00).toFixed(2);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Navbar Superior */}
      <header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#4f46e5', padding: '10px', borderRadius: '8px', color: '#fff', display: 'flex' }}>
            <FaGraduationCap size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>CEESUV</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#818cf8', fontWeight: '500' }}>Portal del Estudiante</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{nombreMostrar}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Matrícula: {matriculaMostrar}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Banner Saludo */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserGraduate color="#818cf8" />
            ¡Bienvenido, {nombreMostrar}!
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Aquí puedes consultar tu saldo acumulado de Coins y tus movimientos recientes en el sistema escolar.
          </p>
        </div>

        {/* Tarjetas Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          {/* Card Coins */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>Saldo Disponible</p>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '32px', color: '#fbbf24', fontWeight: 'bold' }}>
                {coins} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>COINS</span>
              </h3>
            </div>
            <div style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '16px', borderRadius: '12px', color: '#fbbf24' }}>
              <FaCoins size={32} />
            </div>
          </div>

          {/* Card MXN */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>Equivalente Estimado</p>
              <h3 style={{ margin: '8px 0 0 0', fontSize: '32px', color: '#34d399', fontWeight: 'bold' }}>
                ${equivalenteMXN} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>MXN</span>
              </h3>
            </div>
            <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', padding: '16px', borderRadius: '12px', color: '#34d399' }}>
              <FaMoneyBillWave size={32} />
            </div>
          </div>

        </div>

        {/* Tabla de Movimientos */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaHistory color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>Mis Últimos Movimientos</h3>
          </div>

          <div style={{ padding: '20px' }}>
            {movimientos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>Aún no tienes movimientos registrados.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Tus abonos y canjes de coins aparecerán reflejados en esta sección.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Fecha</th>
                    <th style={{ padding: '12px' }}>Concepto</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{mov.fecha || mov.createdAt || 'N/A'}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{mov.concepto || mov.descripcion || 'Transacción'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: (mov.tipo === 'abono' || mov.monto > 0) ? '#34d399' : '#f87171' }}>
                        {(mov.tipo === 'abono' || mov.monto > 0) ? '+' : ''}{mov.monto} COINS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}