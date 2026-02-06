from django.db import models
from .user import User


class Compte(models.Model):
    """Compte (Account) table"""
    bank_id = models.OneToOneField(User, on_delete=models.CASCADE, to_field='bank_id', primary_key=True)
    solde = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    def __str__(self):
        return f"Compte {self.bank_id} - Solde: {self.solde}"
