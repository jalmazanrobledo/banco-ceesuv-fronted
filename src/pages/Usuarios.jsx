import { useEffect, useState } from "react";
import {
  obtenerUsuarios,
  guardarUsuario,
  editarUsuario,
  cambiarEstadoUsuario
} from "../services/api";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    usuario: "",
    password: "",
    rol: "Docente"
  });

  async function cargar() {
    try {
      const datos = await obtenerUsuarios();
      setUsuarios(datos || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregarUsuario() {
    if (
      !nuevoUsuario.nombre ||
      !nuevoUsuario.password
    ) {
      alert("Completa al menos el nombre y la contraseña.");
      return;
    }

    let usernameFinal = nuevoUsuario.usuario;
    if (!usernameFinal) {
      const partes = nuevoUsuario.nombre.trim().toLowerCase().split(/\s+/);
      const pNombre = partes[0] || "user";
      const pApellido = partes[1] || "";
      usernameFinal = pApellido ? `${pNombre}.${pApellido}` : pNombre;
    }

    try {
      await guardarUsuario({
        ...nuevoUsuario,
        usuario: usernameFinal
      });

      setNuevoUsuario({
        nombre: "",
        usuario: "",
        password: "",
        rol: "Docente"
      });

      cargar();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert("No se pudo guardar el usuario. Es posible que el nombre de usuario ya exista.");
    }
  }

  async function editar(u) {
    const nuevoNombre = prompt("Nombre:", u.nombre);
    if (nuevoNombre === null) return;

    const nuevoUsuario = prompt("Usuario:", u.usuario);
    if (nuevoUsuario === null) return;

    const nuevoRol = prompt("Rol (Administrador o Docente):", u.rol);
    if (nuevoRol === null) return;

    try {
      await editarUsuario(u.id, {
        nombre: nuevoNombre,
        usuario: nuevoUsuario,
        rol: nuevoRol
      });
      cargar();
    } catch (error) {
      console.error("Error al editar el usuario:", error);
      alert("No se pudo actualizar el usuario.");
    }
  }

  async function cambiarEstado(u) {
    const estado =
      u.estado === "Activo"
        ? "Inactivo"
        : "Activo";

    await cambiarEstadoUsuario(u.id, estado);

    cargar();
  }

  return (
    <>
      <style>{`
        .usuarios-container {
          display: flex;
          min-height: 100vh;
          background: #F4F7FA;
          flex-direction: row;
        }

        .usuarios-main {
          flex: 1;
          padding: 30px;
          box-sizing: border-box;
          width: 100%;
        }

        .form-card {
          background: white;
          padding: 20px;
          border-radius: 15px;
          margin-top: 30px;
          box-shadow: 0 5px 15px rgba(0,0,0,.15);
        }

        .form-inputs-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .form-input {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          outline: none;
          box-sizing: border-box;
          flex: 1;
          min-width: 150px;
        }

        .btn-submit {
          padding: 10px 20px;
          background: #0B2341;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .table-card {
          margin-top: 30px;
          background: white;
          border-radius: 10px;
          overflow-x: auto;
          box-shadow: 0 5px 15px rgba(0,0,0,.15);
        }

        @media (max-width: 768px) {
          .usuarios-container {
            flex-direction: column;
          }

          .usuarios-main {
            padding: 15px;
          }

          .form-inputs-grid {
            flex-direction: column;
            align-items: stretch;
          }

          .form-input {
            width: 100%;
          }

          .btn-submit {
            width: 100%;
          }
        }
      `}</style>

      <div className="usuarios-container">
        <div className="usuarios-main">
          <h1 style={{ color: "#0B2341", margin: 0 }}>
            👤 Usuarios
          </h1>

          <h3 style={{ color: "#666", marginTop: "5px" }}>
            Administración de usuarios
          </h3>

          <div className="form-card">
            <h3 style={{ marginTop: 0, color: "#0B2341" }}>➕ Nuevo Usuario</h3>

            <div className="form-inputs-grid">
              <input
                placeholder="Nombre"
                value={nuevoUsuario.nombre}
                onChange={e =>
                  setNuevoUsuario({
                    ...nuevoUsuario,
                    nombre: e.target.value
                  })
                }
                className="form-input"
              />

              <input
                placeholder="Usuario"
                value={nuevoUsuario.usuario}
                onChange={e =>
                  setNuevoUsuario({
                    ...nuevoUsuario,
                    usuario: e.target.value
                  })
                }
                className="form-input"
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={nuevoUsuario.password}
                onChange={e =>
                  setNuevoUsuario({
                    ...nuevoUsuario,
                    password: e.target.value
                  })
                }
                className="form-input"
              />

              <select
                value={nuevoUsuario.rol}
                onChange={e =>
                  setNuevoUsuario({
                    ...nuevoUsuario,
                    rol: e.target.value
                  })
                }
                className="form-input"
              >
                <option value="Administrador">Administrador</option>
                <option value="Docente">Docente</option>
              </select>

              <button onClick={agregarUsuario} className="btn-submit">
                Guardar
              </button>
            </div>
          </div>

          <div className="table-card">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#333",
                minWidth: "600px"
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#0B2341",
                    color: "white",
                    textAlign: "left"
                  }}
                >
                  <th style={{ padding: "15px" }}>ID</th>
                  <th style={{ padding: "15px" }}>Nombre</th>
                  <th style={{ padding: "15px" }}>Usuario</th>
                  <th style={{ padding: "15px" }}>Rol</th>
                  <th style={{ padding: "15px" }}>Estado</th>
                  <th style={{ padding: "15px", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "15px" }}>{u.id}</td>
                      <td style={{ padding: "15px", fontWeight: "bold", color: "#0B2341" }}>{u.nombre}</td>
                      <td style={{ padding: "15px" }}>{u.usuario}</td>
                      <td style={{ padding: "15px" }}>{u.rol}</td>
                      <td style={{ padding: "15px" }}>{u.estado}</td>
                      <td style={{ padding: "15px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => editar(u)}
                          style={{
                            padding: "6px 12px",
                            background: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => cambiarEstado(u)}
                          style={{
                            marginLeft: 10,
                            padding: "6px 12px",
                            background: u.estado === "Activo" ? "#dc3545" : "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          {u.estado === "Activo" ? "🔴 Inactivar" : "🟢 Activar"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#777" }}>
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Usuarios;