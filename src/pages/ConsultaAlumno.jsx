import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import { consultarPorQR } from "../services/api";



function ConsultaAlumno() {

  const { token } = useParams();

  const [datos, setDatos] = useState(null);

  const [cargando, setCargando] = useState(true);



  useEffect(() => {

    async function obtenerDatos() {

      const resultado = await consultarPorQR(token);

      setDatos(resultado);

      setCargando(false);

    }

    obtenerDatos();

  }, [token]);



  if (cargando) {

    return (

      <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>

        <h2>⏳ Cargando información...</h2>

      </div>

    );

  }



  if (!datos) {

    return (

      <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>

        <h2 style={{ color: "#B22222" }}>❌ Código QR no válido</h2>

        <p>El código escaneado no corresponde a ningún alumno registrado.</p>

      </div>

    );

  }



  const { alumno, movimientos } = datos;



  return (

    <div style={{ minHeight: "100vh", background: "#F4F7FA", padding: "20px", fontFamily: "sans-serif" }}>

      {/* Tarjeta con los datos principales del alumno */}

      <div

        style={{

          background: "#0B2341",

          color: "white",

          padding: "25px 20px",

          borderRadius: "15px",

          textAlign: "center",

          boxShadow: "0 5px 15px rgba(0,0,0,.2)"

        }}

      >

        <h2 style={{ margin: "0 0 5px 0" }}>{alumno.nombre}</h2>

        <p style={{ margin: 0, color: "#D4AF37", fontWeight: "bold" }}>{alumno.grado}</p>



        <div

          style={{

            marginTop: "20px",

            background: "white",

            color: "#0B2341",

            padding: "12px 20px",

            borderRadius: "10px",

            display: "inline-block",

            boxShadow: "0 3px 10px rgba(0,0,0,.1)"

          }}

        >

          <span style={{ fontSize: "22px", fontWeight: "bold" }}>🪙 {alumno.coins} CEESUV Coins</span>

        </div>

      </div>



      {/* Historial de Movimientos */}

      <div

        style={{

          background: "white",

          padding: "20px",

          borderRadius: "15px",

          marginTop: "20px",

          boxShadow: "0 5px 15px rgba(0,0,0,.1)"

        }}

      >

        <h3 style={{ color: "#0B2341", marginTop: 0 }}>📊 Historial de Movimientos</h3>



        {movimientos.length === 0 ? (

          <p style={{ color: "#666" }}>Aún no hay movimientos registrados para este alumno.</p>

        ) : (

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>

            {movimientos.map((m, index) => (

              <li

                key={index}

                style={{

                  padding: "12px 0",

                  borderBottom: index !== movimientos.length - 1 ? "1px solid #eee" : "none",

                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center"

                }}

              >

                <div>

                  <strong style={{ color: m.tipo === "ENTRADA" ? "#228B22" : "#B22222" }}>

                    {m.tipo === "ENTRADA" ? "➕ Obtenidas" : "➖ Descontadas"}

                  </strong>

                  <div style={{ fontSize: "14px", color: "#555", marginTop: "2px" }}>{m.motivo}</div>

                </div>

                <div

                  style={{

                    fontSize: "18px",

                    fontWeight: "bold",

                    color: m.tipo === "ENTRADA" ? "#228B22" : "#B22222"

                  }}

                >

                  {m.tipo === "ENTRADA" ? `+${m.cantidad}` : `-${m.cantidad}`}

                </div>

              </li>

            ))}

          </ul>

        )}

      </div>

    </div>

  );

}



export default ConsultaAlumno; 