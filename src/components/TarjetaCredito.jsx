import React, { useState } from "react";
import logoCeesuvHorizontal from "/ceesuv.png";

function TarjetaCredito({ alumno }) {
  const [volteada, setVolteada] = useState(false);

  if (!alumno) {
    return <p style={{ textAlign: "center", color: "#64748b" }}>Cargando información de la tarjeta...</p>;
  }

  // 1. Obtener el grado/semestre desde la base de datos (ej. "1░ Secundaria", "3░ Semestre")
  const gradoStr = String(alumno?.grado || "").trim().toLowerCase();

  // 2. Definir los niveles y grados exactos autorizados para Crédito:
  // - Secundaria: 1, 2, 3
  // - Semestre: 1, 3, 5
  const esSecundariaPermitida = (gradoStr.includes("secundaria") && (gradoStr.startsWith("1") || gradoStr.startsWith("2") || gradoStr.startsWith("3")));
  const esSemestrePermitido = (gradoStr.includes("semestre") && (gradoStr.startsWith("1") || gradoStr.startsWith("3") || gradoStr.startsWith("5")));

  const esPermitido = esSecundariaPermitida || esSemestrePermitido;

  // Si no pertenece a los grados autorizados, mostramos aviso elegante
  if (!esPermitido) {
    return (
      <div style={{
        background: "rgba(19, 34, 56, 0.9)",
        borderRadius: "16px",
        padding: "30px",
        textAlign: "center",
        maxWidth: "420px",
        margin: "15px auto",
        border: "1px solid #1e3250",
        color: "white"
      }}>
        <h3 style={{ color: "#d4af37", marginBottom: "10px" }}>💳 Tarjeta de Crédito CEESUV</h3>
        <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>
          Este módulo de tarjeta de crédito está disponible exclusivamente para alumnos de **Secundaria (1°, 2°, 3°)** y **Bachillerato (1°, 3° y 5° Semestre)**.
        </p>
      </div>
    );
  }

  // Definir idAlumno de forma segura
  const idAlumno = alumno?.id || alumno?.alumno_id || 1;

  // Extraer el nombre completo combinando nombre y apellidos
  const nombreCompleto = (
    alumno?.nombre_completo ||
    `${alumno?.nombre || ""} ${alumno?.apellidos || alumno?.apellido || ""}`
  ).trim();

  const nombre = (nombreCompleto || "NOMBRE DEL ALUMNO").toUpperCase();

  // GENERAR NÚMERO DE TARJETA DE CRÉDITO ÚNICO (Prefijo 5245 para crédito)
  const idFormateado = idAlumno.toString().padStart(8, "0");
  const numeroBruto = `52450000${idFormateado}`;
  const numeroTarjeta = numeroBruto.match(/.{1,4}/g).join(" ");

  // GENERAR CVV ÚNICO
  const cvv = String((idAlumno * 23 + 157) % 900 + 100);

  return (
    <div style={{ perspective: "1000px", width: "340px", height: "215px", margin: "15px auto" }}>
      <style>{`
        .card-container-credito {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          cursor: pointer;
          border-radius: 16px;
        }

        .card-container-credito.is-flipped {
          transform: rotateY(180deg);
        }

        /* DISEÑO EXCLUSIVO DORADO CON ACENTOS EN AZUL MARINO */
        .card-face-credito {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 16px;
          padding: 16px 20px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #d4af37 0%, #aa7c11 50%, #f3e5ab 100%);
          border: 1px solid #f1c40f;
          color: #0c1527; /* Azul marino principal para textos */
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .card-face-credito::before {
          content: "";
          position: absolute;
          top: -40%;
          right: -40%;
          width: 180%;
          height: 180%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 60%);
          pointer-events: none;
        }

        .card-back-credito {
          transform: rotateY(180deg);
          padding: 0;
          background: linear-gradient(135deg, #b89728 0%, #8e680c 50%, #d4af37 100%);
        }

        /* CHIP EMV */
        .chip-emv-credito {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #2c3e50 100%, #bdc3c7 0%);
          border-radius: 5px;
          position: relative;
          border: 1px solid rgba(0,0,0,0.3);
        }

        .chip-emv-credito::after {
          content: "";
          position: absolute;
          top: 35%;
          left: 0;
          width: 100%;
          height: 30%;
          border-top: 1px solid rgba(255,255,255,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.3);
        }
      `}</style>

      <div 
        className={`card-container-credito ${volteada ? "is-flipped" : ""}`}
        onClick={() => setVolteada(!volteada)}
        title="Haz clic para girar la tarjeta"
      >
        {/* FRENTE DE LA TARJETA DE CRÉDITO */}
        <div className="card-face-credito">
          {/* HEADER: LOGO | BANCO CEESUV | CREDITO */}
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: "45px" }}>
            
            {/* Logo en la esquina superior izquierda (Con filtro oscuro para contraste sobre dorado) */}
            <img 
              src={logoCeesuvHorizontal} 
              alt="Logo CEESUV" 
              style={{ 
                height: "55px", 
                objectFit: "contain",
                filter: "brightness(0.1) drop-shadow(0px 1px 2px rgba(255,255,255,0.5))"
              }} 
            />

            {/* Texto BANCO CEESUV centrado */}
            <span style={{ 
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "12px", 
              fontWeight: "900", 
              letterSpacing: "1px", 
              color: "#0c1527",
              lineHeight: "1.2",
              textAlign: "center"
            }}>
              BANCO<br/>CEESUV
            </span>

            {/* Texto CREDITO en la esquina superior derecha con estilo etiqueta */}
            <span style={{ 
              backgroundColor: "#0c1527", 
              color: "#d4af37", 
              padding: "4px 8px", 
              borderRadius: "6px", 
              fontSize: "10px", 
              fontWeight: "bold",
              letterSpacing: "1px"
            }}>
              CRÉDITO
            </span>
          </div>

          {/* CHIP Y SÍMBOLO CONTACTLESS */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <div className="chip-emv-credito"></div>
            <span style={{ fontSize: "15px", color: "rgba(12, 21, 39, 0.5)", transform: "rotate(90deg)", fontWeight: "bold" }}>
              (((
            </span>
          </div>

          {/* NÚMERO DE TARJETA */}
          <div style={{ 
            marginTop: "12px", 
            fontSize: "17px", 
            letterSpacing: "2.5px", 
            fontFamily: "'Courier New', Courier, monospace",
            fontWeight: "bold",
            color: "#0c1527"
          }}>
            {numeroTarjeta}
          </div>

          {/* DATOS DEL TITULAR Y VENCIMIENTO */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "12px" }}>
            <div style={{ maxWidth: "220px", width: "100%" }}>
              <div style={{ fontSize: "7px", color: "#334155", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "0.5px" }}>
                TITULAR DE LA CUENTA
              </div>
              <div style={{ 
                fontSize: nombre && nombre.length > 18 ? "10px" : "13px", 
                fontWeight: "bold", 
                color: "#0c1527",
                letterSpacing: "0.8px",
                whiteSpace: "nowrap",
                overflow: "hidden"
              }}>
                {nombre}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "6px", color: "#334155", fontWeight: "bold", letterSpacing: "0.5px" }}>VENCE</div>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#0c1527", fontFamily: "monospace" }}>12/28</div>
            </div>
          </div>
        </div>

        {/* REVERSO DE LA TARJETA DE CRÉDITO */}
        <div className="card-face-credito card-back-credito">
          {/* BANDA MAGNÉTICA */}
          <div style={{ width: "100%", height: "38px", backgroundColor: "#0c1527", marginTop: "18px" }}></div>

          {/* PANEL DE FIRMA Y CVV */}
          <div style={{ padding: "15px 22px" }}>
            <div style={{ fontSize: "8px", color: "#1e293b", fontWeight: "bold", marginBottom: "4px" }}>FIRMA AUTORIZADA / CVV</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ 
                flex: 1, 
                height: "26px", 
                backgroundColor: "#F1F5F9", 
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
                paddingLeft: "10px",
                fontSize: "10px",
                color: "#0c1527",
                fontFamily: "cursive",
                fontWeight: "bold"
              }}>
                CREDITO CEESUV
              </div>
              <div style={{ 
                width: "45px", 
                height: "26px", 
                backgroundColor: "#0c1527", 
                color: "#d4af37", 
                fontWeight: "bold", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontFamily: "monospace",
                borderRadius: "3px",
                fontSize: "12px"
              }}>
                {cvv}
              </div>
            </div>

            {/* TEXTO LEGAL */}
            <div style={{ fontSize: "7px", color: "#1e293b", fontWeight: "600", marginTop: "18px", lineHeight: "1.3" }}>
              Tarjeta de crédito escolar autorizada por BANCO CEESUV. Su uso está sujeto a los lineamientos de comportamiento y desempeño académico institucional.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TarjetaCredito;