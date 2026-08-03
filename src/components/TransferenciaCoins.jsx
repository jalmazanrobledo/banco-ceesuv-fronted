import React, { useState } from "react";

export default function TransferenciaCoins({ alumnoActual, onTransferenciaExitosa }) {
  const [destino, setDestino] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [concepto, setConcepto] = useState("");
  const [pin, setPin] = useState("");
  
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleTransferir = async (e) => {
    e.preventDefault();
    setMensaje(null);

    const destinoLimpio = destino.trim();

    // Validar longitudes permitidas: Cuenta (10), Tarjeta (16) o CLABE (18)
    if (![10, 16, 18].includes(destinoLimpio.length)) {
      setMensaje({ tipo: "error", texto: "El destino debe ser una Cuenta (10 dígitos), Tarjeta (16 dígitos) o CLABE (18 dígitos)." });
      return;
    }

    if (!cantidad || isNaN(cantidad) || Number(cantidad) <= 0) {
      setMensaje({ tipo: "error", texto: "Ingresa una cantidad válida de coins a enviar." });
      return;
    }

    if (!pin || pin.length !== 4) {
      setMensaje({ tipo: "error", texto: "Ingresa tu PIN de seguridad de 4 dígitos." });
      return;
    }

    const remitenteId = alumnoActual?.alumno_id || alumnoActual?.id;

    if (!remitenteId) {
      setMensaje({ tipo: "error", texto: "No se identificó la sesión del remitente." });
      return;
    }

    setProcesando(true);

    try {
      const response = await fetch("https://banco-ceesuv-backend.onrender.com/api/transferencias/spei", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emisor_id: Number(remitenteId),
          clabe_destino: destinoLimpio, // El backend lo leerá sin problemas
          monto: Number(cantidad),
          pin: pin.trim(),
          concepto: concepto.trim() || "Transferencia CEESUV Coins"
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje({ tipo: "success", texto: "¡Transferencia realizada con éxito!" });
        setDestino("");
        setCantidad("");
        setConcepto("");
        setPin("");
        if (onTransferenciaExitosa) {
          onTransferenciaExitosa();
        }
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Error al procesar la transferencia." });
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
        🏦 Módulo de Transferencias
      </h3>

      <form onSubmit={handleTransferir} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#475569" }}>
            Destino (Cuenta 10, Tarjeta 16 o CLABE 18 dígitos)
          </label>
          <input
            type="text"
            maxLength="18"
            placeholder="Ingresa cuenta, tarjeta o CLABE"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
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
            PIN de Seguridad (4 dígitos)
          </label>
          <input
            type="password"
            maxLength="4"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
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
          {procesando ? "Procesando Transferencia..." : "Enviar Transferencia"}
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