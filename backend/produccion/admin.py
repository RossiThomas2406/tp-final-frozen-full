from django.contrib import admin
from .models import (
    EstadoOrdenProduccion, estado_linea_produccion, LineaProduccion, 
    OrdenProduccion, EstadoOrdenTrabajo, OrdenDeTrabajo, 
    TipoNoConformidad, NoConformidad, PausaOT, 
    OrdenVentaProduccion, CalendarioProduccion, OrdenProduccionPegging
)

# --- Configuración de Inlines ---
# Permite gestionar las órdenes de trabajo directamente dentro de la Orden de Producción
class OrdenDeTrabajoInline(admin.TabularInline):
    model = OrdenDeTrabajo
    extra = 0
    fields = ('id_linea_produccion', 'cantidad_programada', 'id_estado_orden_trabajo', 'hora_inicio_programada')

# Permite ver las no conformidades dentro de la Orden de Trabajo
class NoConformidadInline(admin.TabularInline):
    model = NoConformidad
    extra = 1

# --- Configuración de Admins ---

@admin.register(OrdenProduccion)
class OrdenProduccionAdmin(admin.ModelAdmin):
    list_display = (
        'id_orden_produccion', 'id_producto', 'cantidad', 
        'id_estado_orden_produccion', 'fecha_planificada', 'es_generada_automaticamente'
    )
    list_filter = ('id_estado_orden_produccion', 'es_generada_automaticamente', 'id_producto')
    search_fields = ('id_orden_produccion', 'id_producto__nombre')
    inlines = [OrdenDeTrabajoInline]
    date_hierarchy = 'fecha_planificada'

@admin.register(OrdenDeTrabajo)
class OrdenDeTrabajoAdmin(admin.ModelAdmin):
    list_display = (
        'id_orden_trabajo', 'id_orden_produccion', 'id_linea_produccion', 
        'cantidad_programada', 'cantidad_producida', 'id_estado_orden_trabajo'
    )
    list_filter = ('id_estado_orden_trabajo', 'id_linea_produccion', 'hora_inicio_programada')
    search_fields = ('id_orden_trabajo', 'id_orden_produccion__id_orden_produccion')
    inlines = [NoConformidadInline]
    readonly_fields = ('cantidad_producida',) # Calculado automáticamente por el modelo

@admin.register(LineaProduccion)
class LineaProduccionAdmin(admin.ModelAdmin):
    list_display = ('descripcion', 'id_estado_linea_produccion', 'capacidad_por_hora')
    list_filter = ('id_estado_linea_produccion',)

@admin.register(NoConformidad)
class NoConformidadAdmin(admin.ModelAdmin):
    list_display = ('id_no_conformidad', 'id_orden_trabajo', 'id_tipo_no_conformidad', 'cant_desperdiciada')
    list_filter = ('id_tipo_no_conformidad',)

@admin.register(CalendarioProduccion)
class CalendarioProduccionAdmin(admin.ModelAdmin):
    list_display = ('fecha', 'id_linea_produccion', 'id_orden_produccion', 'horas_reservadas', 'cantidad_a_producir')
    list_filter = ('fecha', 'id_linea_produccion')

@admin.register(OrdenProduccionPegging)
class OrdenProduccionPeggingAdmin(admin.ModelAdmin):
    list_display = ('id_orden_produccion', 'id_orden_venta_producto', 'cantidad_asignada')

# --- Registros Simples para Tablas Maestras ---
admin.site.register(EstadoOrdenProduccion)
admin.site.register(estado_linea_produccion)
admin.site.register(EstadoOrdenTrabajo)
admin.site.register(TipoNoConformidad)
admin.site.register(PausaOT)
admin.site.register(OrdenVentaProduccion)