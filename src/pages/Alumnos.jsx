import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerAlumnos, guardarAlumno, editarAlumno, eliminarAlumno } from "../services/api";

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState(""); // 👈 Estado para el buscador
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQROpen, setModalQROpen] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("");
  const [coins, setCoins] = useState(0);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const data = await obtenerAlumnos();
      setAlumnos(data || []);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (editId) {
      await editarAlumno(editId, { nombre, grado, coins });
    } else {
      await guardarAlumno({ nombre, grado, coins });
    }
    cerrarModal();
    cargarAlumnos();
  };

  const handleEditar = (a) => {
    setEditId(a.id);
    setNombre(a.nombre);
    setGrado(a.grado);
    setCoins(a.coins);
    setModalOpen(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este alumno?")) {
      await eliminarAlumno(id);
      cargarAlumnos();
    }
  };

  const abrirModalQR = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setModalQROpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditId(null);
    setNombre("");
    setGrado("");
    setCoins(0);
  };

  // 🔍 Lógica de filtrado en tiempo real
  const alumnosFiltrados = alumnos.filter((alumno) =>
    alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const DOMINIO_PUBLICO = "https://banco-ceesuv-fronted.vercel.app";

  const qrTargetUrl = alumnoSeleccionado && alumnoSeleccionado.token_qr
    ? `${DOMINIO_PUBLICO}/consulta/${alumnoSeleccionado.token_qr}`
    : `${DOMINIO_PUBLICO}/consulta/desconocido`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrTargetUrl)}`;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 1. BARRA LATERAL (SIDEBAR) */}
      <Sidebar />

      {/* 2. CONTENIDO PRINCIPAL DE ALUMNOS */}
      <div style={{ flex: 1, padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px", flexWrap: "wrap" }}>
          <h2 style={{ color: "white", margin: 0 }}>👨‍🎓 Gestión de Alumnos</h2>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* 🔍 BUSCADOR DE ALUMNOS */}
            <input
              type="text"
              placeholder="🔍 Buscar alumno por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: "9px 15px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                outline: "none",
                width: "250px",
                fontSize: "14px"
              }}
            />

            <button
              onClick={() => setModalOpen(true)}
              style={{ padding: "10px 15px", background: "#17a2b8", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
            >
              ➕ Agregar Alumno
            </button>
          </div>
        </div>

        {/* TABLA DE ALUMNOS */}
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", color: "#333", borderRadius: "8px", overflow: "hidden" }}>
          <thead>
            <tr style={{ background: "#0B2341", color: "white", textAlign: "left" }}>
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Nombre</th>
              <th style={{ padding: "12px" }}>Grado</th>
              <th style={{ padding: "12px" }}>Coins</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnosFiltrados.length > 0 ? (
              alumnosFiltrados.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>{a.id}</td>
                  <td style={{ padding: "12px" }}>{a.nombre}</td>
                  <td style={{ padding: "12px" }}>{a.grado}</td>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>🪙 {a.coins}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => abrirModalQR(a)}
                      style={{ marginRight: "8px", padding: "6px 12px", background: "#D4AF37", color: "#0B2341", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      📱 Código QR
                    </button>
                    <button
                      onClick={() => handleEditar(a)}
                      style={{ marginRight: "8px", padding: "6px 12px", background: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(a.id)}
                      style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                  {busqueda ? `No se encontraron alumnos que coincidan con "${busqueda}"` : "No hay alumnos registrados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* MODAL AGREGAR / EDITAR */}
        {modalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ background: "white", color: "#333", padding: "25px", borderRadius: "10px", width: "400px" }}>
              <h3>{editId ? "Editar Alumno" : "Nuevo Alumno"}</h3>
              <form onSubmit={handleGuardar}>
                <div style={{ marginBottom: "15px" }}>
                  <label>Nombre Completo:</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: "100%", padding: "8px", marginTop: "5px" }} />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label>Grado / Grupo:</label>
                  <input type="text" value={grado} onChange={(e) => setGrado(e.target.value)} required style={{ width: "100%", padding: "8px", marginTop: "5px" }} />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label>Coins Iniciales:</label>
                  <input type="number" value={coins} onChange={(e) => setCoins(e.target.value)} required style={{ width: "100%", padding: "8px", marginTop: "5px" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={cerrarModal} style={{ padding: "8px 15px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px" }}>Cancelar</button>
                  <button type="submit" style={{ padding: "8px 15px", background: "#0B2341", color: "white", border: "none", borderRadius: "4px" }}>Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CÓDIGO QR */}
        {modalQROpen && alumnoSeleccionado && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
            <div style={{ background: "white", color: "#333", padding: "30px", borderRadius: "15px", textAlign: "center", width: "320px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#0B2341" }}>Banco Escolar CEESUV</h3>
              <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "14px" }}>Credencial de Consulta</p>
              
              <div style={{ padding: "15px", background: "#f8f9fa", borderRadius: "10px", display: "inline-block" }}>
                <img
                  src={qrImageUrl}
                  alt={`QR de ${alumnoSeleccionado.nombre}`}
                  style={{ width: "180px", height: "180px", display: "block" }}
                />
              </div>

              <h4 style={{ margin: "15px 0 2px 0", color: "#0B2341" }}>{alumnoSeleccionado.nombre}</h4>
              <span style={{ fontSize: "13px", color: "#666", fontWeight: "bold" }}>{alumnoSeleccionado.grado}</span>

              <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={() => setModalQROpen(false)} style={{ padding: "8px 15px", background: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Cerrar
                </button>
                <button onClick={() => window.print()} style={{ padding: "8px 15px", background: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  🖨️ Imprimir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Alumnos;