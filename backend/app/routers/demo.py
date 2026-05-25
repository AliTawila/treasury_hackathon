"""Golden-path demo endpoint using the same response contract as reconciliation."""

from fastapi import APIRouter

from app.models.schemas import ReconciliationResult
from app.routers.reconcile import run_reconciliation


router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.get("", response_model=ReconciliationResult)
def demo_result() -> ReconciliationResult:
    return run_reconciliation(job_id="demo_001")
