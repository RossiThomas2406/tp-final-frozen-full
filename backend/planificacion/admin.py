from django.contrib import admin
from django.apps import apps
from .models import *

# Obtiene todos los modelos definidos en esta aplicación específica
app_config = apps.get_app_config('planificacion') # Ej: 'productos' o 'ventas'
modelos = app_config.get_models()

for modelo in modelos:
    try:
        admin.site.register(modelo)
    except admin.sites.AlreadyRegistered:
        pass