import React, { useState } from "react";

export default function TransferenciaCoins({ alumnoActual, onTransferenciaExitosa }) {
  const [tarjetaDestino, setTarjetaDestino] = useState("");
  const [monto, setMonto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const manejarCambioTarjeta = (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 16) valor = valor.slice(0, 16);
    setTarjetaDestino(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: "" });

    if (!tarjetaDestino || tarjetaDestino.length !== 16) {
      setMensaje({ texto: "El número de tarjeta debe tener 16 dígitos.", tipo: "error" });
      return;
    }

    if (!monto || Number(monto) <= 0) {
      setMensaje({ texto: "Ingresa un monto válido a transferir.", tipo: "error" });
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("https://banco-ceesuv-backend.onrender.com/api/transferir-por-tarjeta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remitenteId: Number(alumnoActual?.id || alumnoActual?.alumno_id),
          numeroTarjetaDestino: tarjetaDestino,
          monto: Number(monto)
        })
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(data.error || data.mensaje || "Error al realizar la transferencia.");
      }

      setMensaje({ texto: data.mensaje || "¡Transferencia realizada con éxito!", tipo: "exito" });
      setTarjetaDestino("");
      setMonto("");

      if (onTransferenciaExitosa) {
        onTransferenciaExitosa();
      }

    } catch (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "Error al realizar la transferencia.");
      }

      setMensaje({ texto: "¡Transferencia realizada con éxito!", tipo: "exito" });
      setTarjetaDestino("");
      setMonto("");

      if (onTransferenciaExitosa) {
        onTransferenciaExitosa();
      }

    } catch (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", color: "#0f172a" }}>
      <h3 style={{ textAlign: "center", color: "#0B2341", marginBottom: "15px" }}>🔄 Transferir CEESUV Coins</h3>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>
            Número de Tarjeta Destino (16 dígitos)
          </label>
          <input
            type="text"
            value={tarjetaDestino}
            onChange={manejarCambioTarjeta}
            placeholder="48200000XXXXXXXX"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", fontFamily: "monospace", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "5px" }}>
            Cantidad de Coins a Enviar
          </label>
          <input
            type="number"
            min="1"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ej. 50"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            backgroundColor: cargando ? "#94a3b8" : "#0B2341",
            color: "#ffffff",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: cargando ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {cargando ? "Procesando..." : "Realizar Transferencia"}
        </button>

        {mensaje.texto && (
          <div style={{
            padding: "10px",
            borderRadius: "6px",
            fontSize: "13px",
            textAlign: "center",
            backgroundColor: mensaje.tipo === "exito" ? "#dcfce7" : "#fee2e2",
            color: mensaje.tipo === "exito" ? "#166534" : "#991b1b",
            border: `1px solid ${mensaje.tipo === "exito" ? "#bbf7d0" : "#fca5a5"}`
          }}>
            {mensaje.texto}
          </div>
        )}
      </form>
    </div>
  );
}