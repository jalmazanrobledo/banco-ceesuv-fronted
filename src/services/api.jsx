const API_URL = import.meta.env.VITE_API_URL || "https://banco-ceesuv-backend.onrender.com";[cite: 8]

// Configuración base para evitar caché e incluir credenciales de sesión (CORS)
const fetchOptionsNoCache = {
    headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",[cite: 8]
        "Pragma": "no-cache",[cite: 8]
        "Expires": "0"[cite: 8]
    },
    credentials: "include"
};

// =====================================
// ALUMNOS
// =====================================
export async function obtenerAlumnos() {
    const timestamp = new Date().getTime();[cite: 8]
    const respuesta = await fetch(`${API_URL}/alumnos?_t=${timestamp}`, fetchOptionsNoCache);[cite: 8]
    return await respuesta.json();[cite: 8]
}

export async function guardarAlumno(alumno) {
    const respuesta = await fetch(`${API_URL}/alumnos`, {
        method: "POST",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify(alumno)[cite: 8]
    });
    return await respuesta.json();[cite: 8]
}

export async function editarAlumno(id, alumno) {
    const respuesta = await fetch(`${API_URL}/alumnos/${id}`, {
        method: "PUT",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify(alumno)[cite: 8]
    });

    const data = await respuesta.json();[cite: 8]

    if (!respuesta.ok) {[cite: 8]
        throw new Error(data.mensaje || "Error al actualizar el alumno");[cite: 8]
    }

    return data;[cite: 8]
}

export async function eliminarAlumno(id) {
    await fetch(`${API_URL}/alumnos/${id}`, {
        method: "DELETE",[cite: 8]
        ...fetchOptionsNoCache
    });
}

// =====================================
// MOVIMIENTOS
// =====================================
export async function registrarMovimiento(movimiento) {
    const respuesta = await fetch(`${API_URL}/movimientos`, {
        method: "POST",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify(movimiento)[cite: 8]
    });

    const data = await respuesta.json();[cite: 8]

    if (!respuesta.ok) {[cite: 8]
        throw new Error(data.mensaje || "Error al procesar el movimiento");[cite: 8]
    }

    return data;[cite: 8]
}

export async function obtenerMovimientos() {
    const timestamp = new Date().getTime();[cite: 8]
    const respuesta = await fetch(`${API_URL}/movimientos?_t=${timestamp}`, fetchOptionsNoCache);[cite: 8]
    return await respuesta.json();[cite: 8]
}

// =====================================
// DASHBOARD
// =====================================
export async function obtenerDashboard() {
    const timestamp = new Date().getTime();[cite: 8]
    const respuesta = await fetch(`${API_URL}/dashboard?_t=${timestamp}`, fetchOptionsNoCache);[cite: 8]
    return await respuesta.json();[cite: 8]
}

// =====================================
// USUARIOS
// =====================================
export async function obtenerUsuarios() {
    const timestamp = new Date().getTime();[cite: 8]
    const respuesta = await fetch(`${API_URL}/usuarios?_t=${timestamp}`, fetchOptionsNoCache);[cite: 8]
    return await respuesta.json();[cite: 8]
}

export async function guardarUsuario(usuario) {
    const respuesta = await fetch(`${API_URL}/usuarios`, {
        method: "POST",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify(usuario)[cite: 8]
    });
    return await respuesta.json();[cite: 8]
}

export async function editarUsuario(id, usuario) {
    const respuesta = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "PUT",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify(usuario)[cite: 8]
    });
    return await respuesta.json();[cite: 8]
}

export async function cambiarEstadoUsuario(id, estado) {
    const respuesta = await fetch(`${API_URL}/usuarios/${id}/estado`, {
        method: "PUT",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify({ estado })[cite: 8]
    });
    return await respuesta.json();[cite: 8]
}

// =====================================
// LOGIN
// =====================================
export const loginUsuario = async (credenciales) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",[cite: 8]
        headers: {
            "Content-Type": "application/json",[cite: 8]
            ...fetchOptionsNoCache.headers
        },
        credentials: "include",
        body: JSON.stringify(credenciales),[cite: 8]
    });

    if (!response.ok) {[cite: 8]
        const errorData = await response.json();[cite: 8]
        throw new Error(errorData.mensaje || "Error al iniciar sesión");[cite: 8]
    }

    return await response.json();[cite: 8]
};

// =====================================
// CONSULTA PÚBLICA QR (PADRES)
// =====================================
export async function consultarPorQR(token) {
    try {
        const timestamp = new Date().getTime();[cite: 8]
        const respuesta = await fetch(`${API_URL}/consulta/${token}?_t=${timestamp}`, fetchOptionsNoCache);[cite: 8]
        if (!respuesta.ok) return null;[cite: 8]
        return await respuesta.json();[cite: 8]
    } catch (error) {
        console.error("Error consultando por QR:", error);[cite: 8]
        return null;[cite: 8]
    }
}