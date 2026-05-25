// src/lib/api.js
// API wrapper — tries real backend first, falls back to mock data gracefully.

import { DEMO_CASES } from "./demoData";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// GET /api/health
export async function checkHealth() {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// GET /api/demo?case=<caseName>
// caseName: "matched" | "needs_review" | "unmatched" (more cases coming from Tawila's PR)
// Falls back to local mock if backend is unreachable.
export async function getDemoCase(caseName = "matched") {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/demo?case=${caseName}`);
    if (res.ok) return await res.json();
  } catch {
    // fall through to mock
  }
  // Fallback: find matching case from local mock data
  const fallback =
    DEMO_CASES.find((c) => c.status === caseName) ||
    DEMO_CASES.find((c) => c.job_id === caseName) ||
    DEMO_CASES[0];
  return { ...fallback, source: "mock" };
}

// POST /api/upload — upload invoice, payment proof, bank statement
export async function uploadFiles({ invoice, paymentProof, bankStatement }) {
  try {
    const form = new FormData();
    if (invoice) form.append("invoice", invoice);
    if (paymentProof) form.append("payment_proof", paymentProof);
    if (bankStatement) form.append("bank_statement", bankStatement);

    const res = await fetchWithTimeout(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: form,
    });
    if (res.ok) return await res.json();
  } catch {
    // fall through to mock
  }
  return { job_id: "mock_" + Date.now(), source: "mock" };
}

// POST /api/reconcile — trigger full reconciliation pipeline
export async function reconcile(jobId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    });
    if (res.ok) return await res.json();
  } catch {
    // fall through
  }
  await new Promise((r) => setTimeout(r, 2000));
  return { ...DEMO_CASES[0], job_id: jobId, source: "mock" };
}

// GET /api/results/{job_id}
export async function getResults(jobId) {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/results/${jobId}`);
    if (res.ok) return await res.json();
  } catch {
    // fall through
  }
  const found = DEMO_CASES.find((c) => c.job_id === jobId);
  return found || DEMO_CASES[0];
}

// GET /api/report/{job_id}
export async function getReportUrl(jobId) {
  return `${BASE_URL}/api/report/${jobId}`;
}

// GET /api/export/{job_id}
export async function getExportUrl(jobId) {
  return `${BASE_URL}/api/export/${jobId}`;
}
