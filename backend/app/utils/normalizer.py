"""Deterministic normalization helpers used before matching."""

from datetime import datetime
from typing import Optional


def normalize_currency(currency: Optional[str], default: str = "MYR") -> str:
    return (currency or default).strip().upper()


def normalize_reference(reference: Optional[str]) -> str:
    if not reference:
        return ""
    return " ".join(reference.lower().replace("-", " ").split())


def normalize_date(value: Optional[str]) -> str:
    if not value:
        return ""
    for date_format in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, date_format).date().isoformat()
        except ValueError:
            continue
    return value


def round_money(amount: float) -> float:
    return round(float(amount) + 1e-10, 2)
