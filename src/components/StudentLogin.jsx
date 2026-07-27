import React, { useState } from 'react';
import axios from 'axios';

export default function StudentLogin({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Maneja el cambio del PIN casilla por casilla
  const handlePinChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Salto automático al siguiente campo
    if (value && index < 3) {
      document.getElementById(`pin-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-input-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const pinString = pin.join('');

    if (!usuario.trim() || pinString.length < 4) {
      setError('Por favor ingresa tu usuario y tu PIN completo de 4 dígitos.');
      return;
    }

    setLoading(true);
    try {
      // Endpoint de autenticación para alumnos
      const res = await axios.post(`${process.env.REACT_APP_API_URL || ''}/api/login-alumno`, {
        usuario: usuario.trim().toLowerCase(),
        pin: pinString
      });

      if (res.data.success) {
        onLoginSuccess(res.data.alumno);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Usuario o PIN incorrectos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 text-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-700">
        
        {/* Encabezado e Insignia */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-3 bg-yellow-500 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 border-yellow-400">
            🪙
          </div>
          <h1 className="text-2xl font-bold tracking-wide">BANCO CEESUV</h1>
          <p className="text-slate-400 text-sm mt-1">Portal del Estudiante</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Usuario */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Usuario</label>
            <input
              type="text"
              placeholder="ej. juan.almazan"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono focus:outline-none focus:border-yellow-500 transition"
              required
            />
          </div>

          {/* Campo PIN de 4 dígitos */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-2">PIN de 4 dígitos</label>
            <div className="flex justify-center gap-3">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-input-${idx}`}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-12 h-14 bg-slate-900 border border-slate-700 rounded-xl text-center text-2xl font-bold font-mono focus:outline-none focus:border-yellow-500 transition"
                />
              ))}
            </div>
          </div>

          {/* Botón Acceder */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? 'Verificando...' : 'Entrar a mi Cuenta'}
          </button>
        </form>

      </div>
    </div>
  );
}