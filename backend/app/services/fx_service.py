"""Offline-first FX rate lookup used for deterministic money calculations."""

import json
from pathlib import Path
from typing import Any, Dict

from app.models.schemas import FXTrace
from app.utils.normalizer import normalize_currency, normalize_date, round_money


DEMO_DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "demo"


def _rates() -> Dict[str, Any]:
    with (DEMO_DATA_DIR / "fallback_fx_rates.json").open("r", encoding="utf-8") as fixture:
        return json.load(fixture)


def fetch_fx_rate(
    base_currency: str,
    target_currency: str,
    transaction_date: str,
    amount: float,
) -> FXTrace:
    """Return a traceable fallback FX conversion; replace with an API adapter later."""

    base = normalize_currency(base_currency)
    target = normalize_currency(target_currency)
    rate_date = normalize_date(transaction_date)
    rate = 1.0
    source = "identity"

    if base != target:
        fallback_rates = _rates()
        dated_key = f"{rate_date}:{base}_{target}"
        default_key = f"{base}_{target}"
        rate = fallback_rates["dated_rates"].get(
            dated_key, fallback_rates["default_rates"].get(default_key, 1.0)
        )
        source = "local_fallback_fx_rates"

    return FXTrace(
        base_currency=base,
        target_currency=target,
        rate_date=rate_date,
        input_amount=round_money(amount),
        rate=float(rate),
        converted_amount=round_money(amount * float(rate)),
        source=source,
        fallback_used=True,
    )
