import React, { useState } from "react";

export default function TransferenciaCoins({ alumnoActual, onTransferenciaExitosa }) {
  const [tarjetaDestino, setTarjetaDestino] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [concepto, setConcepto] = useState("");
  const [referencia, setReferencia] = useState("");
  
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleTransferir = async (e) => {
    e.preventDefault();
    setMensaje(null);

    if (!tarjetaDestino || tarjetaDestino.length !== 16) {
      setMensaje({ tipo: "error", texto: "Ingresa un número de tarjeta válido de 16 dígitos." });
      return;
    }

    if (!cantidad || isNaN(cantidad) || Number(cantidad) <= 0) {
      setMensaje({ tipo: "error", texto: "Ingresa una cantidad válida de coins a enviar." });
      return;
    }

    const remitenteId = alumnoActual?.alumno_id || alumnoActual?.id;

    if (!remitenteId) {
      setMensaje({ tipo: "error", texto: "No se identificó la sesión del remitente." });
      return;
    }

    setProcesando(true);

    try {
      const response = await fetch("https://banco-ceesuv-backend.onrender.com/api/transferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remitente_id: Number(remitenteId),
          tarjeta_destino: tarjetaDestino.trim(),
          cantidad: Number(cantidad),
          concepto: concepto.trim() || "Transferencia CEESUV Coins",
          referencia: referencia.trim() || String(Math.floor(100000 + Math.random() * 900000))
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ tipo: "success", texto: "¡Transferencia realizada con éxito!" });
        setTarjetaDestino("");
        setCantidad("");
        setConcepto("");
        setReferencia("");
        if (onTransferenciaExitosa) {
          onTransferenciaExitosa();
        }
      } else {
        setMensaje({ tipo: "error", texto: data.mensaje || "Error al procesar la transferencia." });
      }
    } catch (error) {
      console.error("Error de red:", error);
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      color: "#0c1527",
      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      maxWidth: "500px",
      margin: "0 auto"
    }}>
      <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", textAlign: "center", color: "#0c1527" }}>
        🔄 Transferir CEESUV Coins
      </h3>

      <form onSubmit={handleTransferir} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#475569" }}>
            Número de Tarjeta Destino (16 dígitos)
          </label>
          <input
            type="text"
            maxLength="16"
            placeholder="4820000XXXXXXXXX"
            value={tarjetaDestino}
            onChange={(e) => setTarjetaDestino(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#475569" }}>
            Cantidad de Coins a Enviar
          </label>
          <input
            type="number"
            placeholder="Ej. 50"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#475569" }}>
            Concepto
          </label>
          <input
            type="text"
            placeholder="Ej. Pago de proyecto, Apuntes..."
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#475569" }}>
            Número de Referencia (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. REF-001"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={procesando}
          style={{
            background: "#0c1527",
            color: "white",
            border: "none",
            padding: "12px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            marginTop: "6px",
            transition: "background 0.2s"
          }}
        >
          {procesando ? "Procesando..." : "Realizar Transferencia"}
        </button>
      </form>

      {mensaje && (
        <p style={{
          marginTop: "15px",
          textAlign: "center",
          fontSize: "13px",
          fontWeight: "bold",
          color: mensaje.tipo === "error" ? "#ef4444" : "#10b981"
        }}>
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}