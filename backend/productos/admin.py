from django.contrib import admin
from .models import TipoProducto, Unidad, Producto, ImagenProducto, Combo, ComboProducto, ImagenCombo

# --- Configuración de Inlines ---
class ImagenProductoInline(admin.TabularInline):
    model = ImagenProducto
    extra = 1

class ComboProductoInline(admin.TabularInline):
    model = ComboProducto
    extra = 1

class ImagenComboInline(admin.TabularInline):
    model = ImagenCombo
    extra = 1

# --- Configuración de Admins ---

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('id_producto', 'nombre', 'precio', 'id_tipo_producto', 'id_unidad', 'umbral_minimo')
    list_filter = ('id_tipo_producto', 'id_unidad')
    search_fields = ('nombre', 'descripcion')
    inlines = [ImagenProductoInline]

@admin.register(Combo)
class ComboAdmin(admin.ModelAdmin):
    list_display = ('id_combo', 'nombre', 'precio')
    search_fields = ('nombre',)
    inlines = [ComboProductoInline, ImagenComboInline]

# --- Registros Simples ---
admin.site.register(TipoProducto)
admin.site.register(Unidad)
admin.site.register(ImagenProducto)
admin.site.register(ComboProducto)
admin.site.register(ImagenCombo)