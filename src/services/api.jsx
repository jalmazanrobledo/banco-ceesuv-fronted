const API_URL = "https://banco-ceesuv-backend.onrender.com"; // Asegúrate de colocar tu URL real de Render

// =====================================
// ALUMNOS
// =====================================
export async function obtenerAlumnos() {
    const respuesta = await fetch(`${API_URL}/alumnos`);
    return await respuesta.json();
}

export async function guardarAlumno(alumno) {
    const respuesta = await fetch(`${API_URL}/alumnos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(alumno)
    });
    return await respuesta.json();
}

export async function editarAlumno(id, alumno) {
    const respuesta = await fetch(`${API_URL}/alumnos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(alumno)
    });
    return await respuesta.json();
}

export async function eliminarAlumno(id) {
    await fetch(`${API_URL}/alumnos/${id}`, {
        method: "DELETE"
    });
}

// =====================================
// MOVIMIENTOS
// =====================================
export async function registrarMovimiento(movimiento) {
    const respuesta = await fetch(`${API_URL}/movimientos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(movimiento)
    });
    return await respuesta.json();
}

export async function obtenerMovimientos() {
    const respuesta = await fetch(`${API_URL}/movimientos`);
    return await respuesta.json();
}

// =====================================
// DASHBOARD
// =====================================
export async function obtenerDashboard() {
    const respuesta = await fetch(`${API_URL}/dashboard`);
    return await respuesta.json();
}

// =====================================
// USUARIOS
// =====================================
export async function obtenerUsuarios() {
    const respuesta = await fetch(`${API_URL}/usuarios`);
    return await respuesta.json();
}

export async function guardarUsuario(usuario) {
    const respuesta = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(usuario)
    });
    return await respuesta.json();
}

export async function editarUsuario(id, usuario) {
    const respuesta = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(usuario)
    });
    return await respuesta.json();
}

export async function cambiarEstadoUsuario(id, estado) {
    const respuesta = await fetch(`${API_URL}/usuarios/${id}/estado`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ estado })
    });
    return await respuesta.json();
}

// =====================================
// LOGIN
// =====================================
export const loginUsuario = async (usuario, password) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || "Error al iniciar sesión");
    }

    return await response.json();
};

// =====================================
// CONSULTA PÚBLICA QR (PADRES)
// =====================================
export async function consultarPorQR(token) {
    try {
        const respuesta = await fetch(`${API_URL}/consulta/${token}`);
        if (!respuesta.ok) return null;
        return await respuesta.json();
    } catch (error) {
        console.error("Error consultando por QR:", error);
        return null;
    }
}