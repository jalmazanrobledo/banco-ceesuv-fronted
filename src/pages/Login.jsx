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

    if (!credenciales.usuario || !credenciales.password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }

    const res = await loginUsuario(credenciales);

    if (res.mensaje) {
      setError(res.mensaje);
    } else {
      // Guardamos la sesión en localStorage
      localStorage.setItem("usuarioCEESUV", JSON.stringify(res));
      navigate("/dashboard");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B2341"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 10px 25px rgba(0,0,0,.3)",
          width: "350px",
          textAlign: "center"
        }}
      >
        <h2 style={{ color: "#0B2341", marginBottom: "10px" }}>
          🏦 Banco Escolar
        </h2>
        <h4 style={{ color: "#666", marginTop: 0, marginBottom: "25px" }}>
          CEESUV
        </h4>

        {error && (
          <div
            style={{
              background: "#FFD2D2",
              color: "#D8000C",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "14px"
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "15px", textAlign: "left" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", color: "#333" }}>
            Usuario:
          </label>
          <input
            type="text"
            value={credenciales.usuario}
            onChange={(e) =>
              setCredenciales({ ...credenciales, usuario: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "8px",
              border: "1px solid #CCC",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px", textAlign: "left" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", color: "#333" }}>
            Contraseña:
          </label>
          <input
            type="password"
            value={credenciales.password}
            onChange={(e) =>
              setCredenciales({ ...credenciales, password: e.target.value })
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "5px",
              borderRadius: "8px",
              border: "1px solid #CCC",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#0B2341",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}

export default Login;