"""Banking transaction service (balance, transactions, history)."""

import logging
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from django.db import transaction as db_transaction

from ..exceptions import AccountNotFoundError, InsufficientFundsError, RecipientNotFoundError, UserNotFoundError
from ..models import Compte, HistBanque, User

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class TransactionResult:
    transaction_id: int
    sender_full_name: str
    recipient_full_name: str
    amount: float
    description: str
    new_balance: float
    timestamp: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": True,
            "transaction_id": self.transaction_id,
            "sender": self.sender_full_name,
            "recipient": self.recipient_full_name,
            "amount": self.amount,
            "description": self.description,
            "new_balance": self.new_balance,
            "timestamp": self.timestamp,
        }


@dataclass(frozen=True, slots=True)
class BalanceInfo:
    bank_id: str
    balance: float
    account_holder: str

    def to_dict(self) -> dict[str, Any]:
        return {"bank_id": self.bank_id, "balance": self.balance, "account_holder": self.account_holder}


@dataclass(frozen=True, slots=True)
class TransactionHistory:
    bank_id: str
    transactions: list[dict[str, Any]] = field(default_factory=list)
    page: int = 1
    page_size: int = 20
    total: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {"bank_id": self.bank_id, "transactions": self.transactions, "page": self.page, "page_size": self.page_size, "total": self.total}


def _get_user_and_account(bank_id: str) -> tuple[User, Compte]:
    try:
        user = User.objects.get(bank_id=bank_id)
    except User.DoesNotExist:
        raise UserNotFoundError(f"No user with bank_id='{bank_id}'.")
    try:
        compte = Compte.objects.get(bank_id=user)
    except Compte.DoesNotExist:
        raise AccountNotFoundError(f"No account for bank_id='{bank_id}'.")
    return user, compte


def get_balance(bank_id: str) -> BalanceInfo:
    user, compte = _get_user_and_account(bank_id)
    logger.info("Balance inquiry for bank_id=%s", bank_id)
    return BalanceInfo(bank_id=bank_id, balance=float(compte.solde), account_holder=f"{user.prenom} {user.nom}")


def execute_transaction(sender_bank_id: str, recipient_name: str, amount: Decimal, description: str) -> TransactionResult:
    with db_transaction.atomic():
        sender, sender_compte = _get_user_and_account(sender_bank_id)

        if sender_compte.solde < amount:
            raise InsufficientFundsError(current_balance=float(sender_compte.solde), requested_amount=float(amount))

        search_term = recipient_name.split()[-1] if " " in recipient_name else recipient_name
        recipient_qs = User.objects.filter(nom__icontains=search_term)
        if not recipient_qs.exists():
            raise RecipientNotFoundError(f"Recipient '{recipient_name}' not found.")
        recipient = recipient_qs.first()

        try:
            recipient_compte = Compte.objects.get(bank_id=recipient)
        except Compte.DoesNotExist:
            raise AccountNotFoundError("Recipient account not found.")

        sender_compte.solde -= amount
        sender_compte.save(update_fields=["solde"])
        recipient_compte.solde += amount
        recipient_compte.save(update_fields=["solde"])

        hist_entry = HistBanque.objects.create(bid_sender=sender, bid_reciever=recipient, action=description, montant=amount)
        logger.info("Transaction #%d: %s → %s, amount=%s", hist_entry.id, sender.bank_id, recipient.bank_id, amount)

    return TransactionResult(
        transaction_id=hist_entry.id,
        sender_full_name=f"{sender.prenom} {sender.nom}",
        recipient_full_name=f"{recipient.prenom} {recipient.nom}",
        amount=float(amount),
        description=description,
        new_balance=float(sender_compte.solde),
        timestamp=hist_entry.time.isoformat(),
    )


def get_transaction_history(bank_id: str, *, page: int = 1, page_size: int = 20) -> TransactionHistory:
    try:
        user = User.objects.get(bank_id=bank_id)
    except User.DoesNotExist:
        raise UserNotFoundError(f"No user with bank_id='{bank_id}'.")

    sent_qs = HistBanque.objects.filter(bid_sender=user).select_related("bid_reciever").order_by("-time")
    received_qs = HistBanque.objects.filter(bid_reciever=user).select_related("bid_sender").order_by("-time")

    entries: list[dict[str, Any]] = []
    for t in sent_qs:
        entries.append({"id": t.id, "type": "debit", "amount": -float(t.montant), "description": f"To {t.bid_reciever.prenom} {t.bid_reciever.nom} – {t.action}", "date": t.time.strftime("%b %d, %Y"), "timestamp": t.time.isoformat()})
    for t in received_qs:
        entries.append({"id": t.id, "type": "credit", "amount": float(t.montant), "description": f"From {t.bid_sender.prenom} {t.bid_sender.nom} – {t.action}", "date": t.time.strftime("%b %d, %Y"), "timestamp": t.time.isoformat()})

    entries.sort(key=lambda e: e["timestamp"], reverse=True)
    total = len(entries)
    start = (page - 1) * page_size
    paginated = entries[start : start + page_size]

    logger.info("History for bank_id=%s — page %d/%d", bank_id, page, (total // page_size) + 1)
    return TransactionHistory(bank_id=bank_id, transactions=paginated, page=page, page_size=page_size, total=total)
