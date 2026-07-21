const API_URL = "https://nombre-real-de-tu-app.onrender.com";

export async function obtenerAlumnos() {

    const respuesta = await fetch(`${API}/alumnos`);

    return await respuesta.json();

}

export async function guardarAlumno(alumno) {

    const respuesta = await fetch(`${API}/alumnos`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(alumno)

    });

    return await respuesta.json();

}

export async function editarAlumno(id, alumno){

    const respuesta = await fetch(`${API}/alumnos/${id}`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(alumno)

    });

    return await respuesta.json();

}

export async function eliminarAlumno(id){

    await fetch(`${API}/alumnos/${id}`,{

        method:"DELETE"

    });

}
export async function registrarMovimiento(movimiento){

    const respuesta = await fetch(`${API}/movimientos`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify(movimiento)

    });

    return await respuesta.json();

}
export async function obtenerDashboard(){

    const respuesta = await fetch(`${API}/dashboard`);

    return await respuesta.json();

}

export async function obtenerMovimientos(){

    const respuesta = await fetch(`${API}/movimientos`);

    return await respuesta.json();

}

// =====================================
// USUARIOS
// =====================================

export async function obtenerUsuarios(){

    const respuesta = await fetch(`${API}/usuarios`);

    return await respuesta.json();

}

export async function guardarUsuario(usuario){

    const respuesta = await fetch(`${API}/usuarios`,{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify(usuario)

    });

    return await respuesta.json();

}

export async function editarUsuario(id, usuario){

    const respuesta = await fetch(`${API}/usuarios/${id}`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify(usuario)

    });

    return await respuesta.json();

}

export async function cambiarEstadoUsuario(id, estado){

    const respuesta = await fetch(`${API}/usuarios/${id}/estado`,{

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify({ estado })

    });

    return await respuesta.json();

}

// =====================================
// AUTENTICACIÓN
// =====================================
export async function loginUsuario(credenciales) {
  const respuesta = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credenciales)
  });

  return await respuesta.json();
}

// =====================================
// CONSULTA PÚBLICA QR (PADRES)
// =====================================
export async function consultarPorQR(token) {
  try {
    const respuesta = await fetch(`${API}/consulta/${token}`); // 👈 Cambiado a ${API}
    if (!respuesta.ok) return null;
    return await respuesta.json();
  } catch (error) {
    console.error("Error consultando por QR:", error);
    return null;
  }
}