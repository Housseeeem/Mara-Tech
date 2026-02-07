"""Banking API views."""

import json
import logging

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from ..exceptions import InsufficientFundsError, MaraTechError
from ..services import banking_service
from ..validators import validate_bank_id_param, validate_transaction_payload

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def banking_transaction(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    try:
        sender_bank_id, recipient_name, amount, description = validate_transaction_payload(payload)
        result = banking_service.execute_transaction(sender_bank_id, recipient_name, amount, description)
        return JsonResponse(result.to_dict())
    except InsufficientFundsError as exc:
        return JsonResponse({"error": exc.message, "current_balance": exc.current_balance, "requested_amount": exc.requested_amount}, status=exc.status_code)
    except MaraTechError as exc:
        logger.warning("Transaction failed: %s", exc.message)
        return JsonResponse({"error": exc.message}, status=exc.status_code)


@csrf_exempt
@require_GET
def get_account_balance(request: HttpRequest) -> JsonResponse:
    try:
        bank_id = validate_bank_id_param(request.GET.get("bank_id"))
        info = banking_service.get_balance(bank_id)
        return JsonResponse(info.to_dict())
    except MaraTechError as exc:
        return JsonResponse({"error": exc.message}, status=exc.status_code)


@csrf_exempt
@require_GET
def get_transaction_history(request: HttpRequest) -> JsonResponse:
    try:
        bank_id = validate_bank_id_param(request.GET.get("bank_id"))
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))
        history = banking_service.get_transaction_history(bank_id, page=max(1, page), page_size=min(100, max(1, page_size)))
        return JsonResponse(history.to_dict())
    except (ValueError, TypeError):
        return JsonResponse({"error": "page and page_size must be integers."}, status=400)
    except MaraTechError as exc:
        return JsonResponse({"error": exc.message}, status=exc.status_code)
