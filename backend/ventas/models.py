from django.db import models
from productos.models import Producto
from simple_history.models import HistoricalRecords

class Prioridad(models.Model):
    id_prioridad = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        db_table = "prioridad"
    
    def __str__(self):
        return self.descripcion

class EstadoVenta(models.Model):
    id_estado_venta = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        db_table = "estado_venta"
    
    def __str__(self):
        return self.descripcion

class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100, null=True, blank=True)
    email = models.CharField(max_length=100, unique=True, null=True, blank=True)
    cuil = models.CharField(max_length=100, unique=True, null=True, blank=True)
    contraseña = models.CharField(max_length=128, null=True, blank=True)
    id_prioridad = models.ForeignKey(Prioridad, on_delete=models.SET_NULL, null=True, blank=True, db_column="id_prioridad")
    calle = models.CharField(max_length=255, null=True, blank=True)
    altura = models.CharField(max_length=20, null=True, blank=True)
    localidad = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = "cliente"
    
    def __str__(self):
        return f"{self.apellido}, {self.nombre}" if self.apellido else self.nombre

class Reclamo(models.Model):
    id_reclamo = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column="id_cliente")
    fecha_reclamo = models.DateTimeField(auto_now_add=True)
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    estado = models.CharField(max_length=50, default="Abierto")

    class Meta:
        db_table = "reclamo"
    
    def __str__(self):
        return f"Reclamo #{self.id_reclamo} - {self.titulo}"

class Sugerencia(models.Model):
    id_sugerencia = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column="id_cliente")
    titulo = models.CharField(max_length=100)
    fecha_sugerencia = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()

    class Meta:
        db_table = "sugerencia"
    
    def __str__(self):
        return self.titulo

class DireccionCliente(models.Model):
    id_direccion_cliente = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column="id_cliente", related_name="direcciones")
    calle = models.CharField(max_length=200)
    altura = models.CharField(max_length=50)
    localidad = models.CharField(max_length=100, null=True, blank=True)
    zona = models.CharField(max_length=10, null=True, blank=True)
    
    class Meta:
        db_table = "direccion_cliente"
    
    def __str__(self):
        return f"{self.calle} {self.altura}, {self.localidad}"

class OrdenVenta(models.Model):
    class TipoVenta(models.TextChoices):
        EMPLEADO = 'EMP', ('Empleado')
        ONLINE = 'ONL', ('Online')

    class TipoZona(models.TextChoices):
        NORTE = 'N', ('Norte')
        SUR = 'S', ('Sur')
        ESTE = 'E', ('Este')
        OESTE = 'O', ('Oeste')

    id_orden_venta = models.AutoField(primary_key=True)
    fecha = models.DateTimeField(auto_now_add=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column="id_cliente")
    id_estado_venta = models.ForeignKey(EstadoVenta, on_delete=models.CASCADE, db_column="id_estado_venta")
    id_prioridad = models.ForeignKey(Prioridad, on_delete=models.CASCADE, db_column="id_prioridad")
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    fecha_estimada = models.DateField(null=True, blank=True)
    fecha_entrega_planificada = models.DateTimeField(blank=True, null=True)
    id_empleado = models.ForeignKey('empleados.Empleado', on_delete=models.SET_NULL, null=True, blank=True, db_column='id_empleado')
    tipo_venta = models.CharField(max_length=3, choices=TipoVenta.choices, default=TipoVenta.EMPLEADO)
    calle = models.CharField(max_length=200, null=True, blank=True)
    altura = models.CharField(max_length=50, null=True, blank=True)
    localidad = models.CharField(max_length=100, null=True, blank=True)
    zona = models.CharField(max_length=10, choices=TipoZona.choices, null=True, blank=True)
    
    history = HistoricalRecords()

    class Meta:
        db_table = "orden_venta"
    
    def __str__(self):
        return f"OV-{self.id_orden_venta} | {self.id_cliente}"

class OrdenVentaProducto(models.Model):
    id_orden_venta_producto = models.AutoField(primary_key=True)
    id_orden_venta = models.ForeignKey(OrdenVenta, on_delete=models.CASCADE, db_column="id_orden_venta", related_name="detalles")
    id_producto = models.ForeignKey(Producto, on_delete=models.CASCADE, db_column="id_producto")
    cantidad = models.IntegerField()

    class Meta:
        db_table = "orden_venta_producto"
        unique_together = (("id_orden_venta", "id_producto"),)
    
    def __str__(self):
        return f"{self.id_producto} (x{self.cantidad})"

class Factura(models.Model):
    id_factura = models.AutoField(primary_key=True)
    id_orden_venta = models.OneToOneField(OrdenVenta, on_delete=models.CASCADE, db_column="id_orden_venta")

    class Meta:
        db_table = "factura"
    
    def __str__(self):
        return f"FACTURA-{self.id_factura} (OV-{self.id_orden_venta_id})"

class NotaCredito(models.Model):
    id_nota_credito = models.AutoField(primary_key=True)
    id_factura = models.OneToOneField(Factura, on_delete=models.CASCADE, db_column="id_factura")
    fecha = models.DateTimeField(auto_now_add=True)
    motivo = models.TextField(blank=True, null=True)

    history = HistoricalRecords()
    class Meta:
        db_table = "nota_credito"

    def __str__(self):
        return f"NC-{self.id_nota_credito} (Factura: {self.id_factura.id_factura})"