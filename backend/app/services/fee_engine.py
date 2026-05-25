"""Simple bank fee rules kept in deterministic Python logic."""

from typing import Dict

from app.models.schemas import FeeTrace
from app.utils.normalizer import round_money


FEE_RULES: Dict[str, Dict[str, float]] = {
    "incoming_wire": {"percentage_rate": 0.015, "flat_fee": 5.0},
    "flat_fee_only": {"percentage_rate": 0.0, "flat_fee": 5.0},
    "no_fee": {"percentage_rate": 0.0, "flat_fee": 0.0},
}


def apply_bank_fees(amount: float, currency: str, rule_name: str = "incoming_wire") -> FeeTrace:
    """Apply a fixed, explainable fee rule and return its complete calculation trace."""

    rule = FEE_RULES.get(rule_name, FEE_RULES["incoming_wire"])
    percentage_fee = round_money(amount * rule["percentage_rate"])
    flat_fee = round_money(rule["flat_fee"])
    total_fee = round_money(percentage_fee + flat_fee)
    return FeeTrace(
        rule_name=rule_name if rule_name in FEE_RULES else "incoming_wire",
        currency=currency,
        gross_amount=round_money(amount),
        percentage_rate=rule["percentage_rate"],
        percentage_fee=percentage_fee,
        flat_fee=flat_fee,
        total_fee=total_fee,
        expected_credit=round_money(amount - total_fee),
    )
