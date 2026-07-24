import React, { useEffect, useState } from "react";

function TickerDivisas() {
  const [tasas, setTasas] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerTiposCambio() {
      try {
        // API gratuita de tipos de cambio oficiales
        const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=MXN,EUR,GBP,CAD");
        const data = await res.json();
        
        if (data && data.rates) {
          setTasas(data.rates);
        }
      } catch (error) {
        console.error("Error al obtener divisas:", error);
      } finally {
        setCargando(false);
      }
    }

    obtenerTiposCambio();
  }, []);

  if (cargando) {
    return (
      <div style={{ background: "#081325", color: "#8A9BA8", padding: "6px 16px", fontSize: "11px", textAlign: "center" }}>
        🌐 Conectando con el mercado de divisas...
      </div>
    );
  }

  // Precios en Pesos Mexicanos (MXN)
  const usdMxn = tasas?.MXN ? tasas.MXN.toFixed(2) : "20.15";
  const eurMxn = tasas?.MXN && tasas?.EUR ? (tasas.MXN / tasas.EUR).toFixed(2) : "21.80";
  const cadMxn = tasas?.MXN && tasas?.CAD ? (tasas.MXN / tasas.CAD).toFixed(2) : "14.50";

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #061325 0%, #0D1B2A 100%)",
        borderBottom: "1px solid rgba(212, 175, 55, 0.4)",
        color: "#FFFFFF",
        padding: "6px 20px",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0px 2px 10px rgba(0,0,0,0.3)"
      }}
    >
      {/* Indicador de estado */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#D4AF37", fontWeight: "bold", letterSpacing: "0.5px" }}>
          🏛️ BANCO CEESUV
        </span>
        <span
          style={{
            fontSize: "9px",
            background: "#10B981",
            color: "#000",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: "bold"
          }}
        >
          EN VIVO
        </span>
      </div>

      {/* Marquee / Ticker de Divisas */}
      <div
        style={{
          display: "flex",
          gap: "18px",
          fontFamily: "'Courier New', Courier, monospace",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", gap: "5px" }}>
          <span style={{ color: "#94A3B8" }}>USD/MXN:</span>
          <strong style={{ color: "#10B981" }}>${usdMxn}</strong>
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          <span style={{ color: "#94A3B8" }}>EUR/MXN:</span>
          <strong style={{ color: "#10B981" }}>${eurMxn}</strong>
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          <span style={{ color: "#94A3B8" }}>CAD/MXN:</span>
          <strong style={{ color: "#10B981" }}>${cadMxn}</strong>
        </div>

        {/* Equivalencia CEESUV COIN */}
        <div
          style={{
            background: "rgba(212, 175, 55, 0.15)",
            border: "1px solid #D4AF37",
            padding: "2px 8px",
            borderRadius: "4px",
            color: "#D4AF37",
            fontWeight: "bold",
            fontSize: "11px"
          }}
        >
          1 COIN = $1.00 MXN
        </div>
      </div>
    </div>
  );
}

export default TickerDivisas;