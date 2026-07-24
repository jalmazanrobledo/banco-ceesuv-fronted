import React, { useState } from "react";
import logoCeesuv from "/logo-ceesuv.png";

function TarjetaDebito({ alumno }) {
  const [volteada, setVolteada] = useState(false);

  // Extraer datos del alumno con valores por defecto
  const nombre = (alumno?.nombre || "NOMBRE DEL ALUMNO").toUpperCase();
  const idAlumno = alumno?.id || alumno?.id_alumno || 1;
  const gradoGrupo = alumno?.grado ? `${alumno.grado} ${alumno.grupo || ''}` : "ALUMNO CEESUV";

  // GENERAR NÚMERO DE TARJETA ÚNICO (16 DÍGITOS)
  // Formato: 4820 (Prefijo CEESUV) + 0000 + ID en 8 dígitos
  const idFormateado = idAlumno.toString().padStart(8, "0");
  const numeroBruto = `48200000${idFormateado}`;
  const numeroTarjeta = numeroBruto.match(/.{1,4}/g).join(" ");

  // GENERAR CVV ÚNICO (Algoritmo simple derivado del ID)
  const cvv = String((idAlumno * 17 + 103) % 900 + 100);

  return (
    <div style={{ perspective: "1000px", width: "340px", height: "215px", margin: "15px auto" }}>
      <style>{`
        .card-container {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          cursor: pointer;
          border-radius: 15px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        }

        .card-container.is-flipped {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 15px;
          padding: 18px 22px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #0B2341 0%, #163866 50%, #061528 100%);
          border: 1.5px solid #D4AF37;
          color: white;
          overflow: hidden;
        }

        /* Destello dorado/metalizado de fondo */
        .card-face::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(255,255,255,0) 60%);
          pointer-events: none;
        }

        .card-back {
          transform: rotateY(180deg);
          padding: 0;
        }

        /* CHIP EMV CSS */
        .chip-emv {
          width: 42px;
          height: 32px;
          background: linear-gradient(135deg, #e6c670 0%, #c59b27 100%);
          border-radius: 6px;
          position: relative;
          border: 1px solid #8a6810;
          box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
        }

        .chip-emv::after {
          content: "";
          position: absolute;
          top: 35%;
          left: 0;
          width: 100%;
          height: 30%;
          border-top: 1px solid rgba(0,0,0,0.25);
          border-bottom: 1px solid rgba(0,0,0,0.25);
        }
      `}</style>

      <div 
        className={`card-container ${volteada ? "is-flipped" : ""}`}
        onClick={() => setVolteada(!volteada)}
        title="Haz clic para girar la tarjeta"
      >
        {/* FRENTE DE LA TARJETA */}
        <div className="card-face">
          {/* HEADER DE LA TARJETA */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                backgroundColor: "#FFF",
                borderRadius: "50%",
                padding: "2px",
                boxSizing: "border-box"
              }}>
                <img src={logoCeesuv} alt="Logo CEESUV" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "1px", color: "#D4AF37" }}>
                BANCO ESCOLAR
              </span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "900", fontStyle: "italic", letterSpacing: "1.5px", color: "#D4AF37" }}>
              DEBIT
            </span>
          </div>

          {/* CHIP Y SÍMBOLO CONTACTLESS */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "18px" }}>
            <div className="chip-emv"></div>
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", transform: "rotate(90deg)" }}>
              (((
            </span>
          </div>

          {/* NÚMERO DE TARJETA DE DÉBITO */}
          <div style={{ 
            marginTop: "16px", 
            fontSize: "17px", 
            letterSpacing: "2.5px", 
            fontFamily: "'Courier New', Courier, monospace",
            fontWeight: "bold",
            color: "#FFFFFF",
            textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
          }}>
            {numeroTarjeta}
          </div>

          {/* DATOS DEL TITULAR Y VENCIMIENTO */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "14px" }}>
            <div style={{ maxWidth: "210px" }}>
              <div style={{ fontSize: "7px", color: "#B0C4DE", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                TITULAR DE LA CUENTA
              </div>
              <div style={{ 
                fontSize: "12px", 
                fontWeight: "bold", 
                letterSpacing: "0.8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {nombre}
              </div>
              <div style={{ fontSize: "9px", color: "#D4AF37", fontWeight: "600" }}>
                {gradoGrupo}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "6px", color: "#B0C4DE", letterSpacing: "0.5px" }}>VENCE</div>
              <div style={{ fontSize: "11px", fontWeight: "bold", fontFamily: "monospace" }}>07/28</div>
            </div>
          </div>
        </div>

        {/* REVERSO DE LA TARJETA */}
        <div className="card-face card-back">
          {/* BANDA MAGNÉTICA */}
          <div style={{ width: "100%", height: "40px", backgroundColor: "#111", marginTop: "18px" }}></div>

          {/* PANEL DE FIRMA Y CVV */}
          <div style={{ padding: "15px 22px" }}>
            <div style={{ fontSize: "8px", color: "#aaa", marginBottom: "4px" }}>FIRMA AUTORIZADA / CVV</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ 
                flex: 1, 
                height: "28px", 
                backgroundColor: "#e0e0e0", 
                borderRadius: "3px",
                display: "flex",
                alignItems: "center",
                paddingLeft: "10px",
                fontSize: "10px",
                color: "#555",
                fontFamily: "cursive"
              }}>
                CEESUV COINS
              </div>
              <div style={{ 
                width: "45px", 
                height: "28px", 
                backgroundColor: "#FFF", 
                color: "#000", 
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

            {/* TEXTO LEGAL Y MARCA DE AGUA */}
            <div style={{ fontSize: "7px", color: "#88A0C0", marginTop: "18px", lineHeight: "1.3" }}>
              Esta tarjeta es propiedad de CEESUV Banco Escolar. Uso exclusivo para transacciones internas de CEESUV Coins dentro del plantel escolar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TarjetaDebito;