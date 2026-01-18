from django.contrib import admin
from .models import (
    EstadoLoteProduccion, EstadoLoteMateriaPrima, LoteProduccion, 
    LoteMateriaPrima, LoteProduccionMateria, EstadoReserva, 
    ReservaStock, EstadoReservaMateria, ReservaMateriaPrima
)

@admin.register(LoteProduccion)
class LoteProduccionAdmin(admin.ModelAdmin):
    list_display = ('id_lote_produccion', 'id_producto', 'cantidad', 'get_reservada', 'get_disponible', 'fecha_vencimiento', 'id_estado_lote_produccion')
    list_filter = ('id_estado_lote_produccion', 'id_producto', 'fecha_vencimiento')
    search_fields = ('id_lote_produccion', 'id_producto__nombre')

    # Funciones para mostrar los campos calculados (@property) en el Admin
    def get_reservada(self, obj):
        return obj.cantidad_reservada
    get_reservada.short_description = 'Reservado'

    def get_disponible(self, obj):
        return obj.cantidad_disponible
    get_disponible.short_description = 'Disponible'

@admin.register(LoteMateriaPrima)
class LoteMateriaPrimaAdmin(admin.ModelAdmin):
    list_display = ('id_lote_materia_prima', 'id_materia_prima', 'cantidad', 'get_reservada', 'get_disponible', 'fecha_vencimiento')
    list_filter = ('id_materia_prima', 'fecha_vencimiento')

    def get_reservada(self, obj):
        return obj.cantidad_reservada
    get_reservada.short_description = 'Reservado'

    def get_disponible(self, obj):
        return obj.cantidad_disponible
    get_disponible.short_description = 'Disponible'

@admin.register(ReservaStock)
class ReservaStockAdmin(admin.ModelAdmin):
    list_display = ('id_reserva', 'id_lote_produccion', 'cantidad_reservada', 'id_estado_reserva', 'fecha_reserva')
    list_filter = ('id_estado_reserva',)

@admin.register(ReservaMateriaPrima)
class ReservaMateriaPrimaAdmin(admin.ModelAdmin):
    list_display = ('id_reserva_materia', 'id_lote_materia_prima', 'cantidad_reservada', 'id_estado_reserva_materia')

# Registros simples
admin.site.register(EstadoLoteProduccion)
admin.site.register(EstadoLoteMateriaPrima)
admin.site.register(LoteProduccionMateria)
admin.site.register(EstadoReserva)
admin.site.register(EstadoReservaMateria)