"""Vision-quality assessment service (VLM + OpenCV fallback)."""

import base64
import json
import logging
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np

from ..exceptions import InvalidImageError

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class VisionResult:
    ok: bool
    score: float
    reason: str
    source: str
    model: str | None = None
    details: dict[str, float] | None = None

    def to_dict(self) -> dict[str, Any]:
        data = {"ok": self.ok, "score": self.score, "reason": self.reason, "source": self.source}
        if self.model:
            data["model"] = self.model
        if self.details:
            data["details"] = self.details
        return data


def decode_image(data_url: str) -> np.ndarray:
    if "," in data_url:
        _, data_url = data_url.split(",", 1)
    try:
        image_bytes = base64.b64decode(data_url)
    except (ValueError, TypeError) as exc:
        raise InvalidImageError("Base-64 decoding failed.") from exc

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise InvalidImageError("Image could not be decoded by OpenCV.")
    return image


def _normalize_data_url(image_data: str) -> str:
    return image_data if image_data.startswith("data:") else f"data:image/jpeg;base64,{image_data}"


def _build_openai_url(base_url: str) -> str:
    base_url = base_url.rstrip("/")
    return f"{base_url}/chat/completions" if base_url.endswith("/v1") else f"{base_url}/v1/chat/completions"


def _call_vlm(image_data: str, threshold: float | None) -> VisionResult | None:
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model = os.getenv("OPENAI_VISION_MODEL", "hosted_vllm/llava-1.5-7b-hf")

    if not api_key or not base_url:
        logger.debug("VLM not configured.")
        return None

    payload = {
        "model": model,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": "You are a vision quality assessment expert. Evaluate a user's vision capacity. Reply ONLY with strict JSON."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this image to assess vision capacity. Evaluate: 1. Eye condition 2. Lighting 3. Distance 4. Head position 5. Overall clarity. Return ONLY json with: score (0-100), ok (boolean, true if >= 60), reason (brief description)."},
                    {"type": "image_url", "image_url": {"url": _normalize_data_url(image_data)}},
                ],
            },
        ],
        "response_format": {"type": "json_object"},
    }

    request = urllib.request.Request(
        _build_openai_url(base_url),
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
            parsed = json.loads(data["choices"][0]["message"]["content"])
            score = float(parsed.get("score", 0.0))
            ok = score >= threshold if threshold is not None else bool(parsed.get("ok", False))
            return VisionResult(ok=ok, score=round(score, 2), reason=str(parsed.get("reason", "")), model=model, source="vlm")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.warning("VLM request failed: %s", exc)
        return None


_FACE_CASCADE = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")


def _assess_local(image: np.ndarray, threshold: float | None) -> VisionResult:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    sharpness_raw = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    normalized_sharpness = min(100.0, sharpness_raw / 5.0)

    brightness = float(cv2.mean(gray)[0])
    brightness_penalty = 30.0 if brightness < 50 else (15.0 if brightness < 80 else (10.0 if brightness > 200 else 0.0))
    
    contrast = float(cv2.meanStdDev(gray)[1][0])
    contrast_penalty = 20.0 if contrast < 20 else 0.0

    distance_penalty = 0.0
    reason_parts = []
    if brightness < 50:
        reason_parts.append("Éclairage très faible")
    elif brightness < 80:
        reason_parts.append("Éclairage faible")
    elif brightness > 200:
        reason_parts.append("Éclairage trop fort")
    if contrast < 20:
        reason_parts.append("Contraste faible")

    try:
        faces = cv2.CascadeClassifier(_FACE_CASCADE).detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        if len(faces) > 0:
            _, _, w, h = max(faces, key=lambda box: box[2] * box[3])
            face_ratio = float(w * h) / float(gray.shape[0] * gray.shape[1])
            if face_ratio > 0.45:
                distance_penalty = 30.0
                reason_parts.append("Trop proche de la caméra")
            elif face_ratio > 0.30:
                distance_penalty = 15.0
                reason_parts.append("Proche de la caméra")
    except Exception:
        pass

    score = max(0.0, min(100.0, normalized_sharpness - brightness_penalty - contrast_penalty - distance_penalty))
    effective_threshold = threshold if threshold is not None else 60.0
    
    return VisionResult(
        ok=score >= effective_threshold,
        score=round(score, 2),
        reason=" + ".join(reason_parts) if reason_parts else "Conditions visuelles correctes",
        source="fallback",
        details={"sharpness": round(normalized_sharpness, 2), "brightness": round(brightness, 2), "contrast": round(contrast, 2)},
    )


def assess_vision_quality(image_data: str, threshold: float | None = None) -> VisionResult:
    if vlm_result := _call_vlm(image_data, threshold):
        return vlm_result
    logger.info("VLM unavailable — using OpenCV fallback.")
    return _assess_local(decode_image(image_data), threshold)
