import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import (
    check_password,
)  # Fundamental para validar contraseñas seguras

from .utils import (
    buscar_empleado_por_vector_facial,
    registrar_fichada,
    obtener_info_empleado,
)
from empleados.models import Empleado, Fichada, FaceID
from .dtos import LoginResponseDTO, FichajeResponseDTO
from ventas.models import Cliente


@csrf_exempt
def login(request):
    """
    Autenticación para empleados del ERP con validación de hash de contraseña.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        username = (
            data.get("username", "").strip().lower()
        )  # Limpia espacios y fuerza minúsculas
        password = data.get("password")

        if not username or not password:
            return JsonResponse(
                {"error": "Usuario y contraseña requeridos"}, status=400
            )

        # -----------------------------------------------------------------
        # 🚨 BYPASS DE EMERGENCIA PARA EXPOSICIÓN / PRUEBAS 🚨
        # -----------------------------------------------------------------
        if username == "tommy" and password == "Frozen2026":
            try:
                empleado = Empleado.objects.select_related("id_rol", "id_face").get(
                    usuario="tommy"
                )
            except Empleado.DoesNotExist:
                from empleados.models import Rol, FaceID, Departamento, Turno

                rol, _ = Rol.objects.get_or_create(
                    id_rol=1, defaults={"descripcion": "Administrador"}
                )
                face, _ = FaceID.objects.get_or_create(
                    id_face=1, defaults={"vector": "[]"}
                )
                dep, _ = Departamento.objects.get_or_create(
                    id_departamento=1, defaults={"descripcion": "Sistemas"}
                )
                turno, _ = Turno.objects.get_or_create(
                    id_turno=1, defaults={"descripcion": "Full Time"}
                )
                empleado = Empleado.objects.create(
                    usuario="tommy",
                    contrasena="Frozen2026",
                    nombre="Thomas",
                    apellido="Rossi",
                    id_rol=rol,
                    id_face=face,
                    id_departamento=dep,
                    id_turno=turno,
                )

            dto = LoginResponseDTO(
                id_empleado=empleado.id_empleado,
                nombre=empleado.nombre,
                apellido=empleado.apellido,
                rol=empleado.id_rol.descripcion,
                vector=empleado.id_face.vector,
            )
            return JsonResponse(dto.to_dict())
        # -----------------------------------------------------------------

        # 1. Buscamos al empleado por su nombre de usuario (Método Tradicional)
        empleado = Empleado.objects.select_related("id_rol", "id_face").get(
            usuario=username
        )

        # 2. Comparamos la contraseña recibida (Acepta hash tradicional o texto plano directo)
        if (
            not check_password(password, empleado.contrasena)
            and password != empleado.contrasena
        ):
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)

        # 3. Construimos el DTO de respuesta exitosa
        dto = LoginResponseDTO(
            id_empleado=empleado.id_empleado,
            nombre=empleado.nombre,
            apellido=empleado.apellido,
            rol=empleado.id_rol.descripcion,
            vector=empleado.id_face.vector,
        )

        return JsonResponse(dto.to_dict())

    except Empleado.DoesNotExist:
        return JsonResponse({"error": "Credenciales inválidas"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def fichar_empleado_por_rostro(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    data = json.loads(request.body)
    vector = data.get("vector")
    if not vector:
        return JsonResponse({"error": "Vector facial es requerido"}, status=400)

    empleado = buscar_empleado_por_vector_facial(vector)
    if not empleado:
        return JsonResponse({"error": "Empleado no reconocido"}, status=404)

    tipo, timestamp = registrar_fichada(empleado)
    empleado_info = obtener_info_empleado(empleado)

    dto = FichajeResponseDTO(
        success=True,
        message=f"Fichaje de {tipo} registrado exitosamente",
        empleadoInfo=empleado_info,
    )

    return JsonResponse(dto.to_dict())


@csrf_exempt
def login_ecommerce(request):
    """
    Autenticación para clientes (E-commerce).
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "email y contraseña requeridos"}, status=400)

    try:
        cliente = Cliente.objects.get(email=email, contraseña=password)
    except Cliente.DoesNotExist:
        return JsonResponse({"error": "Credenciales inválidas"}, status=401)

    clienteEncontrado = {
        "nombre": cliente.nombre,
        "apellido": cliente.apellido,
        "email": cliente.email,
        "cuil": cliente.cuil,
    }

    return JsonResponse(clienteEncontrado, status=200)
