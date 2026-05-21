import { useState, useEffect } from 'react'
import axios from 'axios';
import styles from './MenuPrincipal.module.css'
import { useNavigate } from 'react-router-dom';

// Importamos los íconos que usaremos
import {
    FaIndustry,
    FaShoppingCart,
    FaBoxes,
    FaWarehouse,
    FaTruck,
    FaBarcode,
    FaUserPlus,
    FaQuestionCircle,
    FaSearch,
    FaTruckLoading,
    FaCog,
    FaChartBar,
    FaCalendarWeek,
    FaCalendarAlt, 
} from 'react-icons/fa';

import { BiCalendarCheck } from "react-icons/bi";
import { HiAdjustments } from "react-icons/hi";

// 🚀 Host unificado y fijo de Render para producción real
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "https://frozen-backend-d5t3.onrender.com/api/"; 
const cleanBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const api = axios.create({
  baseURL: cleanBaseURL,
});

// Componente para ícono combinado
const CalendarProductionIcon = () => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <FaCalendarAlt />
    <FaIndustry style={{ 
      fontSize: '0.5em', 
      position: 'absolute', 
      top: '10px', 
      right: '-3px',
      background: 'white',
      borderRadius: '50%',
      padding: '1px'
    }} />
  </div>
);

// 🛡️ RECONFIGURADO: Ahora mapeamos por DESCRIPCIÓN (que es única por cada tarjeta)
const iconMap = {
  "gestion de ordenes de venta": <FaShoppingCart />,
  "crear orden de venta": <FaShoppingCart />,
  "crear orden produccion": <FaIndustry />,
  "crear orden de compra": <FaTruck />,
  "ver ordenes produccion": <FaIndustry />,
  "stock productos": <FaBoxes />,
  "lotes productos": <FaBarcode />,
  "stock materias primas": <FaWarehouse />,
  "ver ordenes de compra": <FaTruck />,
  "lineas de produccion": <HiAdjustments />,
  "gestion de ordenes de despacho": <FaTruckLoading />,
  "ordenes de trabajo": <BiCalendarCheck />,
  "trazabilidad de orden de venta": <FaSearch />,
  "dashboard analitico": <FaChartBar />,
  "planificacion semanal": <FaCalendarWeek />,
  "lotes materias primas": <FaBarcode />,
  "metricas y configuracion": <FaCog />,
  "ejecutar planificacion mrp": <FaCalendarWeek />,
  "registrar nuevo empleado": <FaUserPlus />,
  "calendario produccion": <CalendarProductionIcon />,
};

const DefaultIcon = <FaQuestionCircle />;

function MenuPrincipal() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const usuarioData = localStorage.getItem('usuario');
        if (!usuarioData) {
          throw new Error("No hay sesión activa");
        }
        
        const parsedData = JSON.parse(usuarioData);
        const rolUsuario = parsedData.rol;
        
        const response = await api.get(`empleados/permisos-rol/${encodeURIComponent(rolUsuario)}/`);
        
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          throw new Error("Respuesta inválida del servidor");
        }

        const opcionesMenu = response.data?.permisos || response.data || [];
        
        if (opcionesMenu.length === 0) {
          throw new Error("Usar lista por defecto");
        }
        
        setData(opcionesMenu);
      } catch (err) {
        console.warn('Cargando menú de emergencia por falta de datos o error de red en Supabase');
        
        const menuEmergencia = [
          { id_permiso: 1, titulo: "Órdenes de Venta", link: "/verOrdenesVenta", descripcion: "Gestión de Órdenes de Venta" },
          { id_permiso: 2, titulo: "Órdenes de Venta", link: "/crearOrdenVenta", descripcion: "Crear Orden de Venta" },
          { id_permiso: 3, titulo: "Órdenes Producción", link: "/crearOrdenProduccion", descripcion: "Crear Orden Producción" },
          { id_permiso: 4, titulo: "Órdenes de Compra", link: "/crearOrdenCompra", descripcion: "Crear Orden de Compra" },
          { id_permiso: 5, titulo: "Órdenes Producción", link: "/verOrdenesProduccion", descripcion: "Ver Órdenes Producción" },
          { id_permiso: 6, titulo: "Stock Productos", link: "/verStockProductos", descripcion: "Stock Productos" },
          { id_permiso: 7, titulo: "Lotes Productos", link: "/lotesProductos", descripcion: "Lotes Productos" },
          { id_permiso: 8, titulo: "Stock Materias Primas", link: "/GestionMateriasPrimas", descripcion: "Stock Materias Primas" },
          { id_permiso: 9, titulo: "Órdenes de Compra", link: "/VerOrdenesCompra", descripcion: "Ver Órdenes de Compra" },
          { id_permiso: 10, titulo: "Lineas de Producción", link: "/VerLineasDeProduccion", descripcion: "Líneas de Producción" },
          { id_permiso: 11, titulo: "Gestión de Órdenes de Despacho", link: "/verOrdenesDespacho", descripcion: "Gestión de Órdenes de Despacho" },
          { id_permiso: 12, titulo: "Ordenes de Trabajo", link: "/verOrdenesDeTrabajo", descripcion: "Órdenes de Trabajo" },
          { id_permiso: 13, titulo: "Trazabilidad de Orden de Venta", link: "/trazabilidadOrdenVenta", descripcion: "Trazabilidad de Orden de Venta" },
          { id_permiso: 14, titulo: "Dashboard", link: "/dashboard", descripcion: "Dashboard Analítico" },
          { id_permiso: 15, titulo: "Planificación Semanal", link: "/calendario", descripcion: "Planificación Semanal" },
          { id_permiso: 16, titulo: "Lotes Materias Primas", link: "/lotesMateriasPrimas", descripcion: "Lotes Materias Primas" },
          { id_permiso: 17, titulo: "Configuración", link: "/metricas-configuracion", descripcion: "Metricas y Configuración" },
          { id_permiso: 18, titulo: "Planificación Semanal", link: "/ejecutarPlanificacion", descripcion: "Ejecutar Planificación MRP" },
          { id_permiso: 19, titulo: "Registrar Nuevo Empleado", link: "/crearUsuario", descripcion: "Registrar Nuevo Empleado" }
        ];
        
        setData(menuEmergencia);
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className={styles.home}>
        <h1 className={styles.title}>Cargando Contenido</h1>
        <div className={styles.loading}></div>
      </div>
    )
  }

  // Helper elástico para remover acentos y dejar el texto plano para matchear perfecto
  const normalizarTexto = (texto) => {
    if (!texto) return "";
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
      .trim();
  };

  return (
    <div className={styles.home}>
      <div className={styles.content}>
        {(data || []).map(item => {
          // Buscamos la descripción en minúsculas y sin acentos dentro del diccionario
          const llaveBusqueda = normalizarTexto(item.descripcion);
          const Icono = iconMap[llaveBusqueda] || DefaultIcon;

          return (
            <div key={item.id_permiso} onClick={() => navigate(item.link)} className={styles.card}>
              <div className={styles.cardIcon}>
                {Icono}
              </div>
              <p className={styles.cardDescription}>{item.descripcion}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MenuPrincipal;