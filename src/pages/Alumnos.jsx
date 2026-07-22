import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [endpointValido, setEndpointValido] = useState("");

  // Estados para Modales
  const [modalAgregar, setModalAgregar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalQr, setModalQr] = useState(false);

  // Estado para alumno seleccionado
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  // Formularios
  const [nuevoAlumno, setNuevoAlumno] = useState({ nombre: "", grado: "", coins: 0 });
  const [alumnoEditar, setAlumnoEditar] = useState({ id: "", nombre: "", grado: "", coins: 0 });

  const API_URL = import.meta.env.VITE_API_URL || "https://banco-ceesuv-backend.onrender.com";

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    const rutasPosibles = [
      `${API_URL}/api/alumnos`,
      `${API_URL}/alumnos`,
      `${API_URL}/api/alumno`,
      `${API_URL}/alumno`
    ];

    for (const url of rutasPosibles) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setEndpointValido(url); // Guardamos la ruta que sí funcionó

          let lista = [];
          if (Array.isArray(data)) lista = data;
          else if (data.alumnos) lista = data.alumnos;
          else if (data.data) lista = data.data;

          setAlumnos(lista);
          return;
        }
      } catch (error) {
        console.warn(`Falló ${url}`);
      }
    }
  };

  // --- HANDLERS DE ACCIONES ---

  // 1. Crear Alumno
  const handleCrearAlumno = async (e) => {
    e.preventDefault();
    if (!nuevoAlumno.nombre) return alert("Ingresa el nombre del alumno.");

    try {
      const res = await fetch(endpointValido || `${API_URL}/api/alumnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoAlumno)
      });

      if (res.ok) {
        alert("¡Alumno agregado con éxito!");
        setModalAgregar(false);
        setNuevoAlumno({ nombre: "", grado: "", coins: 0 });
        fetchAlumnos();
      } else {
        alert("Error al guardar alumno.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al agregar alumno.");
    }
  };

  // 2. Abrir Editar
  const handleAbrirEditar = (alumno) => {
    setAlumnoEditar({
      id: alumno.id || alumno._id,
      nombre: alumno.nombre || alumno.nombre_completo || "",
      grado: alumno.grado || alumno.grado_estudio || "",
      coins: alumno.coins ?? alumno.saldo ?? 0
    });
    setModalEditar(true);
  };

  // Guardar Cambios Editar
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${endpointValido}/${alumnoEditar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumnoEditar)
      });

      if (res.ok) {
        alert("Alumno actualizado correctamente.");
        setModalEditar(false);
        fetchAlumnos();
      } else {
        alert("No se pudo actualizar los datos.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor.");
    }
  };

  // 3. Eliminar Alumno
  const handleEliminar = async (alumno) => {
    const id = alumno.id || alumno._id;
    const nombre = alumno.nombre || alumno.nombre_completo;

    if (window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
      try {
        const res = await fetch(`${endpointValido}/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Alumno eliminado.");
          fetchAlumnos();
        } else {
          alert("No se pudo eliminar el alumno.");
        }
      } catch (err) {
        console.error(err);
        alert("Error de conexión.");
      }
    }
  };

  // 4. Mostrar QR
  const handleVerQr = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setModalQr(true);
  };

  const listaAlumnos = Array.isArray(alumnos) ? alumnos : [];
  const alumnosFiltrados = listaAlumnos.filter((alumno) => {
    const nombre = alumno.nombre || alumno.nombre_completo || alumno.nombreAlumno || "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div style={styles.container}>
      <Sidebar />
      
      <main style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👨‍🎓 Gestión de Alumnos</h1>
            <p style={styles.subtitle}>Listado y control de alumnos registrados</p>
          </div>
        </div>

        <div style={styles.topBar}>
          <input
            type="text"
            placeholder="🔍 Buscar alumno por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
          <button style={styles.btnAdd} onClick={() => setModalAgregar(true)}>
            + Agregar Alumno
          </button>
        </div>

        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Grado</th>
                <th style={styles.th}>Coins</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.length > 0 ? (
                alumnosFiltrados.map((alumno, index) => (
                  <tr key={alumno.id || alumno._id || index} style={styles.tr}>
                    <td style={styles.td}>{alumno.id || alumno._id || index + 1}</td>
                    <td style={styles.tdBold}>
                      {alumno.nombre || alumno.nombre_completo || alumno.nombreAlumno || "Sin Nombre"}
                    </td>
                    <td style={styles.td}>
                      {alumno.grado || alumno.grado_estudio || alumno.grupo || "N/A"}
                    </td>
                    <td style={styles.tdCoins}>
                      🪙 {alumno.coins ?? alumno.saldo ?? alumno.ceesuv_coins ?? 0}
                    </td>
                    <td style={styles.tdActions}>
                      <button style={styles.btnQr} onClick={() => handleVerQr(alumno)}>
                        📱 Código QR
                      </button>
                      <button style={styles.btnEdit} onClick={() => handleAbrirEditar(alumno)}>
                        ✏️ Editar
                      </button>
                      <button style={styles.btnDelete} onClick={() => handleEliminar(alumno)}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                    No se encontraron alumnos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL AGREGAR --- */}
      {modalAgregar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>➕ Registrar Nuevo Alumno</h2>
            <form onSubmit={handleCrearAlumno} style={styles.form}>
              <label style={styles.label}>Nombre completo:</label>
              <input
                type="text"
                style={styles.input}
                value={nuevoAlumno.nombre}
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, nombre: e.target.value })}
                required
              />
              <label style={styles.label}>Grado:</label>
              <input
                type="text"
                placeholder="Ej. 1° Primaria"
                style={styles.input}
                value={nuevoAlumno.grado}
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, grado: e.target.value })}
              />
              <label style={styles.label}>Coins Iniciales:</label>
              <input
                type="number"
                style={styles.input}
                value={nuevoAlumno.coins}
                onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, coins: Number(e.target.value) })}
              />
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setModalAgregar(false)} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" style={styles.btnSave}>Guardar Alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR --- */}
      {modalEditar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>✏️ Editar Alumno</h2>
            <form onSubmit={handleGuardarEdicion} style={styles.form}>
              <label style={styles.label}>Nombre:</label>
              <input
                type="text"
                style={styles.input}
                value={alumnoEditar.nombre}
                onChange={(e) => setAlumnoEditar({ ...alumnoEditar, nombre: e.target.value })}
              />
              <label style={styles.label}>Grado:</label>
              <input
                type="text"
                style={styles.input}
                value={alumnoEditar.grado}
                onChange={(e) => setAlumnoEditar({ ...alumnoEditar, grado: e.target.value })}
              />
              <label style={styles.label}>Coins:</label>
              <input
                type="number"
                style={styles.input}
                value={alumnoEditar.coins}
                onChange={(e) => setAlumnoEditar({ ...alumnoEditar, coins: Number(e.target.value) })}
              />
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setModalEditar(false)} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" style={styles.btnSave}>Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL QR CON GUARDADO E IMPRESIÓN --- */}
      {modalQr && alumnoSeleccionado && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, textAlign: "center" }}>
            <h2 style={styles.modalTitle}>📱 Código QR de Alumno</h2>
            <p style={{ color: "#0B2341", fontWeight: "bold", margin: "10px 0", fontSize: "16px" }}>
              {alumnoSeleccionado.nombre || alumnoSeleccionado.nombre_completo}
            </p>
            <p style={{ color: "#6c757d", fontSize: "13px", margin: 0 }}>
              Grado: {alumnoSeleccionado.grado || alumnoSeleccionado.grado_estudio || "N/A"}
            </p>

            <div style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px", margin: "15px 0" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${alumnoSeleccionado.id || alumnoSeleccionado._id}`}
                alt="QR Alumno"
                style={{ width: "200px", height: "200px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "15px" }}>
              {/* Botón Descargar Imagen PNG */}
              <button
                onClick={async () => {
                  const id = alumnoSeleccionado.id || alumnoSeleccionado._id;
                  const nombre = alumnoSeleccionado.nombre || alumnoSeleccionado.nombre_completo;
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${id}`;
                  
                  const response = await fetch(qrUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `QR_${nombre.replace(/\s+/g, "_")}.png`;
                  link.click();
                }}
                style={{
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}
              >
                💾 Guardar Imagen
              </button>

              {/* Botón Imprimir Credencial */}
              <button
                onClick={() => {
                  const win = window.open("", "", "width=600,height=600");
                  const nombre = alumnoSeleccionado.nombre || alumnoSeleccionado.nombre_completo;
                  const grado = alumnoSeleccionado.grado || "N/A";
                  const id = alumnoSeleccionado.id || alumnoSeleccionado._id;
                  
                  win.document.write(`
                    <html>
                      <head>
                        <title>Credencial CEESUV - ${nombre}</title>
                        <style>
                          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                          .card { border: 2px solid #0B2341; padding: 20px; border-radius: 12px; width: 280px; margin: auto; }
                          h2 { color: #0B2341; margin: 5px 0; }
                          h3 { color: #d4af37; margin: 0 0 15px 0; font-size: 14px; }
                          img { width: 180px; height: 180px; }
                          p { font-size: 14px; color: #333; margin: 5px 0; }
                        </style>
                      </head>
                      <body>
                        <div class="card">
                          <h2>CEESUV</h2>
                          <h3>BANCO ESCOLAR</h3>
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${id}" />
                          <p><strong>${nombre}</strong></p>
                          <p>Grado: ${grado}</p>
                        </div>
                        <script>
                          window.onload = function() { window.print(); window.close(); }
                        </script>
                      </body>
                    </html>
                  `);
                  win.document.close();
                }}
                style={{
                  backgroundColor: "#d4af37",
                  color: "#0B2341",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}
              >
                🖨️ Imprimir Credencial
              </button>
            </div>

            <button onClick={() => setModalQr(false)} style={styles.btnCancel}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", backgroundColor: "#F4F6F9" },
  content: { flex: 1, padding: "30px" },
  header: { marginBottom: "20px" },
  title: { margin: 0, fontSize: "28px", fontWeight: "bold", color: "#0B2341" },
  subtitle: { margin: "5px 0 0 0", color: "#6c757d", fontSize: "15px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px" },
  searchInput: { padding: "10px 15px", borderRadius: "8px", border: "1px solid #ced4da", width: "300px", fontSize: "14px", outline: "none" },
  btnAdd: { backgroundColor: "#17a2b8", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
  tableCard: { backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thRow: { backgroundColor: "#0B2341", color: "white" },
  th: { padding: "12px 15px", fontSize: "14px", fontWeight: "bold" },
  tr: { borderBottom: "1px solid #e9ecef" },
  td: { padding: "12px 15px", color: "#333", fontSize: "14px" },
  tdBold: { padding: "12px 15px", color: "#0B2341", fontWeight: "600", fontSize: "14px" },
  tdCoins: { padding: "12px 15px", fontWeight: "bold", color: "#d4af37", fontSize: "14px" },
  tdActions: { padding: "12px 15px", display: "flex", gap: "8px" },
  btnQr: { backgroundColor: "#d4af37", color: "#0B2341", border: "none", padding: "6px 10px", borderRadius: "5px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" },
  btnEdit: { backgroundColor: "#17a2b8", color: "white", border: "none", padding: "6px 10px", borderRadius: "5px", fontSize: "12px", cursor: "pointer" },
  btnDelete: { backgroundColor: "#dc3545", color: "white", border: "none", padding: "6px 10px", borderRadius: "5px", fontSize: "12px", cursor: "pointer" },

  // Estilos Modales
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalCard: { backgroundColor: "white", padding: "25px", borderRadius: "10px", width: "400px", maxWidth: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  modalTitle: { margin: "0 0 15px 0", color: "#0B2341", fontSize: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "14px", color: "#333", fontWeight: "600" },
  input: { padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  modalButtons: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" },
  btnCancel: { padding: "8px 14px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  btnSave: { padding: "8px 14px", backgroundColor: "#0B2341", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }
};

export default Alumnos;