"""Input validation helpers for API payloads."""

from decimal import Decimal, InvalidOperation
from typing import Any

from .exceptions import InvalidAmountError, InvalidImageError, ValidationError


def validate_image_payload(payload: dict[str, Any]) -> tuple[str, float | None]:
    image_data: str | None = payload.get("image")
    if not image_data:
        raise InvalidImageError("Missing 'image' field in payload.")

    threshold: float | None = None
    if (raw_threshold := payload.get("threshold")) is not None:
        try:
            threshold = float(raw_threshold)
        except (ValueError, TypeError) as exc:
            raise ValidationError("Threshold must be numeric.") from exc

    return image_data, threshold


_REQUIRED_FIELDS = ("sender_bank_id", "recipient", "amount", "description")


def validate_transaction_payload(payload: dict[str, Any]) -> tuple[str, str, Decimal, str]:
    if missing := [f for f in _REQUIRED_FIELDS if not payload.get(f)]:
        raise ValidationError(f"Missing required fields: {', '.join(missing)}")

    try:
        amount = Decimal(str(payload["amount"]))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise InvalidAmountError("Amount must be a valid number.") from exc

    if amount <= 0:
        raise InvalidAmountError("Amount must be positive.")

    return str(payload["sender_bank_id"]), str(payload["recipient"]), amount, str(payload["description"])


def validate_bank_id_param(bank_id: str | None) -> str:
    if not bank_id:
        raise ValidationError("'bank_id' query parameter is required.")
    return str(bank_id)
