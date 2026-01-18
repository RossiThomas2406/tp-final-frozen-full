import os
import django
import sys

# Añadimos el directorio actual al path de Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Cambiamos 'backend.settings' por 'settings' si el archivo está en la misma carpeta
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

try:
    django.setup()
except Exception as e:
    print(f"Error al configurar Django: {e}")
    # Si falla, intentamos con el nombre del proyecto (ajusta si tu carpeta se llama distinto)
    os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
    django.setup()

from ventas.models import EstadoVenta, Prioridad
from produccion.models import EstadoOrdenProduccion, estado_linea_produccion, EstadoOrdenTrabajo, TipoNoConformidad
from stock.models import EstadoLoteProduccion, EstadoLoteMateriaPrima, EstadoReserva, EstadoReservaMateria

def cargar_datos_maestros():
    print("--- Iniciando carga de datos maestros ---")

    # 1. Ventas
    for desc in ['Pendiente', 'Aprobada', 'En Producción', 'Entregada', 'Cancelada']:
        EstadoVenta.objects.get_or_create(descripcion=desc)
    for desc in ['Baja', 'Media', 'Alta']:
        Prioridad.objects.get_or_create(descripcion=desc)
    print("✅ Ventas y Prioridades listas.")

    # 2. Producción
    for desc in ['Planificada', 'En Curso', 'Finalizada', 'Cancelada']:
        EstadoOrdenProduccion.objects.get_or_create(descripcion=desc)
    for desc in ['Disponible', 'Ocupada', 'Mantenimiento', 'Fuera de Servicio']:
        estado_linea_produccion.objects.get_or_create(descripcion=desc)
    for desc in ['Pendiente', 'Iniciada', 'Pausada', 'Completada']:
        EstadoOrdenTrabajo.objects.get_or_create(descripcion=desc)
    for nombre in ['Falla Mecánica', 'Error Humano', 'Materia Prima Defectuosa', 'Corte de Luz']:
        TipoNoConformidad.objects.get_or_create(nombre=nombre)
    print("✅ Estados de Producción y No Conformidades listos.")

    # 3. Stock y Reservas
    for desc in ['Disponible', 'Cuarentena', 'Vencido', 'Agotado']:
        EstadoLoteProduccion.objects.get_or_create(descripcion=desc)
        EstadoLoteMateriaPrima.objects.get_or_create(descripcion=desc)
    for desc in ['Activa', 'Completada', 'Cancelada']:
        EstadoReserva.objects.get_or_create(descripcion=desc)
        EstadoReservaMateria.objects.get_or_create(descripcion=desc)
    print("✅ Estados de Stock y Reservas listos.")

    print("\n🚀 ¡Base de datos inicializada correctamente!")

if __name__ == '__main__':
    cargar_datos_maestros()