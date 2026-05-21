import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import Modal from 'react-modal';
import styles from './Calendario.module.css';

// Configuración del modal para accesibilidad
Modal.setAppElement('#root');

// 🚀 IMPLANTADO: Host unificado de Render para producción real
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "https://frozen-backend-d5t3.onrender.com/api/";
const cleanBaseURL = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;

const Calendario = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🛡️ Conectamos de forma limpia con tu endpoint real de Render
      const url = `${cleanBaseURL}planificacion/calendario/`;
      const response = await fetch(url);
      
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('El servidor devolvió un HTML en lugar del JSON de planificación.');
      }

      if (!response.ok) {
        throw new Error('Error al cargar los eventos');
      }
      
      const data = await response.json();
      // Shield protector elástico por si viene encapsulado o plano
      const listaEventos = data?.results || (Array.isArray(data) ? data : []);
      setEvents(listaEventos);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setError(err.message);
      setEvents([]); // Fallback seguro
    } finally {
      setLoading(false);
    }
  };

  // Función para convertir fecha UTC a fecha local sin cambiar el día
  const parseUTCDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  };

  const getEventsForDay = (day) => {
    if (!Array.isArray(events)) return [];
    return events.filter(event => {
      if (!event || !event.start) return false;
      const eventDate = parseUTCDate(event.start);
      
      // Normalizar las fechas para comparación (solo año, mes, día)
      const normalizedEventDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const normalizedDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      
      return normalizedEventDate.getTime() === normalizedDay.getTime();
    });
  };

  const getEventTypeClass = (type) => {
    switch (type) {
      case 'Produccion':
        return styles.eventOP;
      case 'Compra (Recepción)':
        return styles.eventOC;
      case 'Venta (Fecha Estimada)':
        return styles.eventOV;
      default:
        return styles.eventDefault;
    }
  };

  const getEventStatusClass = (status) => {
    switch (status) {
      case 'En espera':
      case 'Creada':
      case 'Pendiente de Pago':
        return styles.statusEspera;
      case 'En proceso':
      case 'Planificada':
      case 'En Preparación':
        return styles.statusProceso;
      default:
        return styles.statusDefault;
    }
  };

  const getEventColor = (event) => {
    return event?.color || '#6B7280';
  };

  const formatEventDate = (dateString) => {
    const date = parseUTCDate(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  // Función para extraer el ID real de OP del título
  const getEventDisplayId = (event) => {
    if (!event) return 'EV';
    if (event.type === 'Produccion' && event.title) {
      const opMatch = event.title.match(/OP-?\d+/i);
      if (opMatch) {
        return opMatch[0].toUpperCase();
      }
      const idMatch = event.title.match(/(\d+)/);
      if (idMatch) {
        return `OP-${idMatch[1]}`;
      }
    }
    return event.id || 'EV';
  };

  // Función para extraer la descripción sin el ID
  const getEventDisplayTitle = (event) => {
    if (!event || !event.title) return 'Sin título';
    let title = event.title;
    
    if (event.type === 'Produccion') {
      title = title.replace(/OP-?\d+\s*:?\s*/i, '');
    }
    title = title.replace(/^[A-Z]{2,3}-?\d+\s*:?\s*/, '');
    
    return title.trim() || 'Sin título';
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dayEvents = getEventsForDay(day);
    setSelectedDay(day);
    setSelectedDayEvents(dayEvents);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setSelectedDayEvents([]);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generar días del mes
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const endDay = monthEnd.getDay();
  
  const previousMonthDays = startDay === 0 ? 6 : startDay - 1;
  const nextMonthDays = endDay === 0 ? 0 : 7 - endDay;

  const allDays = [
    ...Array(previousMonthDays).fill(null),
    ...monthDays,
    ...Array(nextMonthDays).fill(null)
  ];

  if (loading) {
    return (
      <div className={styles.calendarContainer}>
        <h1 className={styles.mainTitle}>Calendario Planificación</h1>
        <div className={styles.loading}>Cargando calendario...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.calendarContainer}>
        <h1 className={styles.mainTitle}>Calendario Planificación</h1>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <h1 className={styles.mainTitle}>Calendario Planificación</h1>
      
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          <button onClick={() => navigateMonth(-1)} className={styles.navButton}>‹</button>
          <div className={styles.monthYear}>
            <h2>{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
            <button onClick={goToToday} className={styles.todayButton}>Hoy</button>
          </div>
          <button onClick={() => navigateMonth(1)} className={styles.navButton}>›</button>
        </div>

        <div className={styles.weekDays}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {allDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            
            return (
              <div
                key={index}
                className={`${styles.day} ${
                  !day || !isSameMonth(day, currentDate) ? styles.otherMonth : ''
                } ${day && isToday(day) ? styles.today : ''} ${
                  day ? styles.clickableDay : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                {day && (
                  <>
                    <div className={styles.dayNumber}>{format(day, 'd')}</div>
                    <div className={styles.events}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`${styles.event} ${getEventTypeClass(event.type)} ${getEventStatusClass(event.status)}`}
                          title={event.title}
                          style={{ backgroundColor: getEventColor(event) }}
                        >
                          <span className={styles.eventId}>{getEventDisplayId(event)}</span>
                          <span className={styles.eventTitle}>{getEventDisplayTitle(event)}</span>
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className={styles.moreEvents}>+{dayEvents.length - 3} más</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.legendOP}`}></div>
            <span>Producción (OP)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.legendOC}`}></div>
            <span>Compra (OC)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.legendOV}`}></div>
            <span>Venta (OV)</span>
          </div>
        </div>
      </div>

      {/* Modal para mostrar eventos del día */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className={styles.modal}
        overlayClassName={styles.overlay}
        contentLabel="Eventos del día"
      >
        {selectedDay && (
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Eventos del {format(selectedDay, 'dd/MM/yyyy')}</h2>
              <button onClick={closeModal} className={styles.closeButton} aria-label="Cerrar modal">×</button>
            </div>

            <div className={styles.modalBody}>
              {selectedDayEvents.length === 0 ? (
                <div className={styles.noEvents}>No hay eventos programados para este día</div>
              ) : (
                <div className={styles.eventsList}>
                  {selectedDayEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className={`${styles.modalEvent} ${getEventTypeClass(event.type)}`}
                      style={{ borderLeftColor: getEventColor(event) }}
                    >
                      <div className={styles.modalEventHeader}>
                        <span className={styles.modalEventId}>{getEventDisplayId(event)}</span>
                        <span className={`${styles.modalEventStatus} ${getEventStatusClass(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <h3 className={styles.modalEventTitle}>{getEventDisplayTitle(event)}</h3>
                      
                      <div className={styles.modalEventDetails}>
                        <div className={styles.modalEventDetail}><strong>Tipo:</strong> {event.type}</div>
                        <div className={styles.modalEventDetail}><strong>Fecha:</strong> {formatEventDate(event.start)}</div>
                        {event.end && <div className={styles.modalEventDetail}><strong>Hasta:</strong> {formatEventDate(event.end)}</div>}
                        {event.cantidad_planificada_dia && <div className={styles.modalEventDetail}><strong>Cantidad Planificada:</strong> {event.cantidad_planificada_dia} u.</div>}
                        {event.horas_reservadas && <div className={styles.modalEventDetail}><strong>Horas Reservadas:</strong> {event.horas_reservadas} h</div>}
                        {event.linea && <div className={styles.modalEventDetail}><strong>Línea:</strong> {event.linea}</div>}
                        {event.cantidad_total && <div className={styles.modalEventDetail}><strong>Cantidad Total:</strong> {event.cantidad_total} u.</div>}
                        {event.proveedor && <div className={styles.modalEventDetail}><strong>Proveedor:</strong> {event.proveedor}</div>}
                        {event.cliente && <div className={styles.modalEventDetail}><strong>Cliente:</strong> {event.cliente}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.modalCloseButton}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Calendario;