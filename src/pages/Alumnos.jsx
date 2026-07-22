import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "https://banco-ceesuv-backend.onrender.com";

  useEffect(() => {
    fetchAlumnos();
  }, []);

  const fetchAlumnos = async () => {
    try {
      // Intentamos con la ruta de tu backend
      const res = await fetch(`${API_URL}/api/alumno`);
      const data = await res.json();

      // Esto te mostrará en la consola del navegador exactamente qué estructura trae la base de datos
      console.log("Datos recibidos del backend:", data);

      // Extraemos el arreglo según la estructura que devuelva el backend
      let lista = [];
      if (Array.isArray(data)) {
        lista = data;
      } else if (data.alumnos && Array.isArray(data.alumnos)) {
        lista = data.alumnos;
      } else if (data.data && Array.isArray(data.data)) {
        lista = data.data;
      }

      setAlumnos(lista);
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
    }
  };

  const listaAlumnos = Array.isArray(alumnos) ? alumnos : [];

  const alumnosFiltrados = listaAlumnos.filter((alumno) => {
    // Busca el nombre sin importar si en PostgreSQL se llama 'nombre', 'nombre_completo' o 'nombreAlumno'
    const nombre = alumno.nombre || alumno.nombre_completo || alumno.nombreAlumno || "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  // Asegura que alumnos sea siempre un array antes de filtrar
  const listaAlumnos = Array.isArray(alumnos) ? alumnos : [];
  
  const alumnosFiltrados = listaAlumnos.filter((alumno) => {
    const nombreAlumno = alumno.nombre || alumno.nombre_completo || "";
    return nombreAlumno.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div style={styles.container}>
      <Sidebar />
      
      <main style={styles.content}>
        {/* ENCABEZADO CLARO */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>👨‍🎓 Gestión de Alumnos</h1>
            <p style={styles.subtitle}>Listado y control de alumnos registrados</p>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y ACCIONES */}
        <div style={styles.topBar}>
          <input
            type="text"
            placeholder="🔍 Buscar alumno por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
          <button style={styles.btnAdd}>+ Agregar Alumno</button>
        </div>

        {/* TABLA SOBRE FONDO CLARO */}
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
      
          {/* Mapea dinámicamente el nombre */}
      <td style={styles.tdBold}>
        {alumno.nombre || alumno.nombre_completo || alumno.nombreAlumno || "Sin Nombre"}
      </td>
      
      {/* Mapea dinámicamente el grado */}
      <td style={styles.td}>
        {alumno.grado || alumno.grado_estudio || alumno.grupo || "N/A"}
      </td>

      {/* Mapea dinámicamente las monedas */}
      <td style={styles.tdCoins}>
        🪙 {alumno.coins ?? alumno.saldo ?? alumno.ceesuv_coins ?? 0}
      </td>

      <td style={styles.tdActions}>
        <button style={styles.btnQr}>📱 Código QR</button>
        <button style={styles.btnEdit}>✏️ Editar</button>
        <button style={styles.btnDelete}>🗑️ Eliminar</button>
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
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F4F6F9",
  },
  content: {
    flex: 1,
    padding: "30px",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
    color: "#0B2341",
  },
  subtitle: {
    margin: "5px 0 0 0",
    color: "#6c757d",
    fontSize: "15px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "15px",
  },
  searchInput: {
    padding: "10px 15px",
    borderRadius: "8px",
    border: "1px solid #ced4da",
    width: "300px",
    fontSize: "14px",
    outline: "none",
  },
  btnAdd: {
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  tableCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  thRow: {
    backgroundColor: "#0B2341",
    color: "white",
  },
  th: {
    padding: "12px 15px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  tr: {
    borderBottom: "1px solid #e9ecef",
  },
  td: {
    padding: "12px 15px",
    color: "#333",
    fontSize: "14px",
  },
  tdBold: {
    padding: "12px 15px",
    color: "#0B2341",
    fontWeight: "600",
    fontSize: "14px",
  },
  tdCoins: {
    padding: "12px 15px",
    fontWeight: "bold",
    color: "#d4af37",
    fontSize: "14px",
  },
  tdActions: {
    padding: "12px 15px",
    display: "flex",
    gap: "8px",
  },
  btnQr: {
    backgroundColor: "#d4af37",
    color: "#0B2341",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
  },
  btnEdit: {
    backgroundColor: "#17a2b8",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    fontSize: "12px",
    cursor: "pointer",
  },
  btnDelete: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    fontSize: "12px",
    cursor: "pointer",
  },
};

export default Alumnos;