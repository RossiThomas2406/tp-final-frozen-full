import axios from "axios";

// 🚀 ENLAZADO: Dominio real y productivo de Render
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "https://frozen-backend-d5t3.onrender.com/api/";
const cleanBaseURL = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;

const api = axios.create({
    baseURL: cleanBaseURL,
    timeout: 10000,
});

const LineaProduccionService = {
    // 🛡️ Obtener catálogo de líneas
    obtenerLineas: async () => {
        try {
            console.log("Obteniendo líneas de producción desde Render...");
            const response = await api.get("produccion/lineas/");
            return response.data?.results || (Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error al obtener líneas de producción:", error);
            throw error;
        }
    },

    // 🛡️ Obtener estados de líneas
    obtenerEstados: async () => {
        try {
            const response = await api.get("produccion/estado_linea_produccion/");
            return response.data?.results || (Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error al obtener estados de línea de producción:", error);
            throw error;
        }
    },

    // 🛡️ Crear nueva línea
    crearLinea: async (datos) => {
        try {
            const response = await api.post("produccion/lineas/", datos);
            return response.data;
        } catch (error) {
            console.error("Error al crear línea:", error);
            throw error;
        }
    },

    // 🛡️ Actualizar línea existente
    actualizarLinea: async (id, datos) => {
        try {
            const response = await api.put(`produccion/lineas/${id}/`, datos);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar línea:", error);
            throw error;
        }
    },

    // 🛡️ Eliminar línea física
    eliminarLinea: async (id) => {
        try {
            const response = await api.delete(`produccion/lineas/${id}/`);
            return response.data;
        } catch (error) {
            console.error("Error al eliminar línea:", error);
            throw error;
        }
    },

    // 🛡️ Listar productos asociados a la capacidad de la línea
    obtenerProductosLinea: async (idLinea) => {
        try {
            const response = await api.get(`produccion/lineas-productos/?id_linea_produccion=${idLinea}`);
            return response.data?.results || (Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(`Error al obtener productos de la línea ${idLinea}:`, error);
            return [];
        }
    }
};

export default LineaProduccionService;