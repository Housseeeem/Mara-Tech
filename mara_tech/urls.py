"""
URL configuration for mara_tech project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/vision/quality/', views.vision_quality, name='vision-quality'),
    path('api/banking/transaction/', views.banking_transaction, name='banking-transaction'),
    path('api/banking/balance/', views.get_account_balance, name='account-balance'),
    path('api/banking/history/', views.get_transaction_history, name='transaction-history'),
    # Authentication (face recognition)
    path('api/auth/register/', views.register_user, name='register'),
    path('api/auth/login/', views.login_face_recognition, name='login'),
    path('api/auth/profile/<int:user_id>/', views.get_user_profile, name='profile'),
]
