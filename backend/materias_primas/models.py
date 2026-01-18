import math
from django.db import models
from productos.models import Unidad 

class TipoMateriaPrima(models.Model):
    id_tipo_materia_prima = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        db_table = "tipo_materia_prima"
    
    def __str__(self):
        return self.descripcion

class Proveedor(models.Model):
    id_proveedor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    contacto = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    lead_time_days = models.IntegerField(default=0)

    class Meta:
        db_table = "proveedor"
    
    def __str__(self):
        return self.nombre

class MateriaPrima(models.Model):
    id_materia_prima = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    id_tipo_materia_prima = models.ForeignKey(TipoMateriaPrima, on_delete=models.CASCADE, db_column="id_tipo_materia_prima")
    id_unidad = models.ForeignKey(Unidad, on_delete=models.CASCADE, db_column="id_unidad")
    umbral_minimo = models.IntegerField(default=0)
    id_proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, db_column="id_proveedor")
    cantidad_minima_pedido = models.IntegerField(default=1)

    def calcular_cantidad_a_pedir(self, cantidad_necesaria):
        if cantidad_necesaria <= 0:
            return 0
        if self.cantidad_minima_pedido <= 1:
            return cantidad_necesaria
        multiplos = math.ceil(cantidad_necesaria / self.cantidad_minima_pedido)
        return multiplos * self.cantidad_minima_pedido
    
    class Meta:
        db_table = "materia_prima"

    def __str__(self):
        return f"{self.nombre} ({self.id_unidad})"