// src/App.jsx
import React, { useState, useCallback } from "react";
import FileUpload from "./components/FileUpload";
import AgentTimeline from "./components/AgentTimeline";
import ExtractedFieldsCard from "./components/ExtractedFieldsCard";
import ReconciliationResult from "./components/ReconciliationResult";
import DiscrepancyPanel from "./components/DiscrepancyPanel";
import FxFeeTraceCards from "./components/FxFeeTraceCards";
import MatchCandidatesTable from "./components/MatchCandidatesTable";
import ReportDownload from "./components/ReportDownload";
import ReviewQueue from "./components/ReviewQueue";
import ConfidenceBadge from "./components/ConfidenceBadge";
import { DEMO_CASES, AGENT_TIMELINE_STEPS } from "./lib/demoData";
import { uploadFiles, reconcile } from "./lib/api";

const STEPS = AGENT_TIMELINE_STEPS.map((s) => s.id);

export default function App() {
  const [demoMode, setDemoMode] = useState(false);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [files, setFiles] = useState({ invoice: null, paymentProof: null, bankStatement: null });
  const [phase, setPhase] = useState("idle"); // idle | running | done | error
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);

  const activeResult = demoMode ? DEMO_CASES[activeCaseIdx] : result;

  // Animate timeline steps one by one with delay
  const animateTimeline = useCallback(async () => {
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const done = [];
    for (const step of STEPS) {
      setCurrentStep(step);
      await delay(500);
      done.push(step);
      setCompletedSteps([...done]);
      setCurrentStep(null);
    }
  }, []);

  const handleDemoMode = async (idx = 0) => {
    setDemoMode(true);
    setActiveCaseIdx(idx);
    setPhase("running");
    setCompletedSteps([]);
    setResult(null);
    await animateTimeline();
    setPhase("done");
  };

  const handleReconcile = async () => {
    if (!files.invoice && !files.paymentProof && !files.bankStatement) {
      // No files — switch to demo mode silently
      await handleDemoMode(0);
      return;
    }
    setDemoMode(false);
    setPhase("running");
    setCompletedSteps([]);
    setResult(null);

    try {
      // Upload
      setCurrentStep("upload");
      const uploadRes = await uploadFiles(files);
      const jid = uploadRes.job_id;
      setJobId(jid);
      setCompletedSteps(["upload"]);
      setCurrentStep(null);

      // Animate remaining steps while reconciliation runs
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      const stepQueue = STEPS.slice(1);
      const done = ["upload"];

      const animateAndReconcile = async () => {
        for (const step of stepQueue.slice(0, -1)) {
          setCurrentStep(step);
          await delay(600);
          done.push(step);
          setCompletedSteps([...done]);
          setCurrentStep(null);
        }
      };

      const [, reconcileRes] = await Promise.all([
        animateAndReconcile(),
        reconcile(jid),
      ]);

      // Last step
      setCurrentStep(STEPS[STEPS.length - 1]);
      await delay(400);
      done.push(STEPS[STEPS.length - 1]);
      setCompletedSteps([...done]);
      setCurrentStep(null);

      setResult(reconcileRes);
      setJobId(reconcileRes.job_id || jid);
      setPhase("done");
    } catch (err) {
      console.error(err);
      setPhase("error");
    }
  };

  const canRun =
    phase === "idle" ||
    phase === "done" ||
    phase === "error";

  return (
    <div style={styles.root}>
      <style>{globalStyles}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>◈</span>
          <div>
            <div style={styles.logoName}>Global Treasury Agent</div>
            <div style={styles.logoSub}>Cross-Border Reconciliation · AI Marathon 2026</div>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* Provider status pills */}
          <div style={styles.statusPills}>
            {[
              { name: "Morpheus", color: "#a78bfa" },
              { name: "Chutes", color: "#00e5a0" },
              { name: "Frankfurter FX", color: "#60a5fa" },
            ].map((p) => (
              <span key={p.name} style={{ ...styles.statusPill, borderColor: p.color + "44", color: p.color }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                {p.name}
              </span>
            ))}
          </div>

          {/* Demo mode toggle */}
          <button
            onClick={() => demoMode ? setDemoMode(false) : handleDemoMode(0)}
            style={{
              ...styles.demoBtn,
              background: demoMode ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.05)",
              border: demoMode ? "1px solid rgba(0,229,160,0.4)" : "1px solid rgba(255,255,255,0.12)",
              color: demoMode ? "#00e5a0" : "rgba(255,255,255,0.6)",
            }}
          >
            {demoMode ? "⊙ Demo Mode ON" : "⊙ Demo Mode"}
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Demo case selector strip */}
        {demoMode && (
          <div style={styles.demoCaseStrip}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.35)", marginRight: "10px" }}>
              SELECT CASE:
            </span>
            {DEMO_CASES.map((c, i) => (
              <button
                key={c.job_id}
                onClick={() => handleDemoMode(i)}
                style={{
                  ...styles.casePill,
                  background: activeCaseIdx === i ? "rgba(255,255,255,0.08)" : "transparent",
                  border: activeCaseIdx === i ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  color: activeCaseIdx === i ? "#e8e8e8" : "rgba(255,255,255,0.35)",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.status === "matched" ? "#00e5a0" : "#f5a623", display: "inline-block" }} />
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* 3-column layout */}
        <div style={styles.grid}>
          {/* LEFT PANEL */}
          <div style={styles.leftPanel}>
            <FileUpload files={files} onChange={setFiles} />

            <div style={{ marginTop: "12px" }}>
              <AgentTimeline
                isRunning={phase === "running"}
                completedSteps={completedSteps}
                currentStep={currentStep}
              />
            </div>

            {/* Run button */}
            <button
              onClick={handleReconcile}
              disabled={!canRun || phase === "running"}
              style={{
                ...styles.runBtn,
                opacity: (!canRun || phase === "running") ? 0.5 : 1,
                cursor: (!canRun || phase === "running") ? "not-allowed" : "pointer",
              }}
            >
              {phase === "running" ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <span style={styles.spinner} />
                  Processing…
                </span>
              ) : phase === "done" ? (
                "↺ Reconcile Again"
              ) : (
                "▶ Run Reconciliation"
              )}
            </button>

            <div style={{ marginTop: "12px" }}>
              <ReviewQueue
                cases={DEMO_CASES}
                activeId={activeResult?.job_id}
                onSelect={(id) => {
                  const idx = DEMO_CASES.findIndex((c) => c.job_id === id);
                  if (idx !== -1) handleDemoMode(idx);
                }}
              />
            </div>
          </div>

          {/* CENTER PANEL */}
          <div style={styles.centerPanel}>
            {phase === "idle" && !demoMode && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>◈</div>
                <div style={styles.emptyTitle}>Ready to Reconcile</div>
                <div style={styles.emptyDesc}>
                  Upload your invoice, payment proof, and bank statement, then click Run Reconciliation.
                  Or enable Demo Mode to see a pre-built example.
                </div>
              </div>
            )}

            {activeResult && (
              <>
                <ReconciliationResult result={activeResult} />
                <div style={{ marginTop: "12px" }}>
                  <DiscrepancyPanel result={activeResult} />
                </div>
                <div style={{ marginTop: "12px" }}>
                  <FxFeeTraceCards fxTrace={activeResult.fx_trace} feeTrace={activeResult.fee_trace} />
                </div>
                <div style={{ marginTop: "12px" }}>
                  <MatchCandidatesTable
                    rows={activeResult.bank_rows}
                    bestMatchId={activeResult.best_match?.row_id}
                  />
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div style={styles.rightPanel}>
            {activeResult && (
              <>
                <ExtractedFieldsCard
                  invoice={activeResult.invoice}
                  payment={activeResult.payment}
                />
                <div style={{ marginTop: "12px" }}>
                  <ReportDownload
                    jobId={activeResult?.job_id}
                    disabled={phase === "running"}
                  />
                </div>

                {/* Summary stats */}
                <div style={styles.statsCard}>
                  <div style={styles.statsPill}>SESSION SUMMARY</div>
                  <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                      <div style={styles.statValue}>{DEMO_CASES.length}</div>
                      <div style={styles.statLabel}>Total Cases</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={{ ...styles.statValue, color: "#00e5a0" }}>
                        {DEMO_CASES.filter((c) => c.status === "matched").length}
                      </div>
                      <div style={styles.statLabel}>Matched</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={{ ...styles.statValue, color: "#f5a623" }}>
                        {DEMO_CASES.filter((c) => c.status === "needs_review").length}
                      </div>
                      <div style={styles.statLabel}>Review</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={{ ...styles.statValue, color: "#ff4d6d" }}>
                        {DEMO_CASES.filter((c) => c.status === "unmatched").length}
                      </div>
                      <div style={styles.statLabel}>Unmatched</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>AI Marathon 2026 · Track 3: Global Treasury Agent</span>
        <span>AI extracts & explains · Deterministic code calculates & validates</span>
        <span>Morpheus · Chutes · Frankfurter FX</span>
      </footer>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e8e8",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 28px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    backdropFilter: "blur(8px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
    flexWrap: "wrap",
    gap: "12px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    fontSize: "24px",
    color: "#a78bfa",
    lineHeight: 1,
  },
  logoName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "16px",
    fontWeight: 800,
    color: "#e8e8e8",
    letterSpacing: "0.02em",
  },
  logoSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.3)",
    marginTop: "1px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  statusPills: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "999px",
    border: "1px solid",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  demoBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    fontWeight: 600,
    transition: "all 0.2s ease",
    letterSpacing: "0.04em",
  },
  demoCaseStrip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 0",
    overflowX: "auto",
    flexWrap: "wrap",
  },
  casePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    borderRadius: "999px",
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "11px",
    transition: "all 0.2s",
  },
  main: {
    flex: 1,
    padding: "20px 28px",
    maxWidth: "1440px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr 280px",
    gap: "16px",
    alignItems: "flex-start",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  centerPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  runBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "14px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    border: "none",
    color: "#fff",
    fontFamily: "'Syne', sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 20px rgba(167,139,250,0.25)",
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 40px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "rgba(167,139,250,0.3)",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "20px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    marginBottom: "10px",
  },
  emptyDesc: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "13px",
    color: "rgba(255,255,255,0.25)",
    lineHeight: "1.7",
    maxWidth: "380px",
    margin: "0 auto",
  },
  statsCard: {
    marginTop: "12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "16px",
  },
  statsPill: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.4)",
    marginBottom: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  statItem: {
    textAlign: "center",
    padding: "10px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "8px",
  },
  statValue: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "22px",
    fontWeight: 800,
    color: "#e8e8e8",
    marginBottom: "3px",
  },
  statLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.05em",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 28px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.2)",
    flexWrap: "wrap",
    gap: "6px",
  },
};

const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  button { -webkit-font-smoothing: antialiased; }
  @media (max-width: 1100px) {
    .grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 720px) {
    .grid { grid-template-columns: 1fr !important; }
  }
`;
