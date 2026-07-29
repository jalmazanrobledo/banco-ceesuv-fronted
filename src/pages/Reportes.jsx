import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerAlumnos } from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Importación correcta para evitar errores de tipo "is not a function"

function Reportes() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosAlumnos();
  }, []);

  const cargarDatosAlumnos = async () => {
    try {
      const data = await obtenerAlumnos();
      setAlumnos(data || []);
    } catch (error) {
      console.error("Error al cargar alumnos para reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  const DOMINIO_PUBLICO = "https://banco-ceesuv-fronted.vercel.app";

  // 📄 FUNCIÓN PARA EXPORTAR PDF POR GRADO / SEMESTRE
  const exportarPDFPorGrado = (gradoSeleccionado) => {
    const alumnosFiltradosGrado = alumnos.filter(
      (alumno) => alumno.grado && alumno.grado.trim().toLowerCase() === gradoSeleccionado.trim().toLowerCase()
    );

    if (alumnosFiltradosGrado.length === 0) {
      alert(`No hay alumnos registrados en el grado: ${gradoSeleccionado}`);
      return;
    }

    const doc = new jsPDF();

    // Encabezado institucional
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(11, 35, 65); // Azul institucional CEESUV
    doc.text("CENTRO DE ESTUDIOS ELEMENTALES Y SUPERIORES DE VALLES", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(212, 175, 55); // Dorado institucional
    doc.text("BANCO ESCOLAR - CREDENCIALES Y ACCESOS", 105, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Grado / Semestre: ${gradoSeleccionado}`, 14, 30);

    const tablaDatos = alumnosFiltradosGrado.map((alumno, index) => {
      const tokenAlumno = alumno.token_qr || alumno.token || alumno.id || alumno._id;
      const enlaceQR = `${DOMINIO_PUBLICO}/consulta/${tokenAlumno}`;
      return [
        index + 1,
        alumno.nombre.toUpperCase(),
        enlaceQR,
        alumno.pin || "----"
      ];
    });

    // Uso correcto de autoTable importado como función
    autoTable(doc, {
      startY: 35,
      head: [["#", "NOMBRE DEL ALUMNO", "ENLACE / CÓDIGO QR", "PIN DE ACCESO"]],
      body: tablaDatos,
      theme: "grid",
      headStyles: {
        fillColor: [11, 35, 65],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 80 },
        2: { cellWidth: 75, fontSize: 8 },
        3: { cellWidth: 25, halign: "center", fontStyle: "bold", textColor: [180, 0, 0] }
      },
      styles: {
        valign: "middle",
        fontSize: 9
      },
      foot: [
        [
          {
            content: `Total de alumnos en este grado: ${alumnosFiltradosGrado.length}`,
            colSpan: 4,
            styles: { halign: "right", fontStyle: "bold", textColor: [50, 50, 50] }
          }
        ]
      ]
    });

    doc.save(`Credenciales_Y_Accesos_${gradoSeleccionado.replace(/°\s/g, "_").toLowerCase()}.pdf`);
  };

  const gradosDisponibles = [
    "1° Primaria", "2° Primaria", "3° Primaria", 
    "4° Primaria", "5° Primaria", "6° Primaria", 
    "1° Secundaria", "2° Secundaria", "3° Secundaria", 
    "1° Semestre", "3° Semestre", "5° Semestre"
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F4F7FA", fontFamily: "sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "30px", boxSizing: "border-box" }}>
        
        <div style={{ marginBottom: "25px" }}>
          <h1 style={{ color: "#0B2341", margin: 0, fontSize: "28px" }}>📊 Reportes y Credenciales</h1>
          <p style={{ color: "#666", margin: "5px 0 0 0", fontSize: "15px" }}>
            Generación de documentos PDF y reportes institucionales por grado escolar
          </p>
        </div>

        <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ color: "#0B2341", marginTop: 0, marginBottom: "15px", fontSize: "18px" }}>
            📥 Descargar Credenciales y Accesos (PDF por Grado)
          </h3>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Selecciona el grado o semestre para generar un archivo PDF con los enlaces de consulta QR y los PINs de acceso de todos los alumnos inscritos.
          </p>

          {cargando ? (
            <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>Cargando datos de alumnos...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
              {gradosDisponibles.map((gradoItem) => (
                <button
                  key={gradoItem}
                  onClick={() => exportarPDFPorGrado(gradoItem)}
                  style={{
                    background: "#0B2341",
                    color: "white",
                    border: "none",
                    padding: "12px 15px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#153a6b")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "#0B2341")}
                >
                  📄 {gradoItem}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Reportes;