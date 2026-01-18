from django.contrib import admin
from .models import EstadoOrdenCompra, OrdenCompra, OrdenCompraMateriaPrima, OrdenCompraProduccion

@admin.register(EstadoOrdenCompra)
class EstadoOrdenCompraAdmin(admin.ModelAdmin):
    list_display = ('id_estado_orden_compra', 'descripcion')

@admin.register(OrdenCompra)
class OrdenCompraAdmin(admin.ModelAdmin):
    # Definimos qué columnas ver en la lista principal
    list_display = ('id_orden_compra', 'id_proveedor', 'id_estado_orden_compra', 'fecha_solicitud', 'fecha_entrega_estimada')
    # Filtros laterales para navegar rápido
    list_filter = ('id_estado_orden_compra', 'id_proveedor', 'fecha_solicitud')
    # Buscador por ID de orden o nombre del proveedor
    search_fields = ('id_orden_compra', 'id_proveedor__nombre')

@admin.register(OrdenCompraMateriaPrima)
class OrdenCompraMateriaPrimaAdmin(admin.ModelAdmin):
    list_display = ('id_orden_compra', 'id_materia_prima', 'cantidad')

@admin.register(OrdenCompraProduccion)
class OrdenCompraProduccionAdmin(admin.ModelAdmin):
    list_display = ('id_orden_compra', 'id_orden_produccion')