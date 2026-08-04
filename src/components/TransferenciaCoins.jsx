import React, { useState, useEffect } from "react";

export default function TransferenciaCoins({ alumnoActual, onTransferenciaExitosa, mostrarToast }) {
  // Pasos: 1. Destino, 2. Monto y Concepto, 3. PIN de Seguridad, 4. Éxito (Voucher)
  const [paso, setPaso] = useState(1);

  // Estados del formulario
  const [bancoDestino, setBancoDestino] = useState("BANCO CEESUV");
  const [tipoDestino, setTipoDestino] = useState("nuevo"); // 'nuevo' o 'guardado'
  const [identificadorDestino, setIdentificadorDestino] = useState("");
  
  // Estados para la validación y datos dinámicos del destinatario
  const [destinatarioVerificado, setDestinatarioVerificado] = useState(null);
  const [buscandoDestinatario, setBuscandoDestinatario] = useState(false);

  const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
  const [contactosGuardados, setContactosGuardados] = useState([]);
  
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [pin, setPin] = useState("");
  const [aliasGuardar, setAliasGuardar] = useState("");
  const [guardarContactoCheck, setGuardarContactoCheck] = useState(false);

  const [procesando, setProcesando] = useState(false);
  const [datosTicket, setDatosTicket] = useState(null);

  // Cargar contactos guardados desde el backend de PostgreSQL al iniciar
  useEffect(() => {
    const alumnoId = Number(alumnoActual?.alumno_id || alumnoActual?.id);
    if (!alumnoId) return;

    fetch(`https://banco-ceesuv-backend.onrender.com/api/contactos/${alumnoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setContactosGuardados(data);
        }
      })
      .catch((e) => console.error("Error al cargar contactos de la BD:", e));
  }, [alumnoActual]);

  // Función para buscar al alumno en tiempo real por Cuenta, Tarjeta o CLABE
  const buscarDestinatarioBackend = async (valorBusqueda) => {
    const query = String(valorBusqueda || "").trim();
    if (!query || query.length < 3) {
      setDestinatarioVerificado(null);
      return;
    }

    setBuscandoDestinatario(true);
    try {
      const res = await fetch(`https://banco-ceesuv-backend.onrender.com/api/alumnos/buscar?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.nombre) {
          setDestinatarioVerificado(data);
          mostrarToast(`Destinatario encontrado: ${data.nombre}`, "success");
        } else {
          setDestinatarioVerificado(null);
          mostrarToast("No se encontró ningún alumno con ese identificador.", "error");
        }
      } else {
        setDestinatarioVerificado(null);
      }
    } catch (error) {
      console.error("Error buscando destinatario:", error);
      setDestinatarioVerificado(null);
    } finally {
      setBuscandoDestinatario(false);
    }
  };

  // Avanzar al paso 2 (Monto) desde Destino
  const handleContinuarADestino = (e) => {
    e.preventDefault();

    let cuentaFinal = "";
    let nombreFinal = "";

    if (tipoDestino === "nuevo") {
      cuentaFinal = String(identificadorDestino).trim();
      if (!cuentaFinal) {
        mostrarToast("Ingresa un número de cuenta, tarjeta o CLABE válido.", "error");
        return;
      }
      if (!destinatarioVerificado) {
        mostrarToast("Debes verificar o ingresar un destinatario válido.", "error");
        return;
      }
      nombreFinal = destinatarioVerificado.nombre;
    } else {
      if (!contactoSeleccionado) {
        mostrarToast("Selecciona un contacto guardado.", "error");
        return;
      }
      cuentaFinal = String(contactoSeleccionado.cuenta || contactoSeleccionado.numero_cuenta || contactoSeleccionado.tarjeta_debito || contactoSeleccionado.clabe).trim();
      nombreFinal = contactoSeleccionado.nombre;
    }

    if (String(cuentaFinal) === String(alumnoActual?.numero_cuenta || alumnoActual?.cuenta)) {
      mostrarToast("No puedes realizar una transferencia a tu propia cuenta.", "error");
      return;
    }

    setPaso(2);
  };

  // Avanzar al paso 3 (PIN)
  const handleContinuarAMonto = (e) => {
    e.preventDefault();
    const cant = Number(monto);
    const disponibles = Number(alumnoActual?.coins || 0);

    if (!cant || cant <= 0) {
      mostrarToast("Ingresa una cantidad válida de Coins.", "error");
      return;
    }
    if (cant > disponibles) {
      mostrarToast("No tienes suficientes Coins disponibles para esta transferencia.", "error");
      return;
    }

    setPaso(3);
  };

  // Ejecutar transferencia final
  const handleEjecutarTransferencia = async (e) => {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      mostrarToast("Ingresa tu PIN de seguridad de 4 dígitos.", "error");
      return;
    }

    setProcesando(true);

    try {
    // 1. Obtener y validar la cuenta destino de forma robusta
    const cuentaDestinoFinal = tipoDestino === "nuevo" 
      ? identificadorDestino 
      : (contactoSeleccionado?.cuenta || contactoSeleccionado?.numero_cuenta || contactoSeleccionado?.tarjeta_debito || contactoSeleccionado?.clabe || contactoSeleccionado?.numeroCuenta);

    // DEPURACIÓN: Revisa tu consola (F12) para ver qué valor exacto está tomando
    console.log("DEBUG - Cuenta destino enviada:", cuentaDestinoFinal);

    if (!cuentaDestinoFinal) {
      mostrarToast("No se pudo identificar la cuenta o tarjeta del destinatario.", "error");
      setProcesando(false);
      return;
    }

    const nombreDestinoFinal = tipoDestino === "nuevo" 
      ? (destinatarioVerificado?.nombre || "Destinatario") 
      : (contactoSeleccionado?.nombre || "Destinatario");

    const response = await fetch("https://banco-ceesuv-backend.onrender.com/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alumno_id: Number(alumnoActual?.alumno_id || alumnoActual?.id),
        tipo: "SALIDA",
        cantidad: Number(monto),
        motivo: `Transferencia a ${nombreDestinoFinal} (${bancoDestino}): ${concepto || 'Sin concepto'}`,
        usuario: alumnoActual?.nombre || "Estudiante",
        cuentaDestino: String(cuentaDestinoFinal).trim() // Aseguramos que viaje limpio y como texto
      })
    });

      if (response.ok) {
        // Si marcó guardar contacto y es nuevo, guardarlo en la Base de Datos
        if (guardarContactoCheck && tipoDestino === "nuevo" && aliasGuardar) {
          try {
            await fetch("https://banco-ceesuv-backend.onrender.com/api/contactos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usuario_id: Number(alumnoActual?.alumno_id || alumnoActual?.id),
                nombre: aliasGuardar,
                cuenta: identificadorDestino,
                banco: bancoDestino
              })
            });
          } catch (err) {
            console.error("Error al guardar contacto en BD:", err);
          }
        }

        const ticketData = {
          folio: "CEESUV-" + Math.floor(100000 + Math.random() * 900000),
          fecha: new Date().toLocaleString(),
          origen: alumnoActual?.nombre || "ESTUDIANTE",
          cuentaOrigen: alumnoActual?.numero_cuenta || alumnoActual?.cuenta || "N/A",
          destino: nombreDestinoFinal,
          cuentaDestino: cuentaDestinoFinal,
          bancoDestino: bancoDestino,
          monto: Number(monto),
          concepto: concepto || "Transferencia entre cuentas",
          referencia: "REF-" + Math.floor(1000 + Math.random() * 9000)
        };

        setDatosTicket(ticketData);
        setPaso(4);
        mostrarToast("¡Transferencia realizada con éxito!", "success");
        if (onTransferenciaExitosa) onTransferenciaExitosa();
      } else {
        const errData = await response.json().catch(() => ({}));
        mostrarToast(errData.mensaje || "Error al procesar la transferencia.", "error");
      }
    } catch (error) {
      console.error("Error de red:", error);
      mostrarToast("Error de conexión al procesar la transferencia.", "error");
    } finally {
      setProcesando(false);
    }
  };

  const reiniciarFormulario = () => {
    setPaso(1);
    setMonto("");
    setConcepto("");
    setPin("");
    setIdentificadorDestino("");
    setDestinatarioVerificado(null);
    setContactoSeleccionado(null);
    setDatosTicket(null);
    setGuardarContactoCheck(false);
    setAliasGuardar("");
  };

  const compartirTicket = () => {
    if (!datosTicket) return;
    const textoCompartir = `🧾 *COMPROBANTE DE TRANSFERENCIA - BANCO CEESUV*\n\nFolio: ${datosTicket.folio}\nFecha: ${datosTicket.fecha}\nDestino: ${datosTicket.destino} (${datosTicket.bancoDestino})\nCuenta: ${datosTicket.cuentaDestino}\nMonto: ${datosTicket.monto} COINS\nConcepto: ${datosTicket.concepto}\nReferencia: ${datosTicket.referencia}\n\n¡Operación exitosa!`;

    if (navigator.share) {
      navigator.share({ title: 'Comprobante Banco CEESUV', text: textoCompartir }).catch(() => {});
    } else {
      navigator.clipboard.writeText(textoCompartir);
      mostrarToast("¡Comprobante copiado al portapapeles para compartir!", "success");
    }
  };

  return (
    <div style={{ background: "rgba(12, 21, 39, 0.85)", border: "1px solid #1e3250", borderRadius: "16px", padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      
      {/* INDICADOR DE PASOS */}
      {paso < 4 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "12px", color: "#94a3b8", borderBottom: "1px solid #1e3250", paddingBottom: "10px" }}>
          <span style={{ color: paso === 1 ? "#f59e0b" : "#10b981", fontWeight: "bold" }}>1. Destino</span>
          <span>➡️</span>
          <span style={{ color: paso === 2 ? "#f59e0b" : paso > 2 ? "#10b981" : "#94a3b8", fontWeight: "bold" }}>2. Monto y Concepto</span>
          <span>➡️</span>
          <span style={{ color: paso === 3 ? "#f59e0b" : "#94a3b8", fontWeight: "bold" }}>3. PIN de Seguridad</span>
        </div>
      )}

      {/* ================= PASO 1: DESTINO ================= */}
      {paso >= 1 && (
        <div style={{ marginBottom: "15px", background: paso > 1 ? "rgba(255,255,255,0.02)" : "transparent", padding: "12px", borderRadius: "10px", border: paso > 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold", color: "#f59e0b" }}>🏦 Banco Destino Predeterminado:</span>
            <span style={{ background: "rgba(212, 175, 55, 0.15)", color: "#d4af37", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>BANCO CEESUV</span>
          </div>

          {paso > 1 ? (
            <div style={{ marginTop: "8px", fontSize: "13px", color: "#cbd5e1" }}>
              <strong>Destino:</strong> {tipoDestino === "nuevo" ? destinatarioVerificado?.nombre : contactoSeleccionado?.nombre} 
              ({tipoDestino === "nuevo" ? identificadorDestino : (contactoSeleccionado?.cuenta || contactoSeleccionado?.numero_cuenta || contactoSeleccionado?.tarjeta_debito || contactoSeleccionado?.clabe)})
            </div>
          ) : (
            <form onSubmit={handleContinuarADestino} style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <button type="button" onClick={() => setTipoDestino("nuevo")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: tipoDestino === "nuevo" ? "2px solid #f59e0b" : "1px solid #1e3250", background: tipoDestino === "nuevo" ? "rgba(245, 158, 11, 0.15)" : "transparent", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                  ➕ Cuenta Nueva
                </button>
                <button type="button" onClick={() => setTipoDestino("guardado")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: tipoDestino === "guardado" ? "2px solid #f59e0b" : "1px solid #1e3250", background: tipoDestino === "guardado" ? "rgba(245, 158, 11, 0.15)" : "transparent", color: "white", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                  📖 Contactos Guardados ({contactosGuardados.length})
                </button>
              </div>

              {tipoDestino === "nuevo" ? (
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>NÚMERO DE CUENTA, TARJETA O CLABE:</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Ej. Cuenta, Tarjeta o CLABE"
                      value={identificadorDestino}
                      onChange={(e) => {
                        setIdentificadorDestino(e.target.value);
                        setDestinatarioVerificado(null);
                      }}
                      onBlur={() => buscarDestinatarioBackend(identificadorDestino)}
                      style={{ flex: 1, background: "#0c1527", border: "1px solid #1e3250", color: "white", padding: "10px", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                    />
                    <button 
                      type="button" 
                      onClick={() => buscarDestinatarioBackend(identificadorDestino)}
                      style={{ background: "#1e3250", color: "#f59e0b", border: "1px solid #f59e0b", padding: "0 12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
                    >
                      {buscandoDestinatario ? "Buscando..." : "Buscar"}
                    </button>
                  </div>

                  {/* Nombre Dinámico del Destinatario Encontrado */}
                  {destinatarioVerificado && (
                    <div style={{ marginTop: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", padding: "8px", borderRadius: "6px", fontSize: "12px", color: "#34d399" }}>
                      ✔ Destinatario: <strong>{destinatarioVerificado.nombre}</strong> (Banco CEESUV)
                    </div>
                  )}
                  
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <input 
                      type="checkbox" 
                      id="guardarContacto" 
                      checked={guardarContactoCheck} 
                      onChange={(e) => setGuardarContactoCheck(e.target.checked)} 
                    />
                    <label htmlFor="guardarContacto" style={{ fontSize: "12px", color: "#cbd5e1", cursor: "pointer" }}>Guardar en mis contactos frecuentes</label>
                  </div>

                  {guardarContactoCheck && (
                    <input
                      type="text"
                      placeholder="Alias o nombre del contacto (Ej. Jorge)"
                      value={aliasGuardar}
                      onChange={(e) => setAliasGuardar(e.target.value)}
                      style={{ width: "100%", marginTop: "8px", background: "#0c1527", border: "1px solid #1e3250", color: "white", padding: "8px", borderRadius: "8px", fontSize: "12px", boxSizing: "border-box" }}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>SELECCIONA UN CONTACTO:</label>
                  {contactosGuardados.length > 0 ? (
                    <select
                      onChange={(e) => {
                        const encontrado = contactosGuardados.find(c => String(c.cuenta || c.numero_cuenta || c.tarjeta_debito || c.clabe) === e.target.value);
                        setContactoSeleccionado(encontrado);
                      }}
                      style={{ width: "100%", background: "#0c1527", border: "1px solid #1e3250", color: "white", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
                    >
                      <option value="">-- Selecciona contacto --</option>
                      {contactosGuardados.map((c, idx) => {
                        const valCuenta = c.cuenta || c.numero_cuenta || c.tarjeta_debito || c.clabe;
                        return (
                          <option key={idx} value={valCuenta}>
                            {c.nombre} - {valCuenta}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <p style={{ color: "#94a3b8", fontSize: "12px", margin: "5px 0" }}>No tienes contactos guardados aún.</p>
                  )}

                  {contactoSeleccionado && (
                    <div style={{ marginTop: "8px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", padding: "8px", borderRadius: "6px", fontSize: "12px", color: "#fcd34d" }}>
                      👤 Destinatario: <strong>{contactoSeleccionado.nombre}</strong> <br/>
                      💳 Cuenta/Dato: <strong>{contactoSeleccionado.cuenta || contactoSeleccionado.numero_cuenta || contactoSeleccionado.tarjeta_debito || contactoSeleccionado.clabe}</strong> (Banco CEESUV)
                    </div>
                  )}
                </div>
              )}

              <button type="submit" style={{ width: "100%", marginTop: "15px", background: "#f59e0b", color: "#0c1527", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                Continuar con Transferencia ➡️
              </button>
            </form>
          )}
        </div>
      )}

      {/* ================= PASO 2: MONTO Y CONCEPTO ================= */}
      {paso >= 2 && paso < 4 && (
        <div style={{ marginBottom: "15px", background: paso > 2 ? "rgba(255,255,255,0.02)" : "transparent", padding: "12px", borderRadius: "10px", border: paso > 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold", color: "#f59e0b" }}>💵 Monto y Concepto:</span>
            {paso > 2 && <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "bold" }}>{monto} COINS</span>}
          </div>

          {paso > 2 ? (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "#cbd5e1" }}>
              <strong>Monto:</strong> {monto} COINS | <strong>Concepto:</strong> {concepto || "Sin concepto"}
            </div>
          ) : (
            <form onSubmit={handleContinuarAMonto} style={{ marginTop: "10px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>CANTIDAD A TRANSFERIR (COINS):</label>
                <input
                  type="number"
                  placeholder="Ej. 50"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  min="1"
                  style={{ width: "100%", background: "#0c1527", border: "1px solid #1e3250", color: "white", padding: "10px", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>CONCEPTO O MOTIVO:</label>
                <input
                  type="text"
                  placeholder="Ej. Comida, Tarea, Préstamo..."
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  style={{ width: "100%", background: "#0c1527", border: "1px solid #1e3250", color: "white", padding: "10px", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <button type="submit" style={{ width: "100%", background: "#f59e0b", color: "#0c1527", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}>
                Continuar a PIN de Seguridad ➡️
              </button>
            </form>
          )}
        </div>
      )}

      {/* ================= PASO 3: PIN DE SEGURIDAD ================= */}
      {paso === 3 && (
        <form onSubmit={handleEjecutarTransferencia} style={{ marginTop: "10px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#f59e0b", marginBottom: "4px", fontWeight: "bold" }}>🔒 INGRESA TU PIN DE 4 DÍGITOS PARA AUTORIZAR:</label>
            <input
              type="password"
              maxLength="4"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ width: "100%", background: "#0c1527", border: "1px solid #f59e0b", color: "white", padding: "12px", borderRadius: "8px", fontSize: "18px", textAlign: "center", letterSpacing: "6px", boxSizing: "border-box" }}
            />
          </div>

          <button type="submit" disabled={procesando} style={{ width: "100%", background: "#10b981", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>
            {procesando ? "Procesando transferencia..." : "✅ Confirmar y Enviar Transferencia"}
          </button>
        </form>
      )}

      {/* ================= PASO 4: VOUCHER ================= */}
      {paso === 4 && datosTicket && (
        <div style={{ background: "#ffffff", color: "#1e293b", padding: "20px", borderRadius: "12px", textAlign: "center", fontFamily: "Arial, sans-serif" }}>
          <div style={{ fontSize: "40px", marginBottom: "5px" }}>✅</div>
          <h3 style={{ margin: "0 0 5px 0", color: "#0f172a", fontSize: "18px" }}>¡Transferencia Exitosa!</h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "11px", color: "#64748b" }}>Folio: <strong>{datosTicket.folio}</strong></p>

          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", textAlign: "left", fontSize: "12px", marginBottom: "15px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Fecha:</span> <strong>{datosTicket.fecha}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Origen:</span> <strong>{datosTicket.origen}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Destino:</span> <strong>{datosTicket.destino}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Banco:</span> <strong>{datosTicket.bancoDestino}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}><span>Concepto:</span> <strong>{datosTicket.concepto}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: "5px", marginTop: "5px", fontSize: "14px" }}>
              <span>Monto Enviado:</span> <strong style={{ color: "#10b981" }}>{datosTicket.monto} COINS</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={compartirTicket} style={{ flex: 1, background: "#0f172a", color: "white", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
              📤 Compartir Comprobante
            </button>
            <button onClick={reiniciarFormulario} style={{ flex: 1, background: "#f59e0b", color: "#0c1527", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
              🔄 Nueva Transferencia
            </button>
          </div>
        </div>
      )}

    </div>
  );
}