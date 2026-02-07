"""Authentication API views – register, login (face recognition), profile."""

import json
import logging

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from ..exceptions import MaraTechError
from ..services import auth_service

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def register_user(request: HttpRequest) -> JsonResponse:
    """Inscription avec reconnaissance faciale via DeepFace."""
    try:
        data = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.error("JSON decode error: %s", exc)
        return JsonResponse({"error": "JSON invalide."}, status=400)

    try:
        result = auth_service.register_user(data)
        return JsonResponse(result.to_dict(), status=201)
    except MaraTechError as exc:
        logger.warning("Registration failed: %s", exc.message)
        return JsonResponse({"error": exc.message}, status=exc.status_code)
    except Exception as exc:
        logger.exception("Unexpected error during registration")
        return JsonResponse({"error": f"Erreur serveur: {str(exc)}"}, status=500)


@csrf_exempt
@require_POST
def login_face_recognition(request: HttpRequest) -> JsonResponse:
    """Connexion via reconnaissance faciale."""
    try:
        data = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "JSON invalide."}, status=400)

    face_image = data.get("face_image")
    if not face_image:
        return JsonResponse({"error": "Image requise."}, status=400)

    try:
        result = auth_service.login_face(face_image)
        return JsonResponse(result.to_dict())
    except MaraTechError as exc:
        logger.warning("Login failed: %s", exc.message)
        return JsonResponse({"error": exc.message}, status=exc.status_code)
    except Exception as exc:
        logger.exception("Unexpected login error")
        return JsonResponse({"error": str(exc)}, status=500)


@csrf_exempt
@require_GET
def get_user_profile(request: HttpRequest, user_id: int) -> JsonResponse:
    """Récupérer le profil d'un utilisateur."""
    try:
        result = auth_service.get_profile(user_id)
        return JsonResponse(result.to_dict())
    except MaraTechError as exc:
        return JsonResponse({"error": exc.message}, status=exc.status_code)
