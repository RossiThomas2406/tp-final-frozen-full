from django.contrib import admin
from .models import EstadoDespacho, Repartidor, OrdenDespacho, DespachoOrenVenta

@admin.register(Repartidor)
class RepartidorAdmin(admin.ModelAdmin):
    list_display = ('id_repartidor', 'nombre', 'telefono', 'patente') # Columnas que se verán
    search_fields = ('nombre', 'patente') # Buscador por nombre o patente

@admin.register(OrdenDespacho)
class OrdenDespachoAdmin(admin.ModelAdmin):
    list_display = ('id_orden_despacho', 'id_repartidor', 'id_estado_despacho', 'fecha_despacho')
    list_filter = ('id_estado_despacho', 'id_repartidor') # Filtros laterales