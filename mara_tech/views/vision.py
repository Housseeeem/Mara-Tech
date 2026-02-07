"""Vision-quality API views."""

import json
import logging

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from ..exceptions import MaraTechError
from ..services.vision_service import assess_vision_quality
from ..validators import validate_image_payload

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def vision_quality(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    try:
        image_data, threshold = validate_image_payload(payload)
        result = assess_vision_quality(image_data, threshold)
        return JsonResponse(result.to_dict())
    except MaraTechError as exc:
        logger.warning("Vision quality check failed: %s", exc.message)
        return JsonResponse({"error": exc.message}, status=exc.status_code)
