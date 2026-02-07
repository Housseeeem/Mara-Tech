import base64
import json
import os
import urllib.error
import urllib.request

import cv2
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


def _decode_image(data_url: str) -> np.ndarray | None:
    if "," in data_url:
        _, data_url = data_url.split(",", 1)
    try:
        image_bytes = base64.b64decode(data_url)
    except (ValueError, TypeError):
        return None

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    return cv2.imdecode(image_array, cv2.IMREAD_COLOR)


def _normalize_data_url(image_data: str) -> str:
    if image_data.startswith("data:"):
        return image_data
    return f"data:image/jpeg;base64,{image_data}"


def _build_openai_url(base_url: str) -> str:
    base_url = base_url.rstrip("/")
    if base_url.endswith("/v1"):
        return f"{base_url}/chat/completions"
    return f"{base_url}/v1/chat/completions"


def _call_vlm_quality(image_data: str, threshold: float | None) -> dict[str, object] | None:
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model = os.getenv("OPENAI_VISION_MODEL", "hosted_vllm/llava-1.5-7b-hf")

    if not api_key or not base_url:
        return None

    payload = {
        "model": model,
        "temperature": 0,
        "messages": [
            {
                "role": "system",
                "content": "You are an image quality inspector. Reply ONLY with strict JSON.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Evaluate image quality for readability/clarity. "
                            "Return JSON with keys: score (0-100 number), ok (boolean), reason (short string)."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": _normalize_data_url(image_data)},
                    },
                ],
            },
        ],
        "response_format": {"type": "json_object"},
    }

    request = urllib.request.Request(
        _build_openai_url(base_url),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError:
        return None
    except (urllib.error.URLError, TimeoutError):
        return None

    try:
        data = json.loads(response_body)
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError):
        return None

    score = float(parsed.get("score", 0.0))
    ok = bool(parsed.get("ok", False))
    reason = str(parsed.get("reason", ""))

    if threshold is not None:
        ok = score >= threshold

    return {
        "ok": ok,
        "score": round(score, 2),
        "reason": reason,
        "model": model,
        "source": "vlm",
    }


@csrf_exempt
@require_POST
def vision_quality(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    image_data = payload.get("image")
    if not image_data:
        return JsonResponse({"error": "Missing image"}, status=400)

    threshold = payload.get("threshold")
    threshold_value = float(threshold) if threshold is not None else None

    ai_result = _call_vlm_quality(image_data, threshold_value)
    if ai_result is not None:
        return JsonResponse(ai_result)

    image = _decode_image(image_data)
    if image is None:
        return JsonResponse({"error": "Invalid image data"}, status=400)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    fallback_threshold = threshold_value if threshold_value is not None else 120.0
    is_normal = score >= fallback_threshold

    return JsonResponse(
        {"ok": is_normal, "score": round(score, 2), "reason": "fallback", "source": "fallback"}
    )
