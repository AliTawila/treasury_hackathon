# Team Context: Treasury AI Reconciliation Agent

## Goal And Guardrail

Build a stable AI Marathon 2026 Global Treasury Agent MVP that reconciles invoice,
payment proof, and bank statement data. Morpheus and Chutes are visible integration
boundaries, but the demo works without keys or internet.

**Locked rule:** AI extracts and explains; deterministic code calculates FX conversion,
bank fees, match scores, status, and reported values.

## Team Roles

| Role | Focus | Expected Output |
|---|---|---|
| Role 1 | Agent Lead / Backend | Schemas, FastAPI routes, mocked AI wrappers, merged API |
| Role 2 | Data Engineer | FX and fee traces, matcher, PDF/CSV artifacts, fallback data |
| Role 3 | Frontend Developer | Dashboard, API calls, upload-ready UI, result presentation |
| Role 4 | Pitch / Demo / QA | Deck, README, screenshots, architecture narrative, recording |

## Branch Ownership

| Branch | Owner | Work |
|---|---|---|
| backend/extraction | Role 1 | Morpheus, Chutes, FastAPI orchestration |
| backend/matching | Role 2 | FX, fees, matcher, report, demo data |
| frontend/dashboard | Role 3 | UI components and API calls |
| demo/docs | Role 4 | deck, README, screenshots, demo script |

## Current Progress

Role 1:
- Setting up backend infrastructure
- Building FastAPI routes
- Creating schemas
- Creating AI wrapper placeholders
- Managing integration

Role 2:
- Building matcher
- Building FX service
- Building fee engine
- Building audit/report generation
- Building demo/fallback data

Role 3:
- Building frontend dashboard
- Connecting API calls
- Rendering reconciliation results
- Creating upload UI

Role 4:
- Preparing slides
- README polishing
- Demo walkthrough
- Screenshots
- Architecture explanations

## API Contract Ownership

Role 1 owns [backend/app/models/schemas.py](../backend/app/models/schemas.py) and approves
contract changes before merge. Role 2 implements deterministic values within that contract.
Role 3 consumes the contract and must not create alternate result field names. Role 4
documents only behavior confirmed against demo mode.

Both `GET /api/demo` and `POST /api/reconcile` return one `ReconciliationResult` shape:

```json
{
  "job_id": "",
  "status": "",
  "confidence": 0.0,
  "invoice": {},
  "payment": {},
  "best_match": {},
  "fx_trace": {},
  "fee_trace": {},
  "score_breakdown": {},
  "explanation": "",
  "warnings": []
}
```

Endpoint ownership:

| Endpoint | Owner | Contract |
|---|---|---|
| `GET /api/health` | Role 1 | Service readiness response |
| `GET /api/demo` | Role 1 + Role 2 | `ReconciliationResult` from committed demo data |
| `POST /api/reconcile` | Role 1 + Role 2 | `ReconciliationResult` from supplied or fallback data |
| `GET /api/report/{job_id}` | Role 2 | PDF artifact |
| `GET /api/export/{job_id}` | Role 2 | CSV audit artifact |

## Responsibilities And Outputs

| Role | Immediate Responsibility | Handoff |
|---|---|---|
| Role 1 | Freeze schemas and keep application bootable | API contract and endpoint smoke results |
| Role 2 | Keep all money math deterministic and traceable | Demo fixtures, matching logic, artifacts |
| Role 3 | Make demo response legible and presentation-ready | Working UI and report/download actions |
| Role 4 | Keep delivery materials accurate and tested | Deck, screenshots, timed demo script |

## Integration Checkpoints

Checkpoint 1:
- backend boots successfully
- /api/demo works

Checkpoint 2:
- frontend displays demo response

Checkpoint 3:
- matcher integrated

Checkpoint 4:
- PDF/export generation works

Checkpoint 5:
- final demo walkthrough stable

## Merge Strategy

1. Role 1 creates or confirms `main`, then each owner branches from current `main`.
2. Owners commit small working changes and open pull requests into `main`.
3. Schema or route field changes are discussed before implementation and merged by Role 1 first.
4. Each pull request must preserve demo mode and document any new environment variable.
5. Role 1 merges only after endpoint smoke checks; Role 4 verifies README/demo wording after integration.

## Pull Strategy

Before opening or updating a pull request:

```bash
git checkout main
git pull origin main
git checkout <your-branch>
git merge main
```

Resolve conflicts on the feature branch and re-run the affected checkpoint before pushing.

## Initial Branch Commands

```bash
git checkout main
git pull origin main
git checkout -b backend/extraction
git checkout -b backend/matching main
git checkout -b frontend/dashboard main
git checkout -b demo/docs main
```

## First Integration Checklist

- Role 1: share `ReconciliationResult` fields and boot `/api/health`.
- Role 2: run the USD/MYR demo calculation and verify `MYR 421.50` expected credit.
- Role 3: call `/api/demo` and render status, confidence, traces, and downloads.
- Role 4: capture the architecture diagram and rehearse the deterministic-math trust message.
- Team: merge only when demo mode works without API keys.
