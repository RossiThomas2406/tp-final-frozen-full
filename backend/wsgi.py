import os
import sys
from django.core.wsgi import get_wsgi_application

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE", "backend.settings"
)  # Asegúrate de que coincida con el nombre de tu carpeta

# --- TRUCO MAGICO: Forzar ejecucion de migraciones en Render ---
try:
    import django

    django.setup()
    from django.core.management import call_command

    print("⏳ Ejecutando migraciones de base de datos en producción...")
    call_command("migrate", interactive=False)
    print("🚀 Migraciones finalizadas con éxito.")
except Exception as e:
    print(f"❌ Error al ejecutar migraciones automáticas: {str(e)}", file=sys.stderr)
# --------------------------------------------------------------

application = get_wsgi_application()
