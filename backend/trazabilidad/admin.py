from django.contrib import admin
from .models import Configuracion

@admin.register(Configuracion)
class ConfiguracionAdmin(admin.ModelAdmin):
    # Columnas claras para identificar la variable y su uso
    list_display = ('nombre_clave', 'valor', 'tipo_dato', 'descripcion')
    # Buscador por nombre de clave para acceso rápido
    search_fields = ('nombre_clave', 'descripcion')
    # Filtro por tipo de dato para agrupar variables similares
    list_filter = ('tipo_dato',)