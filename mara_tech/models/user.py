from django.db import models


class User(models.Model):
    """User table"""
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    cin = models.CharField(max_length=50, unique=True)
    bank_id = models.CharField(max_length=100, unique=True)
    type_maladie = models.CharField(max_length=100, blank=True, null=True)
    pwd = models.CharField(max_length=255)
    localisation = models.CharField(max_length=255, blank=True, null=True)
    face_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    def __str__(self):
        return f"{self.prenom} {self.nom}"