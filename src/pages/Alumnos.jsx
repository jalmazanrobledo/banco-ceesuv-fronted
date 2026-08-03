import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerAlumnos, guardarAlumno, editarAlumno, eliminarAlumno } from "../services/api";

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQROpen, setModalQROpen] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  
  // Formulario
  const [nombre, setNombre] = useState("");
  const [grado, setGrado] = useState("");
  const [coins, setCoins] = useState(0);
  const [estatusForm, setEstatusForm] = useState("Activo"); // Agregado para controlar el estatus en el formulario
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
    try {
      if (editId) {
        await editarAlumno(editId, { nombre, grado, coins, estatus: estatusForm });
      } else {
        await guardarAlumno({ nombre, grado, coins, estatus: estatusForm });
      }
      cerrarModal();
      cargarAlumnos();
    } catch (error) {
      console.error("Error al guardar alumno:", error);
      alert("Hubo un error al guardar el alumno.");
    }
  };

  const handleEditar = (a) => {
    setEditId(a.id || a._id);
    setNombre(a.nombre);
    setGrado(a.grado);
    setCoins(a.coins);
    setEstatusForm(a.estatus || "Activo");
    setModalOpen(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este alumno?")) {
      await eliminarAlumno(id);
      cargarAlumnos();
    }
  };

// 🔄 Lógica para cambiar estatus (Activo / Inactivo) de forma correcta
  const handleCambiarEstatus = async (alumno) => {
    const estatusActual = alumno.estatus || "Activo";
    const nuevoEstatus = estatusActual === "Inactivo" ? "Activo" : "Inactivo";
    
    const mensaje = nuevoEstatus === "Inactivo" 
      ? `¿Estás seguro de inactivar a ${alumno.nombre}? No contará para los totales, pero conservará su historial y coins.`
      : `¿Deseas reactivar a ${alumno.nombre}? Volverá a estar activo en el sistema.`;
    
    if (window.confirm(mensaje)) {
      try {
        const idAlumno = alumno.id || alumno._id;
        
        const respuesta = await fetch(`https://banco-ceesuv-backend.onrender.com/api/alumnos/${idAlumno}/estatus`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ estatus: nuevoEstatus })
        });

        if (!respuesta.ok) {
          throw new Error("No se pudo cambiar el estatus en el servidor");
        }

        // Actualización optimista inmediata usando 'estatus'
        setAlumnos(prevAlumnos => 
          prevAlumnos.map(a => ((a.id === idAlumno || a._id === idAlumno) ? { ...a, estatus: nuevoEstatus } : a)) // ✅ Actualizamos "estatus"
        );

        if (typeof cargarAlumnos === "function") {
          cargarAlumnos();
        }

      } catch (error) {
        console.error("Error al cambiar estatus del alumno:", error);
        alert("Hubo un error al cambiar el estatus. Revisa la consola.");
      }
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
    setEstatusForm("Activo");
  };

  // 🔍 Lógica de filtrado
  const alumnosFiltrados = alumnos.filter((alumno) =>
    alumno.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const DOMINIO_PUBLICO = "https://banco-ceesuv-fronted.vercel.app";

  const tokenFinal = alumnoSeleccionado
    ? (alumnoSeleccionado.token_qr || alumnoSeleccionado.token || alumnoSeleccionado.id || alumnoSeleccionado._id)
    : "";

  const qrTargetUrl = `${DOMINIO_PUBLICO}/consulta/${tokenFinal}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(qrTargetUrl)}`;

  // Función para descargar la imagen del QR
  const descargarQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_${alumnoSeleccionado.nombre.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      window.open(qrImageUrl, "_blank");
    }
  };

  // Función para compartir por WhatsApp con PIN incluido
  const compartirWhatsApp = () => {
    const mensaje = `Hola, este es el acceso de *${alumnoSeleccionado.nombre}* para la plataforma del Banco Escolar CEESUV:\n\n🔑 *PIN de Acceso:* ${alumnoSeleccionado.pin || 'Sin PIN'}\n📲 *Consulta QR:* ${qrTargetUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  return (
    <>
      <style>{`
        .alumnos-container {
          display: flex;
          min-height: 100vh;
          background-color: #F4F7FA;
          font-family: sans-serif;
          flex-direction: row;
        }
        .alumnos-content {
          flex: 1;
          padding: 30px;
          box-sizing: border-box;
          width: 100%;
        }
        .action-bar {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        .search-box {
          position: relative;
          width: 320px;
        }
        .table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow-x: auto;
        }
        .pin-badge {
          background-color: #0B2341;
          color: #FFD700;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: bold;
          font-family: monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          display: inline-block;
          border: 1px solid #D4AF37;
        }
        .modal-box {
          background: white;
          color: #333;
          padding: 30px;
          border-radius: 12px;
          width: 400px;
          max-width: 90%;
          box-shadow: 0 5px 20px rgba(0,0,0,0.2);
          box-sizing: border-box;
        }
        .modal-qr-box {
          background: white;
          color: #333;
          padding: 30px;
          border-radius: 16px;
          text-align: center;
          width: 340px;
          max-width: 90%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .alumnos-container {
            flex-direction: column;
          }
          .alumnos-content {
            padding: 15px;
          }
          .action-bar {
            flex-direction: column;
            align-items: stretch;
            padding: 15px;
          }
          .search-box {
            width: 100%;
          }
          .btn-add {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="alumnos-container">
        {/* BARRA LATERAL (SIDEBAR) */}
        <Sidebar />

        {/* CONTENIDO PRINCIPAL */}
        <div className="alumnos-content">
          
          {/* ENCABEZADO */}
          <div style={{ marginBottom: "25px" }}>
            <h1 style={{ color: "#0B2341", margin: 0, fontSize: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
              👨‍🎓 Gestión de Alumnos
            </h1>
            <p style={{ color: "#666", margin: "5px 0 0 0", fontSize: "15px" }}>
              Administración de estudiantes, PINs de acceso y credenciales QR
            </p>
          </div>

          {/* TARJETA SUPERIOR CON BUSCADOR Y BOTÓN AGREGAR */}
          <div className="action-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔎 Buscar alumno por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 15px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                  outline: "none",
                  fontSize: "14px",
                  backgroundColor: "#FFFFFF",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <button
              className="btn-add"
              onClick={() => setModalOpen(true)}
              style={{
                padding: "10px 20px",
                background: "#0B2341",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              ➕ Agregar Alumno
            </button>
          </div>

          {/* TABLA CON PIN DE ACCESO */}
          <div className="table-card">
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#333", minWidth: "700px" }}>
              <thead>
                <tr style={{ background: "#0B2341", color: "white", textAlign: "left" }}>
                  <th style={{ padding: "15px 20px" }}>ID</th>
                  <th style={{ padding: "15px 20px" }}>Nombre</th>
                  <th style={{ padding: "15px 20px" }}>Grado</th>
                  <th style={{ padding: "15px 20px" }}>Coins</th>
                  <th style={{ padding: "15px 20px", textAlign: "center" }}>Estatus</th>
                  <th style={{ padding: "15px 20px", textAlign: "center" }}>PIN de Acceso</th>
                  <th style={{ padding: "15px 20px", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnosFiltrados.length > 0 ? (
                  alumnosFiltrados.map((a, idx) => {
                    const alumnoId = a.id || a._id;
                    const esInactivo = a.estatus === "Inactivo";
                    return (
                      <tr key={alumnoId} style={{ borderBottom: "1px solid #F0F0F0", backgroundColor: esInactivo ? "#FFF3F3" : (idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA"), opacity: esInactivo ? 0.75 : 1 }}>
                        <td style={{ padding: "15px 20px", fontWeight: "bold", color: "#666" }}>{alumnoId}</td>
                        <td style={{ padding: "15px 20px", fontWeight: "bold", color: esInactivo ? "#999" : "#0B2341", textDecoration: esInactivo ? "line-through" : "none" }}>{a.nombre}</td>
                        <td style={{ padding: "15px 20px", color: "#555" }}>{a.grado}</td>
                        <td style={{ padding: "15px 20px", fontWeight: "bold", color: "#D4AF37" }}>🪙 {a.coins}</td>
                        <td style={{ padding: "15px 20px", textAlign: "center" }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            backgroundColor: esInactivo ? "#ffeeba" : "#d4edda",
                            color: esInactivo ? "#856404" : "#155724"
                          }}>
                            {a.estatus || "Activo"}
                          </span>
                        </td>
                        <td style={{ padding: "15px 20px", textAlign: "center" }}>
                          <span className="pin-badge">
                            🔑 {a.pin || "N/A"}
                          </span>
                        </td>
                        <td style={{ padding: "15px 20px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => abrirModalQR(a)}
                            style={{ marginRight: "6px", padding: "8px 12px", background: "#D4AF37", color: "#0B2341", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                          >
                            📱 QR
                          </button>
                          <button
                            onClick={() => handleEditar(a)}
                            style={{ marginRight: "6px", padding: "8px 12px", background: "#17a2b8", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                          >
                            ✏️ Editar
                          </button>
                         <button
                            onClick={() => handleCambiarEstatus(a)}
                           style={{ 
                          marginRight: "6px", 
                          padding: "8px 12px", 
                          background: a.estatus === "Inactivo" ? "#28a745" : "rgb(255, 139, 7)", 
                          color: a.estatus === "Inactivo" ? "white" : "#0f2341", 
                          border: "none", 
                          borderRadius: "6px", 
                          cursor: "pointer", 
                          fontWeight: "bold" 
                        }}
>
                        {a.estatus === "Inactivo" ? "🟢 Activar" : "🟠 Inactivar"}
                          </button>
                          <button
                            onClick={() => handleEliminar(alumnoId)}
                            style={{ padding: "8px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      {busqueda ? `No se encontraron alumnos que coincidan con "${busqueda}"` : "No hay alumnos registrados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MODAL AGREGAR / EDITAR */}
          {modalOpen && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
              <div className="modal-box">
                <h3 style={{ marginTop: 0, color: "#0B2341" }}>{editId ? "✏️ Editar Alumno" : "➕ Nuevo Alumno"}</h3>
                <form onSubmit={handleGuardar}>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>Nombre Completo:</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>Grado / Grupo:</label>
                    <input type="text" value={grado} onChange={(e) => setGrado(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>Coins Iniciales:</label>
                    <input type="number" value={coins} onChange={(e) => setCoins(e.target.value)} required style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>Estatus:</label>
                    <select value={estatusForm} onChange={(e) => setEstatusForm(e.target.value)} style={{ width: "100%", padding: "10px", marginTop: "5px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", backgroundColor: "white" }}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button type="button" onClick={cerrarModal} style={{ padding: "10px 18px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancelar</button>
                    <button type="submit" style={{ padding: "10px 18px", background: "#0B2341", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>Guardar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL CÓDIGO QR MEJORADO CON PIN */}
          {modalQROpen && alumnoSeleccionado && (
            <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
              <div className="modal-qr-box">
                <h3 style={{ margin: "0 0 4px 0", color: "#0B2341", fontSize: "20px" }}>Banco Escolar CEESUV</h3>
                <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "13px" }}>Credencial de Acceso y Consulta</p>
                
                <div style={{ padding: "15px", background: "#F8F9FA", borderRadius: "12px", border: "1px solid #E9ECEF", display: "inline-block" }}>
                  <img
                    src={qrImageUrl}
                    alt={`QR de ${alumnoSeleccionado.nombre}`}
                    style={{ width: "180px", height: "180px", display: "block" }}
                  />
                </div>

                <h4 style={{ margin: "12px 0 2px 0", color: "#0B2341", fontSize: "18px" }}>{alumnoSeleccionado.nombre}</h4>
                <p style={{ fontSize: "13px", color: "#666", fontWeight: "bold", margin: "0 0 10px 0" }}>{alumnoSeleccionado.grado}</p>

                {/* VISUALIZACIÓN DESTACADA DEL PIN */}
                <div style={{ background: "#0B2341", padding: "8px 15px", borderRadius: "8px", margin: "10px 0 15px 0" }}>
                  <span style={{ color: "#AAA", fontSize: "11px", display: "block", textTransform: "uppercase" }}>PIN de Inicio de Sesión</span>
                  <span style={{ color: "#FFD700", fontSize: "20px", fontWeight: "bold", fontFamily: "monospace", letterSpacing: "3px" }}>
                    {alumnoSeleccionado.pin || "----"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={descargarQR}
                      style={{ flex: 1, padding: "9px", background: "#17a2b8", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                    >
                      💾 Guardar QR
                    </button>
                    <button
                      onClick={compartirWhatsApp}
                      style={{ flex: 1, padding: "9px", background: "#25D366", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                    >
                      📱 WhatsApp
                    </button>
                  </div>
                  
                  <button
                    onClick={() => window.print()}
                    style={{ padding: "9px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
                  >
                    🖨️ Imprimir Credencial
                  </button>
                </div>

                <button
                  onClick={() => setModalQROpen(false)}
                  style={{ width: "100%", padding: "9px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default Alumnos;