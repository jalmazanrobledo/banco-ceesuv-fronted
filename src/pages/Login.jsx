import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../services/api";

function Login() {
  const [credenciales, setCredenciales] = useState({
    usuario: "",
    password: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validación flexible
    if (!credenciales.usuario && !credenciales.password) {
      setError("Ingresa tu usuario y contraseña, o tu PIN de alumno.");
      return;
    }

    try {
      const res = await loginUsuario(credenciales);

      if (res.mensaje && !res.rol && !res.nombre) {
        setError(res.mensaje);
      } else {
        // Guardado temporal que se borra al cerrar la pestaña (Ideal para equipos compartidos)
        sessionStorage.setItem("sesion_activa_ceesuv", JSON.stringify(res));

        const rolUsuario = String(res.rol || res.role || "").toLowerCase();

        // Navegación limpia sin perder el contexto de React
        navigate(rolUsuario === "alumno" || rolUsuario === "student" ? "/mi-cuenta" : "/dashboard", { replace: true });
        window.location.reload(); 
      }
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor.");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0B2341 0%, #1A365D 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "40px 35px",
          borderRadius: "16px",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.4)",
          width: "380px",
          maxWidth: "100%",
          textAlign: "center"
        }}
      >
        {/* LOGO DE LA ESCUELA */}
        <div style={{ marginBottom: "15px" }}>
          <img
            src="/logo-ceesuv.png"
            alt="Logo CEESUV"
            style={{
              width: "90px",
              height: "90px",
              objectFit: "contain",
              margin: "0 auto",
              display: "block"
            }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        {/* NOMBRE DE LA ESCUELA Y TITULO */}
        <h3
          style={{
            color: "#0B2341",
            margin: "0 0 4px 0",
            fontSize: "18px",
            fontWeight: "800",
            letterSpacing: "0.5px"
          }}
        >
          CEESUV
        </h3>
        
        <h2
          style={{
            color: "#D4AF37",
            margin: "0 0 6px 0",
            fontSize: "22px",
            fontWeight: "bold"
          }}
        >
          🏦 Banco Escolar
        </h2>

        {/* ESLOGAN INSTITUCIONAL */}
        <p
          style={{
            color: "#666",
            fontSize: "12px",
            marginTop: 0,
            marginBottom: "25px",
            fontStyle: "italic",
            lineHeight: "1.4"
          }}
        >
          EDUCACIÓN HUMANISTA BASADA EN VALORES
        </p>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div
            style={{
              background: "#FFD2D2",
              color: "#D8000C",
              padding: "10px 12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              fontWeight: "600",
              textAlign: "left",
              borderLeft: "4px solid #D8000C"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* CAMPOS DEL FORMULARIO */}
        <div style={{ marginBottom: "18px", textAlign: "left" }}>
          <label
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#0B2341",
              display: "block",
              marginBottom: "6px"
            }}
          >
            Usuario (Opcional si usas PIN):
          </label>
          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Ej. juan.almazan o admin"
            value={credenciales.usuario}
            onChange={(e) =>
              setCredenciales({ ...credenciales, usuario: e.target.value })
            }
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #CCC",
              boxSizing: "border-box",
              fontSize: "14px",
              outline: "none",
              transition: "border 0.2s"
            }}
          />
        </div>

        <div style={{ marginBottom: "25px", textAlign: "left" }}>
          <label
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#0B2341",
              display: "block",
              marginBottom: "6px"
            }}
          >
            Contraseña / PIN de Alumno:
          </label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="•••••••• o PIN (4 dígitos)"
            value={credenciales.password}
            onChange={(e) =>
              setCredenciales({ ...credenciales, password: e.target.value })
            }
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "8px",
              border: "1px solid #CCC",
              boxSizing: "border-box",
              fontSize: "14px",
              outline: "none",
              transition: "border 0.2s"
            }}
          />
        </div>

        {/* BOTÓN DE INGRESO */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "13px",
            background: "#0B2341",
            color: "#D4AF37",
            border: "2px solid #D4AF37",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(11, 35, 65, 0.25)",
            transition: "all 0.2s ease-in-out"
          }}
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}

export default Login;