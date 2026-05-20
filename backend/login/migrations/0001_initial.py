from django.db import migrations
from django.contrib.auth.hashers import make_password


def crear_empleado_produccion(apps, schema_editor):
    # Conseguimos los modelos de forma segura a través del historial de Django
    Empleado = apps.get_model("empleados", "Empleado")
    Rol = apps.get_model("empleados", "Rol")
    FaceID = apps.get_model("empleados", "FaceID")

    # Buscamos o creamos el rol básico
    rol_existente = Rol.objects.first()
    if not rol_existente:
        rol_existente = Rol.objects.create(descripcion="Administrador")

    # Buscamos o creamos el FaceID vacío
    face_ficticio, _ = FaceID.objects.get_or_create(
        id_face=1, defaults={"vector": "[]"}
    )
    clave_encriptada = make_password("Frozen2026")

    # Buscamos o creamos el usuario 'tommy'
    empleado, creado = Empleado.objects.get_or_create(
        usuario="tommy",
        defaults={
            "nombre": "Thomas",
            "apellido": "Rossi",
            "contrasena": clave_encriptada,
            "id_rol": rol_existente,
            "id_face": face_ficticio,
            "legajo": 12345,
            "dni": "12345678",
        },
    )

    if not creado:
        empleado.contrasena = clave_encriptada
        empleado.id_rol = rol_existente
        empleado.id_face = face_ficticio
        empleado.save()


class Migration(migrations.Migration):

    dependencies = [
        # Esto le dice a Django que primero use las migraciones iniciales de login y empleados
        ("login", "0001_initial"),
        ("empleados", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(crear_empleado_produccion),
    ]
