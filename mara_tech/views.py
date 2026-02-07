import base64
import json
import os
import urllib.error
import urllib.request
from decimal import Decimal

import cv2
import numpy as np
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import transaction as db_transaction

from .models import User, Compte, HistBanque


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
                "content": "You are a vision quality assessment expert. Evaluate a user's vision capacity based on their face/eyes in the image. Reply ONLY with strict JSON.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Analyze this image to assess the user's vision capacity. Evaluate:\n"
                            "1. Eye condition: Are eyes open, alert, clear? (Red eyes, squinting, half-closed = lower score)\n"
                            "2. Lighting: Is there sufficient, even lighting? (Too dark, shadows on face = lower score)\n"
                            "3. Distance: Is user at proper distance from camera? (Too close, too far = lower score)\n"
                            "4. Head position: Is head at good angle? (Tilted, turned away = lower score)\n"
                            "5. Overall clarity: Can you see the user's face clearly?\n\n"
                            "Return ONLY json with:\n"
                            "- score (0-100): Vision quality/capacity score\n"
                            "- ok (boolean): true if score >= 60 (good vision conditions), false if < 60\n"
                            "- reason (string): Brief description of limiting factors (e.g., 'Red eyes + poor lighting' or 'Excellent lighting, alert eyes')"
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
    
    # Evaluate multiple factors for vision quality
    # 1. Sharpness (Laplacian variance)
    sharpness_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    
    # 2. Brightness - check if image is too dark or too bright
    brightness = float(cv2.mean(gray)[0])  # Average brightness 0-255
    brightness_penalty = 0
    reason_parts = []
    
    if brightness < 50:
        brightness_penalty = 30  # Very dark image = low vision
        reason_parts.append("Éclairage très faible")
    elif brightness < 80:
        brightness_penalty = 15  # Dark image = some penalty
        reason_parts.append("Éclairage faible")
    elif brightness > 200:
        brightness_penalty = 10  # Very bright = some penalty
        reason_parts.append("Éclairage trop fort")
    
    # 3. Contrast - standard deviation of brightness
    contrast = float(cv2.meanStdDev(gray)[1][0])  # Standard deviation
    contrast_penalty = 0
    
    if contrast < 20:
        contrast_penalty = 20  # Very low contrast = poor visibility
        reason_parts.append("Contraste faible")
    
    # Combine scores
    # Normalize sharpness to 0-100 scale (Laplacian typically 0-500+)
    normalized_sharpness = min(100, (sharpness_score / 5))
    
    # Final score = weighted combination
    score = normalized_sharpness - brightness_penalty - contrast_penalty
    score = max(0, min(100, score))  # Clamp to 0-100
    
    fallback_threshold = threshold_value if threshold_value is not None else 60.0
    is_normal = score >= fallback_threshold
    
    reason = " + ".join(reason_parts) if reason_parts else "Conditions visuelles correctes"

    return JsonResponse(
        {
            "ok": is_normal, 
            "score": round(score, 2), 
            "reason": reason, 
            "source": "fallback",
            "details": {
                "sharpness": round(normalized_sharpness, 2),
                "brightness": round(brightness, 2),
                "contrast": round(contrast, 2)
            }
        }
    )


@csrf_exempt
@require_POST
def banking_transaction(request):
    """
    Handle voice-initiated banking transactions
    Creates a new transaction record in PostgreSQL
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    # Extract transaction data
    sender_bank_id = payload.get("sender_bank_id")
    recipient_name = payload.get("recipient")
    amount = payload.get("amount")
    description = payload.get("description")

    # Validate required fields
    if not all([sender_bank_id, recipient_name, amount, description]):
        return JsonResponse(
            {"error": "Missing required fields: sender_bank_id, recipient, amount, description"},
            status=400
        )

    try:
        amount = Decimal(str(amount))
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid amount format"}, status=400)

    if amount <= 0:
        return JsonResponse({"error": "Amount must be positive"}, status=400)

    try:
        # Use database transaction for atomicity
        with db_transaction.atomic():
            # Get sender user
            try:
                sender = User.objects.get(bank_id=sender_bank_id)
            except User.DoesNotExist:
                return JsonResponse({"error": "Sender account not found"}, status=404)

            # Get sender's account
            try:
                sender_compte = Compte.objects.get(bank_id=sender)
            except Compte.DoesNotExist:
                return JsonResponse({"error": "Sender account details not found"}, status=404)

            # Check sufficient balance
            if sender_compte.solde < amount:
                return JsonResponse(
                    {
                        "error": "Insufficient funds",
                        "current_balance": float(sender_compte.solde),
                        "requested_amount": float(amount)
                    },
                    status=400
                )

            # Try to find recipient by name (simplified - in production use more robust matching)
            recipient_users = User.objects.filter(
                nom__icontains=recipient_name.split()[-1] if ' ' in recipient_name else recipient_name
            )

            if not recipient_users.exists():
                # Create a simulated recipient for demo purposes
                # In production, this should be handled differently
                return JsonResponse(
                    {"error": f"Recipient '{recipient_name}' not found in system"},
                    status=404
                )

            recipient = recipient_users.first()

            # Update sender balance
            sender_compte.solde -= amount
            sender_compte.save()

            # Update recipient balance
            try:
                recipient_compte = Compte.objects.get(bank_id=recipient)
                recipient_compte.solde += amount
                recipient_compte.save()
            except Compte.DoesNotExist:
                # Rollback will happen automatically
                return JsonResponse({"error": "Recipient account not found"}, status=404)

            # Create transaction history record
            hist_entry = HistBanque.objects.create(
                bid_sender=sender,
                bid_reciever=recipient,
                action=description,
                montant=amount
            )

            return JsonResponse({
                "success": True,
                "transaction_id": hist_entry.id,
                "sender": sender.prenom + " " + sender.nom,
                "recipient": recipient.prenom + " " + recipient.nom,
                "amount": float(amount),
                "description": description,
                "new_balance": float(sender_compte.solde),
                "timestamp": hist_entry.time.isoformat()
            })

    except Exception as e:
        return JsonResponse({"error": f"Transaction failed: {str(e)}"}, status=500)


@csrf_exempt
def get_account_balance(request):
    """Get account balance for a given bank_id"""
    bank_id = request.GET.get("bank_id")
    
    if not bank_id:
        return JsonResponse({"error": "bank_id parameter required"}, status=400)
    
    try:
        user = User.objects.get(bank_id=bank_id)
        compte = Compte.objects.get(bank_id=user)
        
        return JsonResponse({
            "bank_id": bank_id,
            "balance": float(compte.solde),
            "account_holder": f"{user.prenom} {user.nom}"
        })
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Compte.DoesNotExist:
        return JsonResponse({"error": "Account not found"}, status=404)


@csrf_exempt
def get_transaction_history(request):
    """Get transaction history for a given bank_id"""
    bank_id = request.GET.get("bank_id")
    
    if not bank_id:
        return JsonResponse({"error": "bank_id parameter required"}, status=400)
    
    try:
        user = User.objects.get(bank_id=bank_id)
        
        # Get transactions where user is sender or receiver
        sent_transactions = HistBanque.objects.filter(bid_sender=user).order_by('-time')
        received_transactions = HistBanque.objects.filter(bid_reciever=user).order_by('-time')
        
        transactions_list = []
        
        for trans in sent_transactions:
            transactions_list.append({
                "id": trans.id,
                "type": "debit",
                "amount": -float(trans.montant),
                "description": f"To {trans.bid_reciever.prenom} {trans.bid_reciever.nom} - {trans.action}",
                "date": trans.time.strftime('%b %d, %Y'),
                "timestamp": trans.time.isoformat()
            })
        
        for trans in received_transactions:
            transactions_list.append({
                "id": trans.id,
                "type": "credit",
                "amount": float(trans.montant),
                "description": f"From {trans.bid_sender.prenom} {trans.bid_sender.nom} - {trans.action}",
                "date": trans.time.strftime('%b %d, %Y'),
                "timestamp": trans.time.isoformat()
            })
        
        # Sort by timestamp
        transactions_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return JsonResponse({
            "bank_id": bank_id,
            "transactions": transactions_list
        })
        
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
