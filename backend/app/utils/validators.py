"""Validation warnings that preserve a usable demo response."""

from typing import List

from app.models.schemas import InvoiceData, PaymentProofData


def collect_input_warnings(invoice: InvoiceData, payment: PaymentProofData) -> List[str]:
    warnings: List[str] = []
    if invoice.amount is None or not invoice.currency:
        warnings.append("Invoice amount or currency is missing; manual review required.")
    if not payment.reference:
        warnings.append("Payment reference is missing; match confidence may be reduced.")
    if invoice.currency and payment.currency_sent and invoice.currency != payment.currency_sent:
        warnings.append("Payment currency differs from invoice currency.")
    warnings.extend(invoice.warnings)
    warnings.extend(payment.warnings)
    return warnings
