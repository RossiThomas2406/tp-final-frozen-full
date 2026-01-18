from django.contrib import admin
from .models import TipoMateriaPrima, Proveedor, MateriaPrima

@admin.register(MateriaPrima)
class MateriaPrimaAdmin(admin.ModelAdmin):
    # Columnas principales para vista rápida
    list_display = ('nombre', 'id_tipo_materia_prima', 'precio', 'id_unidad', 'id_proveedor', 'umbral_minimo')
    # Filtros para navegar por tipo de insumo o proveedor
    list_filter = ('id_tipo_materia_prima', 'id_proveedor', 'id_unidad')
    # Buscador por nombre de materia prima o nombre del proveedor
    search_fields = ('nombre', 'id_proveedor__nombre')

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'contacto', 'telefono', 'email', 'lead_time_days')
    search_fields = ('nombre', 'contacto')

@admin.register(TipoMateriaPrima)
class TipoMateriaPrimaAdmin(admin.ModelAdmin):
    list_display = ('id_tipo_materia_prima', 'descripcion')