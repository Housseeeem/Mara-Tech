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
    is_blind: bool = False
    model: str | None = None
    details: dict[str, float] | None = None

    def to_dict(self) -> dict[str, Any]:
        data = {"ok": self.ok, "score": self.score, "reason": self.reason, "source": self.source, "is_blind": self.is_blind}
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
            {"role": "system", "content": "You are an expert at detecting if a person is blind, has closed eyes, or wears dark sunglasses. You MUST be very strict about this."},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": """Analyze this person's eyes very carefully. Follow these steps:

STEP 1: Look at the eyelids. Are they OPEN or CLOSED?
- If you see the white part of the eyes (sclera) and pupils → eyes are OPEN
- If you only see eyelids covering everything → eyes are CLOSED

STEP 2: Look for sunglasses or very dark glasses
- Are they wearing dark/black sunglasses that hide the eyes?

STEP 3: Determine is_blind
- Set is_blind = TRUE if ANY of these:
  * Eyes are CLOSED (eyelids covering eyes)
  * Wearing very dark/black sunglasses
  * Person appears to be blind
- Set is_blind = FALSE only if eyes are clearly OPEN and visible

EXAMPLES:
- Closed eyelids → is_blind: true, reason: "Eyes are closed"
- Dark sunglasses → is_blind: true, reason: "Wearing dark sunglasses"
- Open eyes visible → is_blind: false, reason: "Eyes are open and visible"

Return ONLY this JSON format:
{"score": 0-100, "ok": true/false, "is_blind": true/false, "reason": "what you see"}

BE VERY CAREFUL: If you cannot clearly see open eyes with pupils visible, set is_blind to TRUE."""},
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
            is_blind = bool(parsed.get("is_blind", False))
            logger.info(f"VLM Response: score={score}, is_blind={is_blind}, reason={parsed.get('reason', '')}")
            return VisionResult(ok=ok, score=round(score, 2), reason=str(parsed.get("reason", "")), model=model, source="vlm", is_blind=is_blind)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.warning("VLM request failed: %s", exc)
        return None


_FACE_CASCADE = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
_EYE_CASCADE = os.path.join(cv2.data.haarcascades, "haarcascade_eye.xml")


def _assess_local(image: np.ndarray, threshold: float | None) -> VisionResult:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    sharpness_raw = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    normalized_sharpness = min(100.0, sharpness_raw / 5.0)

    brightness = float(cv2.mean(gray)[0])
    brightness_penalty = 30.0 if brightness < 50 else (15.0 if brightness < 80 else (10.0 if brightness > 200 else 0.0))
    
    contrast = float(cv2.meanStdDev(gray)[1][0])
    contrast_penalty = 20.0 if contrast < 20 else 0.0

    distance_penalty = 0.0
    is_blind = False
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
        face_cascade = cv2.CascadeClassifier(_FACE_CASCADE)
        eye_cascade = cv2.CascadeClassifier(_EYE_CASCADE)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        
        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda box: box[2] * box[3])
            face_ratio = float(w * h) / float(gray.shape[0] * gray.shape[1])
            if face_ratio > 0.45:
                distance_penalty = 30.0
                reason_parts.append("Trop proche de la caméra")
            elif face_ratio > 0.30:
                distance_penalty = 15.0
                reason_parts.append("Proche de la caméra")
            
            # Detect eyes in the face region with stricter parameters
            roi_gray = gray[y:y+h, x:x+w]
            roi_color = image[y:y+h, x:x+w]
            
            # First attempt: strict detection for open eyes
            eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.05, minNeighbors=8, minSize=(25, 25))
            
            # Second attempt: more lenient if no eyes found
            if len(eyes) == 0:
                eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=5, minSize=(20, 20))
            
            # Analyze eye region for closed eyes detection
            eye_region_top = roi_gray[int(h*0.25):int(h*0.6), :]  # Upper half where eyes should be
            
            # Use edge detection to find eye contours
            edges = cv2.Canny(eye_region_top, 50, 150)
            edge_density = float(cv2.countNonZero(edges)) / float(eye_region_top.size)
            
            # If very few eyes detected (0 or 1) and low edge density, likely closed
            if len(eyes) <= 1 and edge_density < 0.02:
                is_blind = True
                reason_parts.append("Yeux fermés détectés (faible densité de contours)")
            elif len(eyes) == 0:
                is_blind = True
                reason_parts.append("Yeux non détectés (possiblement fermés ou lunettes noires)")
            else:
                # Check for very dark regions (potential dark sunglasses)
                dark_eye_count = 0
                for (ex, ey, ew, eh) in eyes:
                    eye_region = roi_gray[ey:ey+eh, ex:ex+ew]
                    eye_brightness = float(cv2.mean(eye_region)[0])
                    # Very dark eye regions suggest dark sunglasses
                    if eye_brightness < 40:
                        dark_eye_count += 1
                
                # If most detected eyes are very dark
                if dark_eye_count >= len(eyes) * 0.5:
                    is_blind = True
                    reason_parts.append("Lunettes noires détectées")
    except Exception:
        pass

    score = max(0.0, min(100.0, normalized_sharpness - brightness_penalty - contrast_penalty - distance_penalty))
    effective_threshold = threshold if threshold is not None else 60.0
    
    return VisionResult(
        ok=score >= effective_threshold,
        score=round(score, 2),
        reason=" + ".join(reason_parts) if reason_parts else "Conditions visuelles correctes",
        source="fallback",
        is_blind=is_blind,
        details={"sharpness": round(normalized_sharpness, 2), "brightness": round(brightness, 2), "contrast": round(contrast, 2)},
    )


def assess_vision_quality(image_data: str, threshold: float | None = None) -> VisionResult:
    if vlm_result := _call_vlm(image_data, threshold):
        return vlm_result
    logger.info("VLM unavailable — using OpenCV fallback.")
    return _assess_local(decode_image(image_data), threshold)
