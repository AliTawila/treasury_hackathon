import { useEffect, useState } from "react";

import { exportUrl, getDemoResult, reportUrl } from "./lib/api.js";

const pipelineSteps = ["Extract", "Normalize", "FX", "Fees", "Match", "Explain", "Report"];

function money(currency, amount) {
  return `${currency} ${Number(amount || 0).toFixed(2)}`;
}

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDemo() {
    setLoading(true);
    setError("");
    try {
      setResult(await getDemoResult());
    } catch (requestError) {
      setError(`${requestError.message}. Start the backend to load deterministic demo data.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDemo();
  }, []);

  return (
    <main className="dashboard">
      <header className="hero">
        <div>
          <p className="eyebrow">AI Marathon 2026 | Global Treasury Agent</p>
          <h1>Treasury AI Reconciliation Agent</h1>
          <p className="subtitle">
            Traceable cross-border reconciliation: AI extracts and explains; code calculates.
          </p>
        </div>
        <button className="button" onClick={loadDemo} disabled={loading}>
          {loading ? "Loading..." : "Run Demo Mode"}
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {result && (
        <>
          <section className="result-header">
            <span className={`badge badge-${result.status}`}>{result.status.replace("_", " ")}</span>
            <strong>{(result.confidence * 100).toFixed(0)}% confidence</strong>
            <span className="muted">Job {result.job_id}</span>
          </section>

          <section className="grid">
            <article className="card">
              <h2>Invoice</h2>
              <p>{result.invoice.invoice_number}</p>
              <strong>{money(result.invoice.currency, result.invoice.amount)}</strong>
              <small>{result.invoice.payer}</small>
            </article>
            <article className="card">
              <h2>FX Trace</h2>
              <p>
                {result.fx_trace.base_currency}/{result.fx_trace.target_currency} at{" "}
                {result.fx_trace.rate.toFixed(4)}
              </p>
              <strong>
                {money(result.fx_trace.target_currency, result.fx_trace.converted_amount)}
              </strong>
              <small>{result.fx_trace.source}</small>
            </article>
            <article className="card">
              <h2>Fee Trace</h2>
              <p>{result.fee_trace.rule_name.replaceAll("_", " ")}</p>
              <strong>{money(result.fee_trace.currency, result.fee_trace.total_fee)}</strong>
              <small>Expected credit {money(result.fee_trace.currency, result.fee_trace.expected_credit)}</small>
            </article>
            <article className="card">
              <h2>Bank Match</h2>
              <p>{result.best_match?.row_id || "No candidate"}</p>
              <strong>
                {result.best_match
                  ? money(result.best_match.currency, result.best_match.credit_amount)
                  : "-"}
              </strong>
              <small>{result.best_match?.date}</small>
            </article>
          </section>

          <section className="panel">
            <h2>Agent Timeline</h2>
            <div className="timeline">
              {pipelineSteps.map((step) => (
                <span className="step" key={step}>
                  <span className="check">done</span> {step}
                </span>
              ))}
            </div>
            <p className="explanation">{result.explanation}</p>
            <div className="actions">
              <a className="button secondary" href={reportUrl(result.job_id)}>
                Download PDF Report
              </a>
              <a className="button secondary" href={exportUrl(result.job_id)}>
                Download Audit CSV
              </a>
              <button className="button quiet" disabled title="Upload integration placeholder">
                Upload Files Soon
              </button>
            </div>
          </section>

          <details className="raw">
            <summary>Shared API response contract</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </>
      )}
    </main>
  );
}
