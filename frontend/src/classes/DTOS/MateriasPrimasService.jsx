import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: baseURL,
});

class MateriasPrimasService {
    static async obtenerMateriasPrimas() {
        try {
            // 🛡️ CORREGIDO: Apuntar al endpoint real del backend de materias primas
            const response = await api.get("/materias_primas/materias/");

            // Extraer la lista sin importar si viene paginada (.results) o directa
            const listaOriginal = response.data?.results || (Array.isArray(response.data) ? response.data : []);

            // 🛡️ Mapear y normalizar propiedades para que la interfaz consuma con seguridad
            return listaOriginal.map(mp => ({
                id_materia_prima: mp.id_materia_prima,
                nombre: mp.nombre || "Materia Prima sin nombre",
                descripcion: mp.descripcion || "",
                umbral_minimo: mp.umbral_minimo || 0,
                // Si el backend no tiene lotes de stock, aseguramos 0 en vez de undefined/null
                cantidad_disponible: mp.cantidad_disponible ?? mp.stock_actual ?? 0,
                unidad_medida: mp.id_unidad?.descripcion || mp.unidad_medida || "Kg",
                tipo_descripcion: mp.id_tipo_materia_prima?.descripcion || ""
            }));

        } catch (error) {
            console.error("Error en obtenerMateriasPrimas:", error);
            return []; // Retornamos un array vacío de fallback para evitar que colapse el .sort() del componente
        }
    }

    static async agregarMateriaPrima(materiaPrimaId, cantidad) {
        try {
            const response = await api.post("/stock/materias_primas/agregar/", {
                id_materia_prima: materiaPrimaId,
                cantidad: cantidad,
            });
            return response.data;
        } catch (error) {
            console.error("Error en agregarMateriaPrima:", error);
            throw new Error("No se pudo agregar la materia prima");
        }
    }

    static async quitarMateriaPrima(materiaPrimaId, cantidad) {
        try {
            const response = await api.post("/stock/materias_primas/restar/", {
                id_materia_prima: materiaPrimaId,
                cantidad: cantidad,
            });
            return response.data;
        } catch (error) {
            console.error("Error en quitarMateriaPrima:", error);
            throw new Error("No se pudo quitar la materia prima");
        }
    }
}

export default MateriasPrimasService;