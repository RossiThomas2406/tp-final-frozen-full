import os
import sys
from django.core.wsgi import get_wsgi_application

# Render busca las configuraciones desde la raíz, quitamos el prefijo 'backend.' si da error
# Probamos primero con 'settings' y si no, con el fallback estándar
try:
    import settings

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
except ImportError:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django

django.setup()

# --- TRUCO DEFINITIVO: Inyección directa sin usar comandos de consola ---
try:
    from django.contrib.auth.hashers import make_password
    from empleados.models import Empleado, Rol, FaceID

    # Buscamos o creamos la estructura mínima
    rol, _ = Rol.objects.get_or_create(
        id_rol=1, defaults={"descripcion": "Administrador"}
    )
    face, _ = FaceID.objects.get_or_create(id_face=1, defaults={"vector": "[]"})

    # Creamos o actualizamos a 'tommy'
    empleado, creado = Empleado.objects.get_or_create(
        usuario="tommy",
        defaults={
            "nombre": "Thomas",
            "apellido": "Rossi",
            "contrasena": make_password("Frozen2026"),
            "id_rol": rol,
            "id_face": face,
            "legajo": 12345,
            "dni": "12345678",
        },
    )

    if not creado:
        empleado.contrasena = make_password("Frozen2026")
        empleado.id_rol = rol
        empleado.id_face = face
        empleado.save()

    print("🚀 [WSGI] Usuario 'tommy' verificado y actualizado en producción con éxito.")

except Exception as e:
    print(f"❌ [WSGI] Error inyectando usuario: {str(e)}", file=sys.stderr)
# ------------------------------------------------------------------------

application = get_wsgi_application()
