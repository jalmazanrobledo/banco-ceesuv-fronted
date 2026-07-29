import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerAlumnos } from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode"; // Importamos la librería qrcode para generar las imágenes

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

// 📄 FUNCIÓN PARA EXPORTAR PDF POR GRADO / SEMESTRE CON CÓDIGOS QR
  const exportarPDFPorGrado = async (gradoSeleccionado) => {
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
    doc.setTextColor(11, 35, 65);
    doc.text("CENTRO DE ESTUDIOS ELEMENTALES Y SUPERIORES DE VALLES", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(212, 175, 55);
    doc.text("BANCO ESCOLAR - CREDENCIALES Y ACCESOS", 105, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Grado / Semestre: ${gradoSeleccionado}`, 14, 30);

    const tablaDatos = [];
    for (let index = 0; index < alumnosFiltradosGrado.length; index++) {
      const alumno = alumnosFiltradosGrado[index];
      const tokenAlumno = alumno.token_qr || alumno.token || alumno.id || alumno._id;
      const enlaceQR = `${DOMINIO_PUBLICO}/consulta/${tokenAlumno}`;

      let qrDataURL = "";
      try {
        qrDataURL = await QRCode.toDataURL(enlaceQR, { width: 120, margin: 1 });
      } catch (err) {
        console.error("Error generando QR para PDF:", err);
      }

      // Estructuramos la celda indicando que su contenido visual será una imagen QR
      tablaDatos.push([
        index + 1,
        alumno.nombre.toUpperCase(),
        { content: "", image: qrDataURL }, // Objeto especial para que el hook lo pinte como imagen
        alumno.pin || "----"
      ]);
    }

    autoTable(doc, {
      startY: 35,
      head: [["#", "NOMBRE DEL ALUMNO", "CÓDIGO QR DE ACCESO", "PIN DE ACCESO"]],
      body: tablaDatos,
      theme: "grid",
      headStyles: {
        fillColor: [11, 35, 65],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", valign: "middle" },
        1: { cellWidth: 85, valign: "middle" },
        2: { cellWidth: 35, halign: "center", valign: "middle", minCellHeight: 18 }, // Altura forzada para la celda del QR
        3: { cellWidth: 30, halign: "center", valign: "middle", fontStyle: "bold", textColor: [180, 0, 0] }
      },
      styles: {
        fontSize: 9,
        valign: "middle"
      },
      // Hook crítico para estampar la imagen del QR de forma limpia en la celda
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const cellData = data.cell.raw;
          if (cellData && cellData.image) {
            const dim = 14; // Tamaño del QR en milímetros dentro de la celda
            const posX = data.cell.x + (data.cell.width - dim) / 2;
            const posY = data.cell.y + (data.cell.height - dim) / 2;
            doc.addImage(cellData.image, "PNG", posX, posY, dim, dim);
          }
        }
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
            Selecciona el grado o semestre para generar un archivo PDF con los códigos QR de consulta y los PINs de acceso de todos los alumnos inscritos.
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