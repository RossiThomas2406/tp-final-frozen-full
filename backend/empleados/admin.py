from django.contrib import admin
from .models import Departamento, Rol, Turno, FaceID, Empleado, Fichada, Permiso, RolPermiso

@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ('id_empleado', 'apellido', 'nombre', 'usuario', 'id_rol', 'id_departamento')
    list_filter = ('id_rol', 'id_departamento', 'id_turno')
    search_fields = ('apellido', 'nombre', 'usuario')

@admin.register(Fichada)
class FichadaAdmin(admin.ModelAdmin):
    list_display = ('id_fichada', 'id_empleado', 'fecha', 'hora_entrada', 'hora_salida')
    list_filter = ('fecha', 'id_empleado')

@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'link')

# Registramos los básicos de forma directa
admin.site.register(Departamento)
admin.site.register(Rol)
admin.site.register(Turno)
admin.site.register(FaceID)
admin.site.register(RolPermiso)