"""Custom exceptions for domain-specific error handling."""

class MaraTechError(Exception):
    status_code: int = 500
    default_message: str = "An internal error occurred."

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.default_message
        super().__init__(self.message)


class ValidationError(MaraTechError):
    status_code = 400
    default_message = "Invalid input data."


class InvalidImageError(ValidationError):
    default_message = "Invalid or missing image data."


class InvalidAmountError(ValidationError):
    default_message = "Invalid amount format."


class NotFoundError(MaraTechError):
    status_code = 404
    default_message = "Resource not found."


class UserNotFoundError(NotFoundError):
    default_message = "User not found."


class AccountNotFoundError(NotFoundError):
    default_message = "Account not found."


class RecipientNotFoundError(NotFoundError):
    default_message = "Recipient not found in the system."


class InsufficientFundsError(MaraTechError):
    status_code = 400
    default_message = "Insufficient funds."

    def __init__(self, message: str | None = None, *, current_balance: float = 0.0, requested_amount: float = 0.0) -> None:
        super().__init__(message)
        self.current_balance = current_balance
        self.requested_amount = requested_amount
