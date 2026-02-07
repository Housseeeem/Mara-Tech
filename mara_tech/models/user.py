from django.db import models


class User(models.Model):
    """User table – inclut les champs pour la reconnaissance faciale."""
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    cin = models.CharField(max_length=50, unique=True)
    bank_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    type_maladie = models.CharField(max_length=100, blank=True, null=True)
    pwd = models.CharField(max_length=255, blank=True, default="")
    localisation = models.CharField(max_length=255, blank=True, null=True)
    face_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    # Reconnaissance faciale (DeepFace)
    face_encoding = models.JSONField(null=True, blank=True)
    face_image = models.TextField(null=True, blank=True)

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "user"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.prenom} {self.nom}"