import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { obtenerAlumnos } from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Reportes() {
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para la funcionalidad de IA con Gemini
  const [analisisIA, setAnalisisIA] = useState("");
  const [analizando, setAnalizando] = useState(false);

  useEffect(() => {
    cargarDatosAlumnos();
  }, []);

  const cargarDatosAlumnos = async () => {
    try {
      const data = await obtenerAlumnos();
      // Filtramos para que solo guarde los alumnos que están activos en los reportes
      const alumnosActivos = (data || []).filter(
        (alumno) => !alumno.estado || alumno.estado.toLowerCase() === 'activo'
      );
      setAlumnos(alumnosActivos);
    } catch (error) {
      console.error("Error al cargar alumnos para reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  const DOMINIO_PUBLICO = "https://banco-ceesuv-fronted.vercel.app";

  // Función auxiliar para convertir una imagen externa (URL del QR) en Base64 para jsPDF
  const obtenerImagenBase64DesdeUrl = async (urlImagen) => {
    try {
      const respuesta = await fetch(urlImagen);
      const blob = await respuesta.blob();
      return new Promise((resolve) => {
        const lector = new FileReader();
        lector.onloadend = () => resolve(lector.result);
        lector.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error al convertir QR a base64:", error);
      return null;
    }
  };

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

      // URL del servicio generador de QR en formato PNG
      const urlApiQR = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(enlaceQR)}`;
      
      // Convertimos la imagen del QR a Base64 para que jsPDF la incruste de forma segura
      const qrBase64 = await obtenerImagenBase64DesdeUrl(urlApiQR);

      tablaDatos.push([
        index + 1,
        alumno.nombre.toUpperCase(),
        { content: "", image: qrBase64 },
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
        2: { cellWidth: 35, halign: "center", valign: "middle", minCellHeight: 18 },
        3: { cellWidth: 30, halign: "center", valign: "middle", fontStyle: "bold", textColor: [180, 0, 0] }
      },
      styles: {
        fontSize: 9,
        valign: "middle"
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const cellData = data.cell.raw;
          if (cellData && cellData.image) {
            const dim = 14;
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

  // 🤖 FUNCIÓN PARA CONECTAR CON GEMINI DESDE EL BACKEND
  const generarAnalisisGemini = async () => {
    setAnalizando(true);
    setAnalisisIA("");
    try {
      // Ajusta la URL de tu backend si corre en otro puerto (ej: http://localhost:4000/api/analisis-ia)
      const respuesta = await fetch("http://localhost:4000/api/analisis-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datosAlumnos: alumnos, resumenMovimientos: [] })
      });
      const data = await respuesta.json();
      setAnalisisIA(data.analisis || "No se obtuvo respuesta de la IA.");
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al conectar con Gemini desde el servidor.");
    } finally {
      setAnalizando(false);
    }
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

        {/* Sección 1: Descarga de Credenciales PDF */}
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

        {/* Sección 2: Análisis Inteligente con Gemini */}
        <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginTop: "25px" }}>
          <h3 style={{ color: "#0B2341", marginTop: 0, marginBottom: "15px", fontSize: "18px" }}>
            ✨ Análisis Ejecutivo con Inteligencia Artificial (Gemini)
          </h3>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Obtén un informe automatizado sobre el comportamiento escolar y estadísticas generales procesado por Gemini.
          </p>

          <button
            onClick={generarAnalisisGemini}
            disabled={analizando || cargando}
            style={{
              background: "#D4AF37", // Color dorado institucional
              color: "#0B2341",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              transition: "background 0.2s"
            }}
          >
            {analizando ? "Analizando datos con Gemini..." : "🤖 Generar Informe Inteligente"}
          </button>

          {analisisIA && (
            <div style={{ marginTop: "20px", background: "#F8FAFC", padding: "20px", borderRadius: "8px", borderLeft: "4px solid #0B2341" }}>
              <h4 style={{ color: "#0B2341", marginTop: 0 }}>📋 Informe Generado:</h4>
              <p style={{ color: "#333", whiteSpace: "pre-line", lineHeight: "1.6", fontSize: "14px" }}>
                {analisisIA}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Reportes;