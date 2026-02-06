from django.db import models
from .produit import Produit


class Shopping(models.Model):
    """Shopping cart/transactions table"""
    id = models.AutoField(primary_key=True)
    localisation = models.CharField(max_length=255)
    quantité = models.IntegerField()
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    prix_totale = models.DecimalField(max_digits=15, decimal_places=2)
    
    def __str__(self):
        return f"Shopping {self.id} - Produit: {self.produit.id_produit} - Qty: {self.quantité}"
