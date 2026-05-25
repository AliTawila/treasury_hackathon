const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function readJson(response) {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json();
}

export async function getDemoResult() {
  return readJson(await fetch(`${API_BASE_URL}/api/demo`));
}

export async function reconcile(payload = {}) {
  return readJson(
    await fetch(`${API_BASE_URL}/api/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export function reportUrl(jobId) {
  return `${API_BASE_URL}/api/report/${jobId}`;
}

export function exportUrl(jobId) {
  return `${API_BASE_URL}/api/export/${jobId}`;
}
