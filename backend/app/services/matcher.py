"""Explainable transaction matching; all scores are calculated in code."""

from datetime import date
from difflib import SequenceMatcher
from typing import Iterable, Optional

from app.models.schemas import BankStatementRow, FeeTrace, InvoiceData, MatchResult, PaymentProofData
from app.utils.normalizer import normalize_reference, round_money

try:
    from rapidfuzz.fuzz import token_set_ratio
except ImportError:  # pragma: no cover - used before optional dependencies are installed.
    token_set_ratio = None


def _date_score(target_date: str, bank_date: str) -> float:
    try:
        day_difference = abs((date.fromisoformat(bank_date) - date.fromisoformat(target_date)).days)
    except ValueError:
        return 0.0
    if day_difference == 0:
        return 1.0
    if day_difference <= 1:
        return 0.8
    if day_difference <= 3:
        return 0.6
    return 0.0


def _reference_score(reference: str, description: str) -> float:
    clean_reference = normalize_reference(reference)
    clean_description = normalize_reference(description)
    if not clean_reference:
        return 0.0
    if clean_reference in clean_description:
        return 1.0
    if token_set_ratio:
        return round(token_set_ratio(clean_reference, clean_description) / 100.0, 4)
    return round(SequenceMatcher(None, clean_reference, clean_description).ratio(), 4)


def _amount_score(expected_credit: float, actual_credit: float) -> float:
    tolerance_amount = max(5.0, round_money(expected_credit * 0.02))
    difference = abs(actual_credit - expected_credit)
    return round(max(0.0, 1.0 - (difference / tolerance_amount)), 4)


def _status(confidence: float) -> str:
    if confidence >= 0.85:
        return "matched"
    if confidence >= 0.65:
        return "needs_review"
    return "unmatched"


def match_transactions(
    invoice: InvoiceData,
    payment: PaymentProofData,
    bank_rows: Iterable[BankStatementRow],
    fee_trace: FeeTrace,
) -> MatchResult:
    """Rank local bank rows using date, reference, and expected credit proximity."""

    expected_credit = fee_trace.expected_credit
    reference = payment.reference or invoice.invoice_number or ""
    target_date = payment.date or invoice.date or ""
    best_result: Optional[MatchResult] = None

    for row in bank_rows:
        date_score = _date_score(target_date, row.date)
        reference_score = _reference_score(reference, row.description)
        amount_score = _amount_score(expected_credit, row.credit_amount)
        confidence = round(
            (0.30 * date_score) + (0.30 * reference_score) + (0.40 * amount_score), 4
        )
        result = MatchResult(
            status=_status(confidence),
            confidence=confidence,
            best_match=row,
            expected_credit=expected_credit,
            actual_credit=row.credit_amount,
            difference=round_money(abs(row.credit_amount - expected_credit)),
            date_score=date_score,
            reference_score=reference_score,
            amount_score=amount_score,
        )
        if best_result is None or result.confidence > best_result.confidence:
            best_result = result

    return best_result or MatchResult(
        status="unmatched",
        confidence=0.0,
        expected_credit=expected_credit,
        actual_credit=None,
        difference=None,
        date_score=0.0,
        reference_score=0.0,
        amount_score=0.0,
    )
