from django.urls import path
from .shopping_api import chat

urlpatterns = [
    path('chat/', chat, name='shopping_chat'),
]