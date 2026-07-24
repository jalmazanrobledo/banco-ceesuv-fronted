import React, { useEffect, useState } from "react";

function TickerDivisas() {
  const [tasas, setTasas] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function obtenerTiposCambio() {
      try {
        // API gratuita y directa en Pesos Mexicanos (MXN)
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        
        if (data && data.rates) {
          // data.rates.MXN nos da el USD/MXN directo
          // data.rates.EUR nos da USD/EUR para calcular EUR/MXN real
          // data.rates.CAD nos da USD/CAD para calcular CAD/MXN real
          const usdMxn = data.rates.MXN;
          const eurMxn = data.rates.MXN / data.rates.EUR;
          const cadMxn = data.rates.MXN / data.rates.CAD;

          setTasas({
            usd: usdMxn.toFixed(2),
            eur: eurMxn.toFixed(2),
            cad: cadMxn.toFixed(2)
          });
        }
      } catch (error) {
        console.error("Error al obtener divisas reales:", error);
      } finally {
        setCargando(false);
      }
    }

    obtenerTiposCambio();
  }, []);

  if (cargando) {
    return (
      <div style={{ background: "#081325", color: "#8A9BA8", padding: "6px 16px", fontSize: "11px", textAlign: "center" }}>
        🌐 Conectando con el mercado de divisas en vivo...
      </div>
    );
  }

  // Si la API falla por alguna razón, usamos valores de respaldo actualizados (~17.50 MXN)
  const usdMxn = tasas?.usd || "17.50";
  const eurMxn = tasas?.eur || "19.05";
  const cadMxn = tasas?.cad || "12.80";

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