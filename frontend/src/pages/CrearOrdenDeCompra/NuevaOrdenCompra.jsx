import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './NuevaOrdenCompra.module.css';

// URL del backend real de Render unificado
const BACKEND_URL = 'https://frozen-backend-d5t3.onrender.com';

const NuevaOrdenCompra = () => {
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    proveedor: '',
    materiaPrima: null,
    cantidad: ''
  });

  const [unidadMedida, setUnidadMedida] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [cantidadMinimaPedido, setCantidadMinimaPedido] = useState(0);
  const [cantidadAjustada, setCantidadAjustada] = useState(0);

  const debounceTimeoutRef = useRef(null);

  // Obtener materias primas con blindaje de paginación
  const obtenerTodasLasMateriasPrimas = async () => {
    let todasLasMaterias = [];
    let url = `${BACKEND_URL}/api/materias_primas/materias/`;
    
    try {
      while (url) {
        const response = await axios.get(url);
        const data = response.data;
        
        if (data && data.results) {
          todasLasMaterias = [...todasLasMaterias, ...data.results];
          url = data.next ? data.next.replace('https://frozenback-test.up.railway.app', BACKEND_URL) : null;
        } else if (Array.isArray(data)) {
          todasLasMaterias = data;
          url = null;
        } else {
          console.error('Estructura de respuesta inesperada:', data);
          break;
        }
      }
      return todasLasMaterias;
    } catch (err) {
      console.error('Error obteniendo materias primas:', err);
      throw err;
    }
  };

  // Obtener proveedores con blindaje de paginación
  const obtenerTodosLosProveedores = async () => {
    let todosLosProveedores = [];
    let url = `${BACKEND_URL}/api/materias_primas/proveedores/`;
    
    try {
      while (url) {
        const response = await axios.get(url);
        const data = response.data;
        
        if (data && data.results) {
          todosLosProveedores = [...todosLosProveedores, ...data.results];
          url = data.next ? data.next.replace('https://frozenback-test.up.railway.app', BACKEND_URL) : null;
        } else if (Array.isArray(data)) {
          todosLosProveedores = data;
          url = null;
        } else {
          console.error('Estructura de respuesta inesperada:', data);
          break;
        }
      }
      return todosLosProveedores;
    } catch (err) {
      console.error('Error obteniendo proveedores:', err);
      throw err;
    }
  };

  // Cargar unidades de medida de forma controlada
  const cargarUnidadesMedida = async (materias) => {
    const unidadesUnicas = [...new Set(materias.map(m => m.id_unidad).filter(id => id))];
    const unidadesMap = {};

    const unidadesPromises = unidadesUnicas.map(async (idUnidad) => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/productos/unidades/${idUnidad}/`);
        return { id: idUnidad, descripcion: response.data.descripcion };
      } catch (err) {
        console.error(`Error obteniendo unidad ${idUnidad}:`, err);
        return { id: idUnidad, descripcion: `Unidad ${idUnidad}` };
      }
    });

    const unidadesData = await Promise.all(unidadesPromises);
    unidadesData.forEach(unidad => {
      unidadesMap[unidad.id] = unidad.descripcion;
    });

    setUnidadesMedida(unidadesMap);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const todosLosProveedores = await obtenerTodosLosProveedores();
        setProveedores(todosLosProveedores);

        const materiasIds = await obtenerTodasLasMateriasPrimas();
        
        if (Array.isArray(materiasIds) && materiasIds.length > 0) {
          const materiasPromises = materiasIds.map(async (materia) => {
            try {
              const id = materia.id_materia_prima || materia.id;
              const response = await axios.get(`${BACKEND_URL}/api/materias_primas/materias/${id}/`);
              return response.data;
            } catch (err) {
              console.error(`Error obteniendo detalle de materia prima:`, err);
              return materia; // Fallback al objeto base si falla el detalle
            }
          });

          const materiasCompletas = (await Promise.all(materiasPromises)).filter(m => m !== null);
          setMateriasPrimas(materiasCompletas);
          await cargarUnidadesMedida(materiasCompletas);
        } else {
          // Permitir renderizar la pantalla vacía en vez de crashear si la BD está limpia
          setMateriasPrimas([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error general al cargar los datos:', err);
        setError('Error al conectar con el servidor de compras.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calcularCantidadAjustada = (cantidadSolicitada, cantidadMinima) => {
    if (!cantidadMinima || cantidadMinima <= 0) return cantidadSolicitada;
    if (cantidadSolicitada <= cantidadMinima) return cantidadMinima;
    const multiplos = Math.ceil(cantidadSolicitada / cantidadMinima);
    return multiplos * cantidadMinima;
  };

  const mostrarToastAjuste = (ajustada, cantidadMinimaPedido, unidadMedida) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      toast.warning(`La cantidad será ajustada a ${ajustada} ${unidadMedida}`);
    }, 1000);
  };

  const opcionesMateriasPrimas = (materiasPrimas || []).map(materia => {
    const descripcionUnidad = unidadesMedida[materia.id_unidad] || `Unidad ${materia.id_unidad}`;
    return {
      value: materia.id_materia_prima,
      label: `${materia.nombre} - ${materia.descripcion || ''}`,
      unidad_medida: descripcionUnidad,
      id_proveedor: materia.id_proveedor,
      cantidad_minima_pedido: materia.cantidad_minima_pedido || materia.umbral_minimo || 1,
      id_unidad: materia.id_unidad
    };
  });

  const opcionesProveedores = (proveedores || []).map(proveedor => ({
    value: proveedor.id_proveedor,
    label: `${proveedor.nombre} - ${proveedor.contacto}`
  }));

  const handleMateriaPrimaChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      materiaPrima: selectedOption,
      proveedor: selectedOption ? selectedOption.id_proveedor : '',
      cantidad: ''
    }));

    setUnidadMedida(selectedOption ? selectedOption.unidad_medida : '');
    const minimaPedido = selectedOption ? selectedOption.cantidad_minima_pedido : 0;
    setCantidadMinimaPedido(minimaPedido);
    setCantidadAjustada(0);

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (selectedOption && selectedOption.id_proveedor) {
      const proveedorEncontrado = proveedores.find(
        prov => prov.id_proveedor === selectedOption.id_proveedor
      );
      
      if (proveedorEncontrado) {
        setProveedorSeleccionado({
          value: proveedorEncontrado.id_proveedor,
          label: `${proveedorEncontrado.nombre} - ${proveedorEncontrado.contacto}`
        });
      } else {
        setProveedorSeleccionado({
          value: selectedOption.id_proveedor,
          label: 'Proveedor asignado'
        });
      }
    } else {
      setProveedorSeleccionado(null);
    }
  };

  const handleCantidadChange = (e) => {
    const cantidadIngresada = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, cantidad: e.target.value }));

    if (cantidadMinimaPedido > 0 && cantidadIngresada > 0) {
      const ajustada = calcularCantidadAjustada(cantidadIngresada, cantidadMinimaPedido);
      setCantidadAjustada(ajustada);
      if (ajustada !== cantidadIngresada) {
        mostrarToastAjuste(ajustada, cantidadMinimaPedido, unidadMedida);
      }
    } else {
      setCantidadAjustada(cantidadIngresada);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.proveedor || !formData.materiaPrima || !formData.cantidad) {
      toast.error('Por favor, complete todos los campos');
      return;
    }

    if (parseFloat(formData.cantidad) <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      setIsSubmitting(true);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      const cantidadFinal = cantidadAjustada > 0 ? cantidadAjustada : parseFloat(formData.cantidad);

      const ordenCompraData = {
        id_proveedor: parseInt(formData.proveedor),
        materias_primas: [
          {
            id_materia_prima: parseInt(formData.materiaPrima.value),
            cantidad: cantidadFinal
          }
        ]
      };

      await axios.post(`${BACKEND_URL}/api/compras/ordenes-compra/`, ordenCompraData, {
        headers: { 'Content-Type': 'application/json' }
      });

      setFormData({ proveedor: '', materiaPrima: null, cantidad: '' });
      setUnidadMedida('');
      setProveedorSeleccionado(null);
      setCantidadMinimaPedido(0);
      setCantidadAjustada(0);
      
      toast.success('Orden de compra creada exitosamente');
    } catch (err) {
      console.error('Error al crear la orden de compra:', err);
      toast.error('No se pudo procesar la orden en este momento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      border: '2px solid #ddd',
      borderRadius: '6px',
      padding: '2px',
      backgroundColor: state.isDisabled ? '#f5f5f5' : 'white'
    })
  };

  if (loading) return <div className={styles.loading}>Cargando panel de insumos...</div>;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <h1 className={styles.title}>Nueva Orden de Compra</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Materia Prima *</label>
          <Select
            options={opcionesMateriasPrimas}
            value={formData.materiaPrima}
            onChange={handleMateriaPrimaChange}
            placeholder="Seleccione una materia prima"
            isSearchable
            styles={customStyles}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Proveedor *</label>
          <Select
            options={opcionesProveedores}
            value={proveedorSeleccionado}
            placeholder="Se autocompleta según el insumo"
            isDisabled={true}
            styles={customStyles}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cantidad" className={styles.label}>Cantidad *</label>
          <div className={styles.quantityContainer}>
            <input
              type="number"
              id="cantidad"
              value={formData.cantidad}
              onChange={handleCantidadChange}
              className={styles.input}
              min="0"
              step="0.01"
              placeholder="Ingrese la cantidad"
              required
            />
            {unidadMedida && <span className={styles.unit}>{unidadMedida}</span>}
          </div>
          
          {cantidadMinimaPedido > 0 && (
            <div className={styles.cantidadInfo}>
              <small className={styles.helperText}>
                Mínimo de pedido: <strong>{cantidadMinimaPedido} {unidadMedida}</strong>
              </small>
              {cantidadAjustada > 0 && parseFloat(formData.cantidad) !== cantidadAjustada && (
                <small className={styles.ajusteText}>
                  <br />Cantidad ajustada por lote: <strong>{cantidadAjustada} {unidadMedida}</strong>
                </small>
              )}
            </div>
          )}
        </div>

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Orden de Compra'}
        </button>
      </form>
    </div>
  );
};

export default NuevaOrdenCompra;