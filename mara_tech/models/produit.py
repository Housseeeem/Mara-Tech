from django.db import models


class Produit(models.Model):
    """Produit table"""
    id_produit = models.AutoField(primary_key=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"Produit {self.id_produit} - {self.prix}"
