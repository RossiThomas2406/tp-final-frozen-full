from django.contrib import admin
from .models import (
    Prioridad, EstadoVenta, Cliente, Reclamo, Sugerencia, 
    DireccionCliente, OrdenVenta, OrdenVentaProducto, Factura, NotaCredito
)

# Permitimos editar los productos de una venta dentro de la misma pantalla de OrdenVenta
class OrdenVentaProductoInline(admin.TabularInline):
    model = OrdenVentaProducto
    extra = 1

@admin.register(OrdenVenta)
class OrdenVentaAdmin(admin.ModelAdmin):
    list_display = ('id_orden_venta', 'id_cliente', 'fecha', 'id_estado_venta', 'tipo_venta', 'zona')
    list_filter = ('id_estado_venta', 'tipo_venta', 'zona', 'fecha')
    search_fields = ('id_orden_venta', 'id_cliente__nombre', 'id_cliente__apellido')
    inlines = [OrdenVentaProductoInline]
    date_hierarchy = 'fecha'

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id_cliente', 'apellido', 'nombre', 'email', 'cuil', 'id_prioridad')
    search_fields = ('apellido', 'nombre', 'email', 'cuil')
    list_filter = ('id_prioridad', 'localidad')

@admin.register(Reclamo)
class ReclamoAdmin(admin.ModelAdmin):
    list_display = ('id_reclamo', 'id_cliente', 'titulo', 'estado', 'fecha_reclamo')
    list_filter = ('estado', 'fecha_reclamo')
    search_fields = ('titulo', 'id_cliente__apellido')

@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('id_factura', 'id_orden_venta')

@admin.register(NotaCredito)
class NotaCreditoAdmin(admin.ModelAdmin):
    list_display = ('id_nota_credito', 'id_factura', 'fecha')

# Registros simples para tablas maestras
admin.site.register(Prioridad)
admin.site.register(EstadoVenta)
admin.site.register(Sugerencia)
admin.site.register(DireccionCliente)