const API_URL = "https://banco-ceesuv-backend.onrender.com";

// Función auxiliar para evitar caché en peticiones GET
const getHeadersNoCache = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
};

// =====================================
// ALUMNOS
// =====================================
export async function obtenerAlumnos() {
    // Añadimos un timestamp (?_t=...) para que la URL sea única y el navegador no guarde caché
    const timestamp = new Date().getTime();
    const respuesta = await fetch(`${API_URL}/alumnos?_t=${timestamp}`, {
        headers: getHeadersNoCache
    });
    return await respuesta.json();
}

export async function guardarAlumno(alumno) {
    const respuesta = await fetch(`${API_URL}/alumnos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify(alumno)
    });
    return await respuesta.json();
}

export async function editarAlumno(id, alumno) {
    const respuesta = await fetch(`${API_URL}/alumnos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify(alumno)
    });
    return await respuesta.json();
}

export async function eliminarAlumno(id) {
    await fetch(`${API_URL}/alumnos/${id}`, {
        method: "DELETE",
        headers: getHeadersNoCache
    });
}

// =====================================
// MOVIMIENTOS
// =====================================
export async function registrarMovimiento(movimiento) {
    const respuesta = await fetch(`${API_URL}/movimientos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify(movimiento)
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(data.mensaje || "Error al procesar el movimiento");
    }

    return data;
}

export async function obtenerMovimientos() {
    const timestamp = new Date().getTime();
    const respuesta = await fetch(`${API_URL}/movimientos?_t=${timestamp}`, {
        headers: getHeadersNoCache
    });
    return await respuesta.json();
}

// =====================================
// DASHBOARD
// =====================================
export async function obtenerDashboard() {
    const timestamp = new Date().getTime();
    const respuesta = await fetch(`${API_URL}/dashboard?_t=${timestamp}`, {
        headers: getHeadersNoCache
    });
    return await respuesta.json();
}

// =====================================
// USUARIOS
// =====================================
export async function obtenerUsuarios() {
    const timestamp = new Date().getTime();
    const respuesta = await fetch(`${API_URL}/usuarios?_t=${timestamp}`, {
        headers: getHeadersNoCache
    });
    return await respuesta.json();
}

export async function guardarUsuario(usuario) {
    const respuesta = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify(usuario)
    });
    return await respuesta.json();
}

export async function editarUsuario(id, usuario) {
    const respuesta = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify(usuario)
    });
    return await respuesta.json();
}

export async function cambiarEstadoUsuario(id, estado) {
    const respuesta = await fetch(`${API_URL}/usuarios/${id}/estado`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify({ estado })
    });
    return await respuesta.json();
}

// =====================================
// LOGIN
// =====================================
export const loginUsuario = async (credenciales) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getHeadersNoCache
        },
        body: JSON.stringify(credenciales),
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
        const timestamp = new Date().getTime();
        const respuesta = await fetch(`${API_URL}/consulta/${token}?_t=${timestamp}`, {
            headers: getHeadersNoCache
        });
        if (!respuesta.ok) return null;
        return await respuesta.json();
    } catch (error) {
        console.error("Error consultando por QR:", error);
        return null;
    }
}