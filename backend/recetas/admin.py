from django.contrib import admin
from .models import Receta, RecetaMateriaPrima, ProductoLinea

# Permite agregar ingredientes directamente dentro de la pantalla de Receta
class RecetaMateriaPrimaInline(admin.TabularInline):
    model = RecetaMateriaPrima
    extra = 1

@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ('id_receta', 'id_producto', 'descripcion')
    search_fields = ('id_producto__nombre', 'descripcion')
    inlines = [RecetaMateriaPrimaInline]

@admin.register(ProductoLinea)
class ProductoLineaAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'id_linea_produccion', 'cant_por_hora', 'cantidad_minima')
    list_filter = ('id_linea_produccion', 'id_producto')
    search_fields = ('id_producto__nombre',)

@admin.register(RecetaMateriaPrima)
class RecetaMateriaPrimaAdmin(admin.ModelAdmin):
    list_display = ('id_receta', 'id_materia_prima', 'cantidad')
    list_filter = ('id_receta', 'id_materia_prima')