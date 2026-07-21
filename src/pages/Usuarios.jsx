import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
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
    const datos = await obtenerUsuarios();
    setUsuarios(datos);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function agregarUsuario() {

    if (
      !nuevoUsuario.nombre ||
      !nuevoUsuario.usuario ||
      !nuevoUsuario.password
    ) {
      alert("Completa todos los datos.");
      return;
    }

    await guardarUsuario(nuevoUsuario);

    setNuevoUsuario({
      nombre: "",
      usuario: "",
      password: "",
      rol: "Docente"
    });

    cargar();

  }

  async function editar(u) {

    const nombre = prompt("Nombre:", u.nombre);
    if (nombre === null) return;

    const usuario = prompt("Usuario:", u.usuario);
    if (usuario === null) return;

    const rol = prompt(
      "Rol (Administrador o Docente):",
      u.rol
    );
    if (rol === null) return;

    await editarUsuario(u.id, {
      nombre,
      usuario,
      rol
    });

    cargar();

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

    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F4F7FA"
      }}
    >

      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "30px"
        }}
      >

        <h1 style={{ color: "#0B2341" }}>
          👤 Usuarios
        </h1>

        <h2 style={{ color: "#666" }}>
          Administración de usuarios
        </h2>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "30px",
            boxShadow: "0 5px 15px rgba(0,0,0,.15)"
          }}
        >

          <h3>➕ Nuevo Usuario</h3>

          <input
            placeholder="Nombre"
            value={nuevoUsuario.nombre}
            onChange={e =>
              setNuevoUsuario({
                ...nuevoUsuario,
                nombre: e.target.value
              })
            }
            style={{ padding: 10, marginRight: 10 }}
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
            style={{ padding: 10, marginRight: 10 }}
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
            style={{ padding: 10, marginRight: 10 }}
          />

          <select
            value={nuevoUsuario.rol}
            onChange={e =>
              setNuevoUsuario({
                ...nuevoUsuario,
                rol: e.target.value
              })
            }
            style={{ padding: 10, marginRight: 10 }}
          >

            <option>Administrador</option>
            <option>Docente</option>

          </select>

          <button
            onClick={agregarUsuario}
            style={{
              padding: "10px 20px",
              background: "#0B2341",
              color: "white",
              border: "none",
              borderRadius: "8px"
            }}
          >
            Guardar
          </button>

        </div>

        <table
          style={{
            width: "100%",
            marginTop: "30px",
            background: "white",
            borderCollapse: "collapse",
            boxShadow: "0 5px 15px rgba(0,0,0,.15)"
          }}
        >

          <thead>

            <tr
              style={{
                background: "#0B2341",
                color: "white"
              }}
            >

              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>

            </tr>

          </thead>

          <tbody>

            {usuarios.map(u => (

              <tr key={u.id}>

                <td>{u.id}</td>

                <td>{u.nombre}</td>

                <td>{u.usuario}</td>

                <td>{u.rol}</td>

                <td>{u.estado}</td>

                <td>

                  <button onClick={() => editar(u)}>
                    ✏️
                  </button>

                  <button
                    onClick={() => cambiarEstado(u)}
                    style={{ marginLeft: 10 }}
                  >
                    {u.estado === "Activo"
                      ? "🔴"
                      : "🟢"}
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default Usuarios;