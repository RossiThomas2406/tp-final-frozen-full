import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import QRCode from "qrcode";
import Select from "react-select";
import styles from "./VerLotesMateriaPrimaGeneral.module.css";
import { LotesMateriaPrimaService } from "../../classes/VerLotesMateriaPrimaService";

// Configurar el modal para accesibilidad
Modal.setAppElement("#root");

const ListaLotesMateriaPrima = () => {
    const navigate = useNavigate();
    const [lotes, setLotes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Estados para paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalLotes, setTotalLotes] = useState(0);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState("todos");
    const [filtroMateriaPrima, setFiltroMateriaPrima] = useState(null);

    // Estados para datos adicionales
    const [estadosLotes, setEstadosLotes] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);

    // Estados para el modal de QR
    const [modalQRAbierto, setModalQRAbierto] = useState(false);
    const [qrImage, setQrImage] = useState("");
    const [loteSeleccionado, setLoteSeleccionado] = useState(null);
    const [generandoQR, setGenerandoQR] = useState(false);

    // Construir query parameters para la API
    const construirQueryParams = () => {
        const queryParams = {};

        if (filtroEstado !== "todos" && Array.isArray(estadosLotes)) {
            const estadoSeleccionado = estadosLotes.find(
                (estado) => estado?.descripcion === filtroEstado
            );
            if (estadoSeleccionado) {
                queryParams.id_estado_lote_materia_prima = estadoSeleccionado.id_estado_lote_materia_prima;
            }
        }

        if (filtroMateriaPrima) {
            queryParams.id_materia_prima = filtroMateriaPrima.value;
        }

        return queryParams;
    };

    const cargarDatosConFiltros = async (pagina = 1) => {
        try {
            setCargando(true);
            setError(null);

            const queryParams = construirQueryParams();

            const [lotesData, estadosData, materiasData] = await Promise.all([
                LotesMateriaPrimaService.obtenerLotesMateriaPrima(pagina, queryParams),
                LotesMateriaPrimaService.obtenerEstadosLotes(),
                LotesMateriaPrimaService.obtenerMateriasPrimas(),
            ]);

            // Extracción segura con adaptadores elásticos
            const listaLotes = lotesData?.results || (Array.isArray(lotesData) ? lotesData : []);
            const listaEstados = estadosData?.results || (Array.isArray(estadosData) ? estadosData : []);
            const listaMaterias = materiasData?.results || (Array.isArray(materiasData) ? materiasData : []);

            setLotes(listaLotes);
            setTotalLotes(lotesData?.count || listaLotes.length || 0);

            const pageSize = listaLotes.length || 10;
            const totalPages = Math.ceil((lotesData?.count || listaLotes.length || 0) / pageSize);
            setTotalPaginas(totalPages || 1);

            setEstadosLotes(listaEstados);
            setMateriasPrimas(listaMaterias);
            
        } catch (err) {
            setError("Error al cargar los lotes de materia prima");
            console.error("Error:", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatosConFiltros(paginaActual);
    }, [paginaActual, filtroEstado, filtroMateriaPrima]);

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
            window.scrollTo(0, 0);
        }
    };

    const manejarCambioFiltro = () => {
        setPaginaActual(1);
    };

    const handleEstadoChange = (e) => {
        setFiltroEstado(e.target.value);
        manejarCambioFiltro();
    };

    const handleMateriaPrimaChange = (selectedOption) => {
        setFiltroMateriaPrima(selectedOption);
        manejarCambioFiltro();
    };

    const generarYMostrarQR = async (lote) => {
        setGenerandoQR(true);
        setLoteSeleccionado(lote);

        try {
            const urlQR = `https://frozen-front-phi.vercel.app/trazar_lote_materia_prima/${lote.id_lote_materia_prima}`;
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
        link.download = `QR_Lote_${loteSeleccionado.id_lote_materia_prima}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const obtenerNombreEstado = (idEstado) => {
        if (!Array.isArray(estadosLotes)) return "Disponible";
        const estado = estadosLotes.find(
            (estado) => estado?.id_estado_lote_materia_prima === idEstado
        );
        return estado?.descripcion || "Disponible";
    };

    const obtenerNombreMateriaPrima = (idMateriaPrima) => {
        if (!idMateriaPrima || !Array.isArray(materiasPrimas)) {
            return `Materia Prima #${idMateriaPrima}`;
        }
        const materia = materiasPrimas.find(
            (mp) => mp?.id_materia_prima === idMateriaPrima
        );
        return materia?.nombre || `Materia Prima #${idMateriaPrima}`;
    };

    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return "Sin vencimiento";
        const fecha = new Date(fechaISO);
        return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
    };

    const getColorEstado = (idEstado) => {
        const estado = obtenerNombreEstado(idEstado).toLowerCase();
        const colores = { disponible: "#27ae60", agotado: "#e74c3c", vencido: "#f39c12" };
        return colores[estado] || "#95a5a6";
    };

    const getColorCantidad = (cantidad) => {
        if (cantidad === 0) return "#e74c3c";
        if (cantidad < 10) return "#f39c12";
        return "#27ae60";
    };

    const limpiarFiltros = () => {
        setFiltroEstado("todos");
        setFiltroMateriaPrima(null);
        setPaginaActual(1);
    };

    const opcionesMateriasPrimas = Array.isArray(materiasPrimas) 
        ? materiasPrimas.map((materia) => ({
            value: materia?.id_materia_prima,
            label: materia?.nombre || "Sin nombre",
          }))
        : [];

    if (cargando) {
        return (
            <div className={styles.cargando}>
                <div className={styles.spinner}></div>
                <p>Cargando lotes de materia prima...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.lotesMateriaPrima}>
            <div className={styles.header}>
                <h2 className={styles.titulo}>Lotes de Materia Prima</h2>
            </div>

            <div className={styles.estadisticas}>
                <div className={styles.estadisticaItem}>
                    <span className={styles.estadisticaNumero}>{totalLotes}</span>
                    <span className={styles.estadisticaLabel}>Total Lotes</span>
                </div>
            </div>

            <div className={styles.controles}>
                <div className={styles.filtroGrupo}>
                    <label htmlFor="filtroEstado" className={styles.label}>Filtrar por Estado:</label>
                    <select id="filtroEstado" value={filtroEstado} onChange={handleEstadoChange} className={styles.select}>
                        <option value="todos">Todos los estados</option>
                        {Array.isArray(estadosLotes) && estadosLotes.map((estado) => (
                            <option key={estado?.id_estado_lote_materia_prima} value={estado?.descripcion}>
                                {estado?.descripcion}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.filtroGrupo}>
                    <label className={styles.label}>Filtrar por Materia Prima:</label>
                    <Select
                        value={filtroMateriaPrima}
                        onChange={handleMateriaPrimaChange}
                        options={opcionesMateriasPrimas}
                        isClearable
                        isSearchable
                        placeholder="Seleccione una materia prima"
                        className={styles.reactSelect}
                        classNamePrefix="react-select"
                    />
                </div>

                <button onClick={limpiarFiltros} className={styles.btnLimpiar}>Limpiar Filtros</button>
            </div>

            <div className={styles.contador}>
                Mostrando {lotes.length} de {totalLotes} lotes (Página {paginaActual} de {totalPaginas})
            </div>

            <div className={styles.listaLotes}>
                {lotes.length > 0 ? (
                    lotes.map((lote) => (
                        <div key={lote.id_lote_materia_prima} className={styles.cardLote}>
                            <div className={styles.cardHeader}>
                                <h3>Lote #{lote.id_lote_materia_prima}</h3>
                                <span className={styles.estado} style={{ backgroundColor: getColorEstado(lote.id_estado_lote_materia_prima) }}>
                                    {obtenerNombreEstado(lote.id_estado_lote_materia_prima).toUpperCase()}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoGrupo}>
                                    <strong>Materia Prima:</strong>
                                    <span>{obtenerNombreMateriaPrima(lote.id_materia_prima)}</span>
                                </div>
                                <div className={styles.infoGrupo}>
                                    <strong>Cantidad:</strong>
                                    <span className={styles.cantidad} style={{ color: getColorCantidad(lote.cantidad) }}>
                                        {lote.cantidad} unidades
                                    </span>
                                </div>
                                <div className={styles.infoGrupo}>
                                    <strong>Fecha Vencimiento:</strong>
                                    <span>{formatearFecha(lote.fecha_vencimiento)}</span>
                                </div>
                                <div className={styles.infoGrupo}>
                                    <strong>Materia Prima ID:</strong>
                                    <span>#{lote.id_materia_prima}</span>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <button className={styles.btnDetalles} onClick={() => navigate(`/trazar_lote_materia_prima/${lote.id_lote_materia_prima}`)}>
                                    Trazar Lote
                                </button>
                                <button className={styles.btnQR} onClick={() => generarYMostrarQR(lote)} disabled={generandoQR}>
                                    {generandoQR && loteSeleccionado?.id_lote_materia_prima === lote.id_lote_materia_prima ? (
                                        <>
                                            <div className={styles.spinnerSmall}></div>
                                            Generando...
                                        </>
                                    ) : ("Generar QR")}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.sinResultados}>No se encontraron lotes con los filtros aplicados</div>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className={styles.paginacion}>
                    <button className={styles.btnPaginacion} onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
                        Anterior
                    </button>
                    <div className={styles.infoPaginacion}>Página {paginaActual} de {totalPaginas}</div>
                    <button className={styles.btnPaginacion} onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
                        Siguiente
                    </button>
                </div>
            )}

            <Modal isOpen={modalQRAbierto} onRequestClose={cerrarModalQR} className={styles.modal} overlayClassName={styles.overlay} contentLabel="Código QR del Lote">
                <div className={styles.modalContent}>
                    <h2 className={styles.modalTitulo}>QR para Lote #{loteSeleccionado?.id_lote_materia_prima}</h2>
                    {loteSeleccionado && (
                        <div className={styles.modalInfo}>
                            <p><strong>Materia Prima:</strong> {obtenerNombreMateriaPrima(loteSeleccionado.id_materia_prima)}</p>
                            <p><strong>Cantidad:</strong> {loteSeleccionado.cantidad} unidades</p>
                            <p><strong>Estado:</strong> {obtenerNombreEstado(loteSeleccionado.id_estado_lote_materia_prima)}</p>
                            {loteSeleccionado.fecha_vencimiento && <p><strong>Vencimiento:</strong> {formatearFecha(loteSeleccionado.fecha_vencimiento)}</p>}
                        </div>
                    )}
                    <div className={styles.qrContainer}>
                        {qrImage ? (
                            <>
                                <img src={qrImage} alt={`Código QR para Lote ${loteSeleccionado?.id_lote_materia_prima}`} className={styles.qrImage} />
                                <p className={styles.qrUrl}>URL: https://frozen-front-phi.vercel.app/trazar_lote_materia_prima/{loteSeleccionado?.id_lote_materia_prima}</p>
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

export default ListaLotesMateriaPrima;