"""Morpheus-compatible extraction wrapper with deterministic local fallback data."""

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, Union

from app.models.schemas import InvoiceData, PaymentProofData


DEMO_DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "demo"


def _load_json(filename: str) -> Dict[str, Any]:
    with (DEMO_DATA_DIR / filename).open("r", encoding="utf-8") as fixture:
        return json.load(fixture)


class MorpheusExtractor:
    """Stable interface that can later call Morpheus without affecting routes."""

    def __init__(self) -> None:
        self.api_key = os.getenv("MORPHEUS_API_KEY", "")
        self.fallback_mode = os.getenv("DEMO_MODE", "true").lower() != "false" or not self.api_key

    def extract_invoice(
        self, structured_input: Optional[Union[InvoiceData, Dict[str, Any]]] = None
    ) -> InvoiceData:
        if isinstance(structured_input, InvoiceData):
            return structured_input
        if structured_input:
            return InvoiceData(**structured_input)
        return InvoiceData(**_load_json("fallback_extracted_invoice.json"))

    def extract_payment_proof(
        self, structured_input: Optional[Union[PaymentProofData, Dict[str, Any]]] = None
    ) -> PaymentProofData:
        if isinstance(structured_input, PaymentProofData):
            return structured_input
        if structured_input:
            return PaymentProofData(**structured_input)
        return PaymentProofData(**_load_json("fallback_extracted_payment.json"))


def extract_document_fields(document_type: str) -> Union[InvoiceData, PaymentProofData]:
    """Mock the extraction tool while keeping a future provider-friendly interface."""

    extractor = MorpheusExtractor()
    if document_type == "invoice":
        return extractor.extract_invoice()
    if document_type == "payment":
        return extractor.extract_payment_proof()
    raise ValueError(f"Unsupported document type: {document_type}")
