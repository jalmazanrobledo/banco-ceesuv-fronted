import React, { useState } from "react";
import logoCeesuvHorizontal from "/ceesuv.png";

function TarjetaDebito({ alumno }) {
  const [volteada, setVolteada] = useState(false);

  // Extraer datos del alumno con valores por defecto
  const nombre = (alumno?.nombre || "NOMBRE DEL ALUMNO").toUpperCase();
  const idAlumno = alumno?.id || alumno?.id_alumno || 1;
  const gradoGrupo = alumno?.grado ? `${alumno.grado} ${alumno.grupo || ''}` : "ALUMNO CEESUV";

  // GENERAR NÚMERO DE TARJETA ÚNICO (16 DÍGITOS)
  const idFormateado = idAlumno.toString().padStart(8, "0");
  const numeroBruto = `48200000${idFormateado}`;
  const numeroTarjeta = numeroBruto.match(/.{1,4}/g).join(" ");

  // GENERAR CVV ÚNICO
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
          border-radius: 16px;
        }

        .card-container.is-flipped {
          transform: rotateY(180deg);
        }

        /* ESTILO PLANO Y DIFUMINADO (FLAT GRADIENT) */
        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 16px;
          padding: 16px 20px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #0B2341 0%, #163156 50%, #1C3B66 100%);
          border: 1px solid rgba(212, 175, 55, 0.35);
          color: white;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        /* Difuminado suave de fondo */
        .card-face::before {
          content: "";
          position: absolute;
          top: -40%;
          right: -40%;
          width: 180%;
          height: 180%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 60%);
          pointer-events: none;
        }

        .card-back {
          transform: rotateY(180deg);
          padding: 0;
        }

        /* CHIP EMV PLANO */
        .chip-emv {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #e6c670 0%, #c59b27 100%);
          border-radius: 5px;
          position: relative;
          border: 1px solid rgba(0,0,0,0.15);
        }

        .chip-emv::after {
          content: "";
          position: absolute;
          top: 35%;
          left: 0;
          width: 100%;
          height: 30%;
          border-top: 1px solid rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(0,0,0,0.2);
        }
      `}</style>

      <div 
        className={`card-container ${volteada ? "is-flipped" : ""}`}
        onClick={() => setVolteada(!volteada)}
        title="Haz clic para girar la tarjeta"
      >
        {/* FRENTE DE LA TARJETA */}
        <div className="card-face">
          {/* HEADER: LOGO Y "BANCO CEESUV" CENTRADOS EN LA TARJETA | "DEBIT" EN LA ESQUINA DERECHA */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "65px" }}>
            
            {/* BLOQUE CENTRADO */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img 
                src={logoCeesuvHorizontal} 
                alt="Logo CEESUV" 
                style={{ 
                  height: "70px", 
                  objectFit: "contain",
                  filter: "brightness(0) invert(1) drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
                }} 
              />
              <span style={{ 
                fontSize: "12px", 
                fontWeight: "bold", 
                letterSpacing: "1px", 
                color: "#D4AF37",
                lineHeight: "1.2"
              }}>
                BANCO<br/>CEESUV
              </span>
            </div>

            {/* ETIQUETA DEBIT DE DERECHA */}
            <span style={{ 
              position: "absolute",
              right: "0px",
              top: "0px",
              fontSize: "12px", 
              fontWeight: "800", 
              fontStyle: "italic", 
              letterSpacing: "1.5px", 
              color: "#FFF",
              opacity: 0.9
            }}>
              DEBITO
            </span>
          </div>

          {/* CHIP Y SÍMBOLO CONTACTLESS */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
            <div className="chip-emv"></div>
            <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", transform: "rotate(90deg)", fontWeight: "bold" }}>
              (((
            </span>
          </div>

          {/* NÚMERO DE TARJETA */}
          <div style={{ 
            marginTop: "12px", 
            fontSize: "17px", 
            letterSpacing: "2.5px", 
            fontFamily: "'Courier New', Courier, monospace",
            fontWeight: "600",
            color: "#FFFFFF"
          }}>
            {numeroTarjeta}
          </div>

          {/* DATOS DEL TITULAR Y VENCIMIENTO */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "10px" }}>
            <div style={{ maxWidth: "210px" }}>
              <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
              <div style={{ fontSize: "6px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px" }}>VENCE</div>
              <div style={{ fontSize: "11px", fontWeight: "bold", fontFamily: "monospace" }}>07/28</div>
            </div>
          </div>
        </div>

        {/* REVERSO DE LA TARJETA */}
        <div className="card-face card-back">
          {/* BANDA MAGNÉTICA */}
          <div style={{ width: "100%", height: "38px", backgroundColor: "#0A121E", marginTop: "18px" }}></div>

          {/* PANEL DE FIRMA Y CVV */}
          <div style={{ padding: "15px 22px" }}>
            <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>FIRMA AUTORIZADA / CVV</div>
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
                color: "#475569",
                fontFamily: "cursive"
              }}>
                CEESUV COINS
              </div>
              <div style={{ 
                width: "45px", 
                height: "26px", 
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

            {/* TEXTO LEGAL */}
            <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.5)", marginTop: "18px", lineHeight: "1.3" }}>
              Esta tarjeta es propiedad de BANCO CEESUV. Uso exclusivo para transacciones internas de CEESUV Coins dentro del plantel escolar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TarjetaDebito;