import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password  # Fundamental para validar contraseñas seguras

from .utils import buscar_empleado_por_vector_facial, registrar_fichada, obtener_info_empleado
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
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "Usuario y contraseña requeridos"}, status=400)

        # 1. Buscamos al empleado por su nombre de usuario
        # Usamos select_related para traer los datos del Rol y FaceID en una sola consulta
        empleado = Empleado.objects.select_related("id_rol", "id_face").get(usuario=username)

        # 2. Comparamos la contraseña recibida con el hash almacenado en la BD
        if not check_password(password, empleado.contrasena):
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
        empleadoInfo=empleado_info
    )

    return JsonResponse(dto.to_dict())

@csrf_exempt
def login_ecommerce(request):
    """
    Autenticación para clientes (E-commerce).
    Nota: Se recomienda aplicar check_password aquí también si se encriptan clientes.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "email y contraseña requeridos"}, status=400)

    try:
        # Nota: Aquí se usa comparación directa según tu código original
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