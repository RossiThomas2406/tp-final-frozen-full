import os
import sys
from django.core.wsgi import get_wsgi_application

try:
    import settings

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")
except ImportError:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django

django.setup()

# --- TRUCO DEFINITIVO SIN CAMPOS DUDOSAS ---
try:
    from django.contrib.auth.hashers import make_password
    from empleados.models import Empleado, Rol, FaceID

    # Buscamos o creamos la estructura mínima requerida por el DTO
    rol, _ = Rol.objects.get_or_create(
        id_rol=1, defaults={"descripcion": "Administrador"}
    )
    face, _ = FaceID.objects.get_or_create(id_face=1, defaults={"vector": "[]"})

    # Encriptamos la clave fija
    clave_encriptada = make_password("Frozen2026")

    # Creamos o actualizamos a 'tommy' solo con lo que pide el Login de views.py
    empleado, creado = Empleado.objects.get_or_create(
        usuario="tommy",
        defaults={
            "nombre": "Thomas",
            "apellido": "Rossi",
            "contrasena": clave_encriptada,
            "id_rol": rol,
            "id_face": face,
        },
    )

    if not creado:
        empleado.contrasena = clave_encriptada
        empleado.id_rol = rol
        empleado.id_face = face
        empleado.save()

    print("🚀 [WSGI] Usuario 'tommy' inyectado sin campos extras con éxito.")

except Exception as e:
    print(f"❌ [WSGI] Error inyectando usuario: {str(e)}", file=sys.stderr)
# ------------------------------------------------------------------------

application = get_wsgi_application()
