import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import QRCode from "qrcode";
import Select from "react-select";
import styles from "./LotesProductos.module.css";

// Configurar el modal para accesibilidad
Modal.setAppElement("#root");

// 🚀 IMPLANTADO: Tu dominio real de Render. Chau problemas de CORS y localhost.
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "https://frozen-backend-d5t3.onrender.com/api/"; 
const cleanBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;

const api = axios.create({
    baseURL: cleanBaseURL,
});

const LotesProductos = ({ products }) => {
    const navigate = useNavigate();
    const [lotes, setLotes] = useState([]);
    const [lotesFiltrados, setLotesFiltrados] = useState([]);
    const [lotesLoading, setLotesLoading] = useState(true);

    // Estados para paginación SERVER-SIDE
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalLotes, setTotalLotes] = useState(0);

    // Estados para filtros
    const [filtroProducto, setFiltroProducto] = useState(null);
    const [filtroVencimiento, setFiltroVencimiento] = useState("todos");
    const [filtroEstado, setFiltroEstado] = useState(null);

    // Estados disponibles desde el endpoint
    const [estadosLotes, setEstadosLotes] = useState([]);

    const isFirstRender = useRef(true);

    // Estados para el modal de QR
    const [modalQRAbierto, setModalQRAbierto] = useState(false);
    const [qrImage, setQrImage] = useState("");
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [generandoQR, setGenerandoQR] = useState(false);

    // Fetch estados de lotes
    const fetchEstadosLotes = async () => {
        try {
            // 🛡️ CORREGIDO: Sin slash inicial para respetar el prefijo /api/
            const response = await api.get("stock/estado-lotes-produccion/");
            
            if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
                setEstadosLotes([]);
                return;
            }

            const dataResults = response.data?.results || (Array.isArray(response.data) ? response.data : []);
            
            const opcionesEstados = dataResults.map((estado) => ({
                value: estado.id_estado_lote_produccion,
                label: estado.descripcion,
            }));

            setEstadosLotes(opcionesEstados);
        } catch (error) {
            console.error("Error fetching estados de lotes:", error);
            setEstadosLotes([]);
        }
    };

    // Fetch productos desde el nuevo endpoint
    const [opcionesProductos, setOpcionesProductos] = useState([]);

    const fetchProductos = async () => {
        try {
            // 🛡️ CORREGIDO: Sin slash inicial para respetar el prefijo /api/
            const response = await api.get("productos/productos/");
            
            if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
                setOpcionesProductos([]);
                return;
            }

            const dataResults = response.data?.results || (Array.isArray(response.data) ? response.data : []);

            const opciones = dataResults.map((producto) => ({
                value: producto.id_producto, 
                label: producto.nombre || "Producto sin nombre", 
            }));

            setOpcionesProductos(opciones);
        } catch (error) {
            console.error("Error fetching productos:", error);
            setOpcionesProductos([]);
        }
    };

    // Fetch lotes de producción con paginación SERVER-SIDE
    const fetchLotesProduccion = async (pagina = 1) => {
        try {
            console.log("Fetching lotes desde página:", pagina, "con filtros:", {
                producto: filtroProducto,
                estado: filtroEstado,
            });
            setLotesLoading(true);

            const params = new URLSearchParams();
            params.append("page", pagina.toString());

            if (filtroProducto) {
                params.append("id_producto", filtroProducto.value.toString());
            }

            if (filtroEstado) {
                params.append("id_estado_lote_produccion", filtroEstado.value.toString());
            }

            // 🛡️ CORREGIDO: Sin slash inicial para que la concatenación sea limpia
            const response = await api.get(`stock/lotes-produccion/?${params.toString()}`);
            
            if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
                setLotes([]);
                setLotesFiltrados([]);
                return;
            }

            const data = response.data;
            const resultados = data?.results || (Array.isArray(data) ? data : []);

            setLotes(resultados);
            setLotesFiltrados(resultados);
            setTotalLotes(data?.count || resultados.length || 0);
            
            const count = data?.count || 1;
            const len = resultados.length || 1;
            setTotalPaginas(Math.ceil(count / len));
            setPaginaActual(pagina);
        } catch (error) {
            console.error("Error fetching lotes de producción disponibles:", error);
            setLotes([]);
            setLotesFiltrados([]);
        } finally {
            setLotesLoading(false);
        }
    };

    // Efecto para cargar lotes cuando cambian los filtros
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        fetchLotesProduccion(1);
    }, [filtroProducto, filtroEstado]);

    // Efecto para aplicar filtro de vencimiento client-side
    useEffect(() => {
        let resultado = [...lotes];

        if (filtroVencimiento !== "todos") {
            if (filtroVencimiento === "mas_cercano") {
                resultado.sort((a, b) => {
                    const fechaA = a.fecha_vencimiento ? new Date(a.fecha_vencimiento) : new Date("9999-12-31");
                    const fechaB = b.fecha_vencimiento ? new Date(b.fecha_vencimiento) : new Date("9999-12-31");
                    return fechaA - fechaB;
                });
            } else if (filtroVencimiento === "mas_lejano") {
                resultado.sort((a, b) => {
                    const fechaA = a.fecha_vencimiento ? new Date(a.fecha_vencimiento) : new Date("9999-12-31");
                    const fechaB = b.fecha_vencimiento ? new Date(b.fecha_vencimiento) : new Date("9999-12-31");
                    return fechaB - fechaA;
                });
            }
        }

        setLotesFiltrados(resultado);
    }, [lotes, filtroVencimiento]);

    const irAPagina = (pagina) => {
        if (pagina >= 1 && pagina <= totalPaginas) {
            fetchLotesProduccion(pagina);
            window.scrollTo(0, 0);
        }
    };

    const irAPaginaSiguiente = () => {
        if (paginaActual < totalPaginas) {
            fetchLotesProduccion(paginaActual + 1);
            window.scrollTo(0, 0);
        }
    };

    const irAPaginaAnterior = () => {
        if (paginaActual > 1) {
            fetchLotesProduccion(paginaActual - 1);
            window.scrollTo(0, 0);
        }
    };

    const obtenerNumerosPagina = () => {
        const paginas = [];
        const paginasAMostrar = 5;

        let inicio = Math.max(1, paginaActual - Math.floor(paginasAMostrar / 2));
        let fin = Math.min(totalPaginas, inicio + paginasAMostrar - 1);

        if (fin - inicio + 1 < paginasAMostrar) {
            inicio = Math.max(1, fin - paginasAMostrar + 1);
        }

        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }

        return paginas;
    };

    const obtenerNombreEstado = (idEstado) => {
        const estado = estadosLotes.find((estado) => estado.value === idEstado);
        return estado ? estado.label : "Estado activo";
    };

    const getColorEstado = (idEstado) => {
        const coloresEstados = {
            2: "#3498db", 3: "#f39c12", 4: "#27ae60", 6: "#9b59b6",
            7: "#e67e22", 8: "#2ecc71", 9: "#e74c3c", 11: "#95a5a6",
        };
        return coloresEstados[idEstado] || "#95a5a6";
    };

    const generarYMostrarQR = async (lote) => {
        setGenerandoQR(true);
        setLoteSeleccionado(lote);

        try {
            const urlQR = `https://frozen-front-phi.vercel.app/trazabilidadLote/${lote.id_lote_produccion}`;
            const qrDataURL = await QRCode.toDataURL(urlQR, {
                width: 300,
                margin: 2,
                color: { dark: "#2c3e50", light: "#FFFFFF" },
            });

            setQrImage(qrDataURL);
            setModalQRAbierto(true);
        } catch (err) {
            console.error("Error generando QR:", err);
            alert("Error al generar el código QR");
        } finally {
            setGenerandoQR(false);
        }
    };

    const cerrarModalQR = () => {
        setModalQRAbierto(false);
        setQrImage("");
        setLoteSeleccionado(null);
    };

    const descargarQR = () => {
        if (!qrImage) return;
        const link = document.createElement("a");
        link.href = qrImage;
        link.download = `QR_Lote_${loteSeleccionado.id_lote_produccion}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const limpiarFiltros = () => {
        setFiltroProducto(null);
        setFiltroEstado(null);
        setFiltroVencimiento("todos");
        setPaginaActual(1);
    };

    useEffect(() => {
        fetchEstadosLotes();
        fetchProductos();
        fetchLotesProduccion(1);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Sin fecha";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES");
    };

    const calcularDiasVencimiento = (fechaVencimiento) => {
        if (!fechaVencimiento) return null;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const vencimiento = new Date(fechaVencimiento);
        vencimiento.setHours(0, 0, 0, 0);
        const diferenciaMs = vencimiento - hoy;
        return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    };

    const getColorVencimiento = (dias) => {
        if (dias === null) return "#95a5a6";
        if (dias < 0) return "#e74c3c";
        if (dias <= 3) return "#f39c12";
        if (dias <= 7) return "#f1c40f";
        return "#27ae60";
    };

    const getColorCantidad = (cantidad) => {
        if (cantidad === 0) return "#e74c3c";
        if (cantidad < 10) return "#f39c12";
        return "#27ae60";
    };

    return (
        <div className={styles.lotesProduccion}>
            <div className={styles.header}>
                <h2 className={styles.titulo}>Lotes de Producción</h2>
            </div>

            <div className={styles.estadisticas}>
                <div className={styles.estadisticaItem}>
                    <span className={styles.estadisticaNumero}>{totalLotes}</span>
                    <span className={styles.estadisticaLabel}>Total Lotes</span>
                </div>
            </div>

            <div className={styles.controles}>
                <div className={styles.filtroGrupo}>
                    <label className={styles.label}>Filtrar por Producto:</label>
                    <Select
                        value={filtroProducto}
                        onChange={(value) => {
                            if (value !== filtroProducto) setFiltroProducto(value);
                        }}
                        options={opcionesProductos}
                        isClearable
                        isSearchable
                        placeholder="Buscar producto..."
                        className={styles.reactSelect}
                        classNamePrefix="react-select"
                    />
                </div>

                <div className={styles.filtroGrupo}>
                    <label className={styles.label}>Filtrar por Estado:</label>
                    <Select
                        value={filtroEstado}
                        onChange={setFiltroEstado}
                        options={estadosLotes}
                        isClearable
                        isSearchable
                        placeholder="Seleccionar estado..."
                        className={styles.reactSelect}
                        classNamePrefix="react-select"
                    />
                </div>

                <div className={styles.filtroGrupo}>
                    <label htmlFor="filtroVencimiento" className={styles.label}>Ordenar por Vencimiento:</label>
                    <select
                        id="filtroVencimiento"
                        value={filtroVencimiento}
                        onChange={(e) => setFiltroVencimiento(e.target.value)}
                        className={styles.select}
                    >
                        <option value="todos">Sin orden específico</option>
                        <option value="mas_cercano">Vencimiento más cercano</option>
                        <option value="mas_lejano">Vencimiento más lejano</option>
                    </select>
                </div>

                <button onClick={limpiarFiltros} className={styles.btnLimpiar}>
                    Limpiar Filtros
                </button>
            </div>

            <div className={styles.paginacionInfo}>
                <p>
                    Mostrando {lotesFiltrados.length} de {totalLotes} lotes (Página {paginaActual} de {totalPaginas})
                </p>
            </div>

            <div className={styles.listaLotes}>
                {lotesFiltrados.length > 0 ? (
                    lotesFiltrados.map((lote) => {
                        const diasVencimiento = calcularDiasVencimiento(lote.fecha_vencimiento);

                        return (
                            <div key={lote.id_lote_produccion} className={styles.cardLote}>
                                <div className={styles.cardHeader}>
                                    <h3>Lote #{lote.id_lote_produccion}</h3>
                                    <span
                                        className={styles.estado}
                                        style={{ backgroundColor: getColorEstado(lote.id_estado_lote_produccion) }}
                                    >
                                        {obtenerNombreEstado(lote.id_estado_lote_produccion)}
                                    </span>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.infoGrupo}>
                                        <strong>Producto:</strong>
                                        <span>{lote.producto_nombre || lote.id_producto}</span>
                                    </div>

                                    <div className={styles.infoGrupo}>
                                        <strong>Cantidad Total:</strong>
                                        <span>{lote.cantidad} {lote.unidad_medida || 'U.'}</span>
                                    </div>

                                    <div className={styles.infoGrupo}>
                                        <strong>Disponible:</strong>
                                        <span
                                            className={styles.cantidad}
                                            style={{ color: getColorCantidad(lote.cantidad_disponible) }}
                                        >
                                            {lote.cantidad_disponible} {lote.unidad_medida || 'U.'}
                                        </span>
                                    </div>

                                    <div className={styles.infoGrupo}>
                                        <strong>Reservado:</strong>
                                        <span>{lote.cantidad_reservada || 0} {lote.unidad_medida || 'U.'}</span>
                                    </div>

                                    <div className={styles.infoGrupo}>
                                        <strong>Producción:</strong>
                                        <span>{formatDate(lote.fecha_produccion)}</span>
                                    </div>

                                    <div className={styles.infoGrupo}>
                                        <strong>Vencimiento:</strong>
                                        <span className={styles.diasInfo}>
                                            {formatDate(lote.fecha_vencimiento)}
                                            {diasVencimiento !== null && (
                                                <span
                                                    className={styles.diasInfo}
                                                    style={{ color: getColorVencimiento(diasVencimiento) }}
                                                >
                                                    <br />
                                                    {diasVencimiento < 0
                                                        ? ` (Vencido hace ${Math.abs(diasVencimiento)} días)`
                                                        : ` (${diasVencimiento} días)`}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <button
                                        className={styles.btnDetalles}
                                        onClick={() => navigate(`/trazabilidadLote/${lote.id_lote_produccion}`)}
                                    >
                                        Trazar Lote
                                    </button>
                                    <button
                                        className={styles.btnQR}
                                        onClick={() => generarYMostrarQR(lote)}
                                        disabled={generandoQR}
                                    >
                                        {generandoQR && loteSeleccionado?.id_lote_produccion === lote.id_lote_produccion ? (
                                            <>
                                                <div className={styles.spinnerSmall}></div>
                                                Generando...
                                            </>
                                        ) : ("Generar QR")}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.sinResultados}>
                        No se encontraron lotes con los filtros aplicados
                    </div>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className={styles.paginacionContainer}>
                    <button onClick={irAPaginaAnterior} disabled={paginaActual === 1} className={styles.botonPaginacion}>
                        Anterior
                    </button>

                    <div className={styles.numerosPagina}>
                        {obtenerNumerosPagina().map((numero) => (
                            <button
                                key={numero}
                                onClick={() => irAPagina(numero)}
                                className={`${styles.numeroPagina} ${paginaActual === numero ? styles.paginaActiva : ""}`}
                            >
                                {numero}
                            </button>
                        ))}
                    </div>

                    <button onClick={irAPaginaSiguiente} disabled={paginaActual === totalPaginas} className={styles.botonPaginacion}>
                        Siguiente
                    </button>
                </div>
            )}

            <Modal
                isOpen={modalQRAbierto}
                onRequestClose={cerrarModalQR}
                className={styles.modal}
                overlayClassName={styles.overlay}
                contentLabel="Código QR del Lote"
            >
                <div className={styles.modalContent}>
                    <h2 className={styles.modalTitulo}>
                        QR para Lote #{loteSeleccionado?.id_lote_produccion}
                    </h2>

                    {loteSeleccionado && (
                        <div className={styles.modalInfo}>
                            <p><strong>Producto:</strong> {loteSeleccionado.producto_nombre}</p>
                            <p><strong>Cantidad Disponible:</strong> {loteSeleccionado.cantidad_disponible} {loteSeleccionado.unidad_medida}</p>
                            <p><strong>Estado:</strong> {obtenerNombreEstado(loteSeleccionado.id_estado_lote_produccion)}</p>
                            <p><strong>Producción:</strong> {formatDate(loteSeleccionado.fecha_produccion)}</p>
                            {loteSeleccionado.fecha_vencimiento && (
                                <p><strong>Vencimiento:</strong> {formatDate(loteSeleccionado.fecha_vencimiento)}</p>
                            )}
                        </div>
                    )}

                    <div className={styles.qrContainer}>
                        {qrImage ? (
                            <>
                                <img src={qrImage} alt={`Código QR para Lote ${loteSeleccionado?.id_lote_produccion}`} className={styles.qrImage} />
                                <p className={styles.qrUrl}>
                                    URL: https://frozen-front-phi.vercel.app/trazabilidadLote/{loteSeleccionado?.id_lote_produccion}
                                </p>
                            </>
                        ) : (
                            <div className={styles.qrCargando}>
                                <div className={styles.spinner}></div>
                                <p>Generando código QR...</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.modalActions}>
                        <button onClick={cerrarModalQR} className={styles.btnModalCancelar}>Cerrar</button>
                        <button onClick={descargarQR} className={styles.btnModalDescargar} disabled={!qrImage}>Descargar QR</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LotesProductos;