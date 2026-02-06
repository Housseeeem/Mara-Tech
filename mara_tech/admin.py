from django.contrib import admin
from .models import User, Produit, Compte, HistBanque, Shopping


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'cin', 'bank_id')
    search_fields = ('nom', 'prenom', 'cin', 'bank_id')
    list_filter = ('type_maladie',)


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ('id_produit', 'prix')
    search_fields = ('id_produit',)


@admin.register(Compte)
class CompteAdmin(admin.ModelAdmin):
    list_display = ('bank_id', 'solde')
    search_fields = ('bank_id',)


@admin.register(HistBanque)
class HistBanqueAdmin(admin.ModelAdmin):
    list_display = ('id', 'bid_sender', 'bid_reciever', 'action', 'montant', 'time')
    search_fields = ('bid_sender', 'bid_reciever', 'action')
    list_filter = ('action', 'time')


@admin.register(Shopping)
class ShoppingAdmin(admin.ModelAdmin):
    list_display = ('id', 'produit', 'quantité', 'prix_totale', 'localisation')
    search_fields = ('localisation',)
    list_filter = ('produit',)
