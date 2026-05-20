import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: baseURL,
});

class OrdenCompraService {
    static async obtenerOrdenesCompra(page = 1) {
        try {
            // 🛡️ CORREGIDO: Usar la instancia unificada 'api' en vez de fetch con URL fija
            const response = await api.get(`/compras/ordenes-compra/?page=${page}`);
            const data = response.data;

            const [proveedores, estados] = await Promise.all([
                this.obtenerProveedores(),
                this.obtenerEstadosCompra(),
            ]);

            // Blindaje de paginación
            const listaOriginal = data?.results || (Array.isArray(data) ? data : []);

            const ordenesTransformadas = listaOriginal.map((orden) =>
                this.transformarOrdenCompraDTO(orden, proveedores, estados)
            );

            console.log(ordenesTransformadas);

            return {
                ordenes: ordenesTransformadas,
                paginacion: {
                    count: data?.count || listaOriginal.length,
                    next: data?.next || null,
                    previous: data?.previous || null,
                },
            };
        } catch (error) {
            console.error("Error en obtenerOrdenesCompra:", error);
            throw error;
        }
    }

    static async obtenerProveedores() {
        try {
            // 🛡️ CORREGIDO: Apuntar a la ruta unificada relativa
            const response = await api.get("/materias_primas/proveedores/");
            const data = response.data;
            return data?.results || (Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error obteniendo proveedores:", error);
            return [];
        }
    }

    static async obtenerEstadosCompra() {
        try {
            // 🛡️ CORREGIDO: Apuntar a la ruta unificada relativa
            const response = await api.get("/compras/estados/");
            const data = response.data;
            return data?.results || (Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error obteniendo estados:", error);
            return [];
        }
    }

    static transformarOrdenCompraDTO(ordenBackend, proveedores, estados) {
        const proveedor = (proveedores || []).find(
            (p) => p.id_proveedor === ordenBackend.id_proveedor
        );

        const estadoObj = (estados || []).find(
            (e) => e.id_estado_orden_compra === ordenBackend.id_estado_orden_compra
        );

        return {
            id_orden_compra: ordenBackend.id_orden_compra,
            numero_orden: `OC-${(ordenBackend.id_orden_compra || 0)
                .toString()
                .padStart(4, "0")}`,
            materias_primas: ordenBackend.materias_primas || [],
            fecha_solicitud: ordenBackend.fecha_solicitud,
            fecha_entrega_estimada: ordenBackend.fecha_entrega_estimada,
            fecha_entrega_real: ordenBackend.fecha_entrega_real,
            estado: estadoObj ? estadoObj.descripcion : "En proceso",
            estado_id: ordenBackend.id_estado_orden_compra,
            proveedor: proveedor || { nombre: "Frigorífico Central S.A." },
        };
    }

    static async obtenerOrdenCompraPorId(id) {
        try {
            // 🛡️ CORREGIDO: Cambiado a llamada api unificada
            const response = await api.get(`/compras/ordenes-compra/${id}/`);
            const data = response.data;

            const [proveedores, estados] = await Promise.all([
                this.obtenerProveedores(),
                this.obtenerEstadosCompra(),
            ]);

            return this.transformarOrdenCompraDTO(data, proveedores, estados);
        } catch (error) {
            console.error("Error en obtenerOrdenCompraPorId:", error);
            throw error;
        }
    }
}

export { OrdenCompraService };