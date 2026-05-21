import axios from "axios";

// 🚀 ENLAZADO: Tu host real de Render. Chau llamadas caídas a Railway.
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://frozen-backend-d5t3.onrender.com/api/";

const cleanBaseURL = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

const api = axios.create({
    baseURL: cleanBaseURL,
    timeout: 10000,
});

// Función auxiliar para reescribir dinámicamente URLs viejas que mande el paginador del backend
const sanitizarUrlRender = (urlUrl) => {
    if (!urlUrl) return null;
    if (urlUrl.includes("frozenback-test.up.railway.app")) {
        return urlUrl.replace("https://frozenback-test.up.railway.app/api/", cleanBaseURL);
    }
    return urlUrl;
};

class LotesMateriaPrimaService {
    
    // 🛡️ Obtener lotes por Materia Prima específica
    static async obtenerLotesPorMateriaPrima(id_materia_prima) {
        try {
            const url = `${cleanBaseURL}stock/lotes-materias/por-materia/${id_materia_prima}/`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error en obtenerLotesPorMateriaPrima:", error);
            throw error;
        }
    }

    // 🛡️ Obtener lotes generales con Query Parameters dinámicos (Usando Axios)
    static async obtenerLotesMateriaPrima(pagina = 1, queryParams = {}) {
        try {
            const params = new URLSearchParams();
            params.append('page', pagina.toString());
            
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
                    params.append(key, queryParams[key].toString());
                }
            });
            
            // Se remueve la barra inicial para que Axios concatene de forma nativa con la baseURL
            const response = await api.get(`stock/lotes-materias/?${params.toString()}`);
            return response.data || { results: [], count: 0 };
        } catch (error) {
            console.error("Error obteniendo lotes de materia prima:", error);
            throw error;
        }
    }

    // 🛡️ Obtener catálogo de estados de lotes
    static async obtenerEstadosLotes() {
        try {
            const url = `${cleanBaseURL}stock/estado-lotes-materias/`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data?.results || data || [];
        } catch (error) {
            console.error("Error en obtenerEstadosLotes:", error);
            throw error;
        }
    }

    // 🛡️ Adaptador DTO elástico para mapear propiedades del Backend
    static transformarLoteDTO(loteBackend, estados) {
        if (!loteBackend) return {};
        const listaEstados = Array.isArray(estados) ? estados : (estados?.results || []);
        
        const estadoObj = listaEstados.find(
            (e) => e?.id_estado_lote_materia_prima === loteBackend.id_estado_lote_materia_prima
        );

        return {
            id_lote_materia_prima: loteBackend.id_lote_materia_prima,
            fecha_vencimiento: loteBackend.fecha_vencimiento,
            textura: loteBackend.textura,
            cantidad: loteBackend.cantidad,
            id_materia_prima: loteBackend.id_materia_prima,
            estado: estadoObj ? estadoObj.descripcion : "Disponible",
            estado_id: loteBackend.id_estado_lote_materia_prima,
        };
    }

    // 🛡️ Bucle recursivo con sanitizador dinámico para succionar todas las páginas del catálogo
    static async obtenerMateriasPrimas() {
        try {
            let allMateriasPrimas = [];
            let nextPage = `${cleanBaseURL}materias_primas/materias/`;
            
            while (nextPage) {
                // Forzamos que la URL del bucle apunte a Render
                const urlSegura = sanitizarUrlRender(nextPage);
                const response = await fetch(urlSegura);
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                
                if (data.results && Array.isArray(data.results)) {
                    allMateriasPrimas = allMateriasPrimas.concat(data.results);
                } else if (Array.isArray(data)) {
                    allMateriasPrimas = allMateriasPrimas.concat(data);
                }
                
                // Sanitizamos el puntero de la página siguiente por si Django responde con el host viejo
                nextPage = data.next ? sanitizarUrlRender(data.next) : null;
            }
            
            return allMateriasPrimas;
        } catch (error) {
            console.error("Error obteniendo materias primas:", error);
            return []; // Fallback defensivo anti-crash
        }
    }
}

export { LotesMateriaPrimaService };