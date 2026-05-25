"""Generated reconciliation artifacts endpoints."""

import re
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.routers.reconcile import find_result, run_reconciliation
from app.services.audit_exporter import EXPORT_DIR, export_audit_log
from app.services.report_generator import REPORT_DIR, generate_reconciliation_report


router = APIRouter(prefix="/api", tags=["artifacts"])


def _safe_job_id(job_id: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", job_id):
        raise HTTPException(status_code=400, detail="Invalid job identifier.")
    return job_id


def _resolve_result(job_id: str):
    result = find_result(job_id)
    if result:
        return result
    if job_id == "demo_001":
        return run_reconciliation(job_id=job_id)
    raise HTTPException(status_code=404, detail="Reconciliation job not found.")


@router.get("/report/{job_id}")
def download_report(job_id: str) -> FileResponse:
    safe_id = _safe_job_id(job_id)
    path = Path(REPORT_DIR) / f"{safe_id}_reconciliation_report.pdf"
    if not path.exists():
        path = generate_reconciliation_report(_resolve_result(safe_id))
    return FileResponse(path, media_type="application/pdf", filename=path.name)


@router.get("/export/{job_id}")
def download_audit_export(job_id: str) -> FileResponse:
    safe_id = _safe_job_id(job_id)
    path = Path(EXPORT_DIR) / f"{safe_id}_audit_log.csv"
    if not path.exists():
        path = export_audit_log(_resolve_result(safe_id))
    return FileResponse(path, media_type="text/csv", filename=path.name)
