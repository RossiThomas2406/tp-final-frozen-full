import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: baseURL,
});

class OrdenProduccionService {
  static transformarOrdenDTO(datosBackend) {
    if (!datosBackend) return null;
    return {
      id: datosBackend.id_orden_produccion,
      id_orden_venta: datosBackend.id_orden_venta || null,
      
      estado: datosBackend.id_estado_orden_produccion?.descripcion || "Sin estado",
      id_estado: datosBackend.id_estado_orden_produccion?.id_estado_orden_produccion || null,

      cantidad: datosBackend.cantidad || 0,

      producto: datosBackend.id_producto?.nombre || "Sin producto",
      id_producto: datosBackend.id_producto?.id_producto || null,
      producto_descripcion: datosBackend.id_producto?.descripcion || "Sin descripción",

      fecha_creacion: datosBackend.fecha_creacion || "Sin fecha",
      fecha_inicio: datosBackend.fecha_inicio || "Sin fecha",
      fecha_planificada: datosBackend.fecha_planificada || null,

      operario: `${datosBackend.id_operario?.nombre || "Sin nombre"} ${
        datosBackend.id_operario?.apellido || "Sin apellido"
      }`,
      id_operario: datosBackend.id_operario?.id_operario || null,
      supervisor: `${datosBackend.id_supervisor?.nombre || "Sin nombre"} ${
        datosBackend.id_supervisor?.apellido || "Sin apellido"
      }`,

      id_lote_produccion: datosBackend.id_lote_produccion?.id_lote_produccion || null,
      estado_orden_descripcion: datosBackend.id_estado_orden_produccion?.descripcion || "Sin estado",
    };
  }

  static async obtenerOrdenesPaginated(page = 1, filtros = {}) {
    try {
      let url = `/produccion/ordenes/?page=${page}`;

      const params = new URLSearchParams();
      if (filtros.producto) params.append("producto", filtros.producto);
      if (filtros.estado) params.append("estado", filtros.estado);
      if (filtros.operario) params.append("operario", filtros.operario);

      const queryString = params.toString();
      if (queryString) {
        url += `&${queryString}`;
      }

      const response = await api.get(url);
      const datosPagina = response.data;

      // 🛡️ Blindaje anti-crash: Extrae la lista real de registros
      const listaOriginal = datosPagina?.results || (Array.isArray(datosPagina) ? datosPagina : []);
      
      const ordenesTransformadas = listaOriginal
        .map((ordenCompleja) => this.transformarOrdenDTO(ordenCompleja))
        .filter(Boolean);

      return {
        ordenes: ordenesTransformadas,
        paginacion: {
          count: datosPagina?.count || listaOriginal.length,
          next: datosPagina?.next || null,
          previous: datosPagina?.previous || null,
        },
      };
    } catch (error) {
      console.error("Error en obtenerOrdenesPaginated:", error);
      throw new Error("No se pudieron cargar las órdenes de producción");
    }
  }

  static normalizarEstado(estado) {
    const map = {
      "Pendiente de inicio": "en espera",
      "En espera": "en espera",
      "En proceso": "en proceso",
      "En progreso": "en proceso",
      Finalizado: "finalizado",
      Completado: "finalizado",
      Cancelado: "cancelado",
    };
    return map[estado] || estado;
  }

  static async obtenerOrdenes() {
    try {
      const response = await api.get("/produccion/ordenes/");
      const datosPagina = response.data;
      
      const listaOriginal = datosPagina?.results || (Array.isArray(datosPagina) ? datosPagina : []);

      const ordenesTransformadas = listaOriginal
        .map((ordenCompleja) => this.transformarOrdenDTO(ordenCompleja))
        .filter(Boolean);

      return {
        ordenes: ordenesTransformadas,
        paginacion: {
          count: datosPagina?.count || listaOriginal.length,
          next: datosPagina?.next || null,
          previous: datosPagina?.previous || null,
        },
      };
    } catch (error) {
      console.error("Error en obtenerOrdenes:", error);
      throw new Error("No se pudieron cargar las órdenes de producción");
    }
  }

  static async obtenerTodasLasOrdenes(filtros = {}, queryParam = "") {
    let url = `/produccion/ordenes/${queryParam}`;
    const params = new URLSearchParams();
    if (filtros.producto && filtros.producto !== "todos") params.append("producto", filtros.producto);
    if (filtros.estado && filtros.estado !== "todos") params.append("estado", filtros.estado);
    if (filtros.operario && filtros.operario !== "todos") params.append("operario", filtros.operario);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    try {
      const response = await api.get(url);
      const datosPagina = response.data;

      const listaOriginal = datosPagina?.results || (Array.isArray(datosPagina) ? datosPagina : []);

      const ordenesPagina = listaOriginal
        .map((ordenCompleja) => this.transformarOrdenDTO(ordenCompleja))
        .filter(Boolean);

      return { url: datosPagina?.next || null, todasLasOrdenes: ordenesPagina };
    } catch (error) {
      console.error("Error en obtenerTodasLasOrdenes:", error);
      throw new Error("No se pudieron cargar todas las órdenes");
    }
  }

  static async obtenerEstados() {
    try {
      const response = await api.get("/produccion/estados/");
      const datos = response.data;

      // 🛡️ Blindaje anti-crash
      const listaOriginal = datos?.results || (Array.isArray(datos) ? datos : []);

      const estadosTransformados = listaOriginal.map((estado) => ({
        id: estado.id_estado_orden_produccion,
        nombre: estado.descripcion,
      }));

      return this.ordenarEstadosProduccion(estadosTransformados);
    } catch (error) {
      console.error("Error en obtenerEstados:", error);
      return []; // Fallback seguro para que no rompa Promise.all
    }
  }

  static ordenarEstadosProduccion(datos) {
    if (!Array.isArray(datos)) return [];
    const mapaDeOrden = [3, 4, 2, 1, 5];
    return datos
      .map((item, index) => ({
        ...item,
        orden: mapaDeOrden[index] || 99,
      }))
      .sort((a, b) => a.orden - b.orden);
  }

  static async obtenerOperarios() {
    try {
      const response = await api.get("/empleados/empleados-filter/?rol=1");
      const datos = response.data;

      // 🛡️ Blindaje anti-crash
      const listaOriginal = datos?.results || (Array.isArray(datos) ? datos : []);

      return listaOriginal.map((operario) => ({
        id: operario.id_empleado,
        nombre: `${operario.nombre || ""} ${operario.apellido || ""}`.trim(),
      }));
    } catch (error) {
      console.error("Error en obtenerOperarios:", error);
      return []; // Fallback seguro para que no rompa Promise.all
    }
  }

  static async obtenerProductos() {
    try {
      const response = await api.get("/productos/listar/");
      const datos = response.data;
      
      // 🛡️ Blindaje anti-crash
      return datos?.results || (Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error en obtenerProductos:", error);
      return []; // Fallback seguro
    }
  }
}

export default OrdenProduccionService;