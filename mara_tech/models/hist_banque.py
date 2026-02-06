from django.db import models
from .user import User


class HistBanque(models.Model):
    """Banking history table"""
    id = models.AutoField(primary_key=True)
    bid_sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions_sent', to_field='bank_id')
    bid_reciever = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions_received', to_field='bank_id')
    action = models.CharField(max_length=100)
    time = models.DateTimeField(auto_now_add=True)
    montant = models.DecimalField(max_digits=15, decimal_places=2)
    
    def __str__(self):
        return f"{self.action} - {self.montant} - {self.time}"
