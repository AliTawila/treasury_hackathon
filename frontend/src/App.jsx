// src/App.jsx
import React, { useState, useCallback, useEffect } from "react";
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
import { uploadFiles, reconcile, getDemoCase } from "./lib/api";

const STEPS = AGENT_TIMELINE_STEPS.map((s) => s.id);

// ─── Scenario definitions ────────────────────────────────────────────────────
// To add Tawila's new portfolio cases, just add entries here.
const SCENARIOS = [
  { id: "matched",      label: "Matched",      emoji: "✓", color: "#00e5a0", bg: "rgba(0,229,160,0.08)",  border: "rgba(0,229,160,0.3)"  },
  { id: "needs_review", label: "Needs Review", emoji: "⚠", color: "#f5a623", bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.3)" },
  { id: "unmatched",    label: "Unmatched",    emoji: "✗", color: "#ff4d6d", bg: "rgba(255,77,109,0.08)", border: "rgba(255,77,109,0.3)" },
];

export default function App() {
  const [mode, setMode]           = useState("idle"); // "idle" | "demo" | "upload"
  const [selectedScenario, setSelectedScenario] = useState(null); // scenario id string
  const [scenarioLoading, setScenarioLoading]   = useState(false);
  const [scenarioError, setScenarioError]       = useState("");

  const [files, setFiles]                   = useState({ invoice: null, paymentProof: null, bankStatement: null });
  const [phase, setPhase]                   = useState("idle");
  const [completedSteps, setCompletedSteps] = useState([]);
  const [currentStep, setCurrentStep]       = useState(null);
  const [result, setResult]                 = useState(null);
  const [jobId, setJobId]                   = useState(null);

  const activeResult = result;
  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenario);

  // ── Animate timeline ──────────────────────────────────────────────────────
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

  // ── Load a scenario from backend ──────────────────────────────────────────
  const handleSelectScenario = async (scenarioId) => {
    setSelectedScenario(scenarioId);
    setMode("demo");
    setScenarioError("");
    setScenarioLoading(true);
    setResult(null);
    setCompletedSteps([]);

    try {
      const [data] = await Promise.all([
        getDemoCase(scenarioId),
        animateTimeline(),
      ]);
      setResult(data);
      setJobId(data.job_id);
      setPhase("done");
    } catch (err) {
      setScenarioError("Could not load scenario. Using offline fallback.");
      // animateTimeline already ran, just show error
    } finally {
      setScenarioLoading(false);
    }
  };

  // ── Upload + reconcile flow ───────────────────────────────────────────────
  const handleReconcile = async () => {
    if (!files.invoice && !files.paymentProof && !files.bankStatement) {
      await handleSelectScenario("matched");
      return;
    }
    setMode("upload");
    setSelectedScenario(null);
    setPhase("running");
    setCompletedSteps([]);
    setResult(null);

    try {
      setCurrentStep("upload");
      const uploadRes = await uploadFiles(files);
      const jid = uploadRes.job_id;
      setJobId(jid);
      setCompletedSteps(["upload"]);
      setCurrentStep(null);

      const delay   = (ms) => new Promise((r) => setTimeout(r, ms));
      const stepQueue = STEPS.slice(1);
      const done    = ["upload"];

      const [, reconcileRes] = await Promise.all([
        (async () => {
          for (const step of stepQueue.slice(0, -1)) {
            setCurrentStep(step);
            await delay(600);
            done.push(step);
            setCompletedSteps([...done]);
            setCurrentStep(null);
          }
        })(),
        reconcile(jid),
      ]);

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

  const canRun = phase === "idle" || phase === "done" || phase === "error";
  const isRunning = scenarioLoading || phase === "running";

  return (
    <div style={styles.root}>
      <style>{globalStyles}</style>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>◈</span>
          <div>
            <div style={styles.logoName}>Global Treasury Agent</div>
            <div style={styles.logoSub}>Cross-Border Reconciliation · AI Marathon 2026</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statusPills}>
            {[
              { name: "Morpheus", color: "#a78bfa" },
              { name: "Chutes",   color: "#00e5a0" },
              { name: "FX API",   color: "#60a5fa" },
            ].map((p) => (
              <span key={p.name} style={{ ...styles.statusPill, borderColor: p.color + "44", color: p.color }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, display: "inline-block" }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main style={styles.main}>

        {/* ── Scenario Selector ── */}
        <section style={styles.scenarioSection}>
          <div style={styles.scenarioLabel}>
            <span style={styles.scenarioLabelText}>SELECT DEMO SCENARIO</span>
            <span style={styles.scenarioHint}>Fetches live from backend · falls back to offline data</span>
          </div>
          <div style={styles.scenarioButtons}>
            {SCENARIOS.map((s) => {
              const isActive = selectedScenario === s.id;
              const isLoading = isActive && scenarioLoading;
              return (
                <button
                  key={s.id}
                  onClick={() => !isRunning && handleSelectScenario(s.id)}
                  disabled={isRunning}
                  style={{
                    ...styles.scenarioBtn,
                    background:   isActive ? s.bg    : "rgba(255,255,255,0.03)",
                    border:       isActive ? `1.5px solid ${s.border}` : "1.5px solid rgba(255,255,255,0.07)",
                    color:        isActive ? s.color : "rgba(255,255,255,0.45)",
                    boxShadow:    isActive ? `0 0 18px ${s.color}22` : "none",
                    cursor:       isRunning ? "not-allowed" : "pointer",
                    opacity:      isRunning && !isActive ? 0.45 : 1,
                  }}
                >
                  {isLoading ? (
                    <span style={{ ...styles.spinnerSmall, borderTopColor: s.color }} />
                  ) : (
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: isActive ? s.bg : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isActive ? s.border : "rgba(255,255,255,0.1)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, flexShrink: 0,
                    }}>
                      {s.emoji}
                    </span>
                  )}
                  <div style={styles.scenarioBtnText}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.55, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {s.id}
                    </span>
                  </div>
                  {isActive && !isLoading && (
                    <span style={{
                      marginLeft: "auto", fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: s.color, opacity: 0.8,
                    }}>● ACTIVE</span>
                  )}
                </button>
              );
            })}
          </div>

          {scenarioError && (
            <div style={styles.errorBanner}>⚠ {scenarioError}</div>
          )}

          {/* Status badge when result loaded */}
          {activeResult && activeScenario && !scenarioLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 14px", borderRadius: 999,
                background: activeScenario.bg,
                border: `1px solid ${activeScenario.border}`,
                color: activeScenario.color,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              }}>
                {activeScenario.emoji} {activeScenario.label.toUpperCase()}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {activeResult.job_id}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                {Math.round((activeResult.confidence || 0) * 100)}% confidence
              </span>
              {activeResult.source === "mock" && (
                <span style={{
                  padding: "2px 8px", borderRadius: 999,
                  background: "rgba(245,166,35,0.08)",
                  border: "1px solid rgba(245,166,35,0.2)",
                  color: "#f5a623",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                }}>
                  OFFLINE / MOCK
                </span>
              )}
            </div>
          )}
        </section>

        {/* ── 3-column layout ── */}
        <div style={styles.grid}>

          {/* LEFT */}
          <div style={styles.leftPanel}>
            <FileUpload files={files} onChange={setFiles} />
            <div style={{ marginTop: "12px" }}>
              <AgentTimeline
                isRunning={isRunning}
                completedSteps={completedSteps}
                currentStep={currentStep}
              />
            </div>
            <button
              onClick={handleReconcile}
              disabled={isRunning}
              style={{
                ...styles.runBtn,
                opacity: isRunning ? 0.5 : 1,
                cursor: isRunning ? "not-allowed" : "pointer",
              }}
            >
              {phase === "running" ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <span style={styles.spinner} /> Processing…
                </span>
              ) : phase === "done" ? "↺ Reconcile Again" : "▶ Run Reconciliation"}
            </button>
            <div style={{ marginTop: "12px" }}>
              <ReviewQueue
                cases={DEMO_CASES}
                activeId={activeResult?.job_id}
                onSelect={(id) => {
                  const c = DEMO_CASES.find((x) => x.job_id === id);
                  if (c) handleSelectScenario(c.status);
                }}
              />
            </div>
          </div>

          {/* CENTER */}
          <div style={styles.centerPanel}>
            {!activeResult && !isRunning && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>◈</div>
                <div style={styles.emptyTitle}>Select a Scenario Above</div>
                <div style={styles.emptyDesc}>
                  Choose Matched, Needs Review, or Unmatched to load a live demo case from
                  the backend. Or upload your own files and click Run Reconciliation.
                </div>
              </div>
            )}
            {isRunning && !activeResult && (
              <div style={styles.emptyState}>
                <span style={{ ...styles.spinner, width: 32, height: 32, borderWidth: 3, margin: "0 auto 16px" }} />
                <div style={styles.emptyTitle}>Loading scenario…</div>
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

          {/* RIGHT */}
          <div style={styles.rightPanel}>
            {activeResult && (
              <>
                <ExtractedFieldsCard invoice={activeResult.invoice} payment={activeResult.payment} />
                <div style={{ marginTop: "12px" }}>
                  <ReportDownload jobId={activeResult?.job_id} disabled={isRunning} />
                </div>
                <div style={styles.statsCard}>
                  <div style={styles.statsPill}>SESSION SUMMARY</div>
                  <div style={styles.statsGrid}>
                    {[
                      { label: "Total Cases", value: SCENARIOS.length,                                                      color: "#e8e8e8" },
                      { label: "Matched",      value: "✓", color: "#00e5a0" },
                      { label: "Review",       value: "⚠", color: "#f5a623" },
                      { label: "Unmatched",    value: "✗", color: "#ff4d6d" },
                    ].map((s) => (
                      <div key={s.label} style={styles.statItem}>
                        <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                        <div style={styles.statLabel}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <span>AI Marathon 2026 · Track 3: Global Treasury Agent</span>
        <span>AI extracts &amp; explains · Deterministic code calculates &amp; validates</span>
        <span>Morpheus · Chutes · Frankfurter FX</span>
      </footer>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  root: { minHeight: "100vh", background: "#0a0a0f", color: "#e8e8e8", display: "flex", flexDirection: "column" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)", backdropFilter: "blur(8px)",
    position: "sticky", top: 0, zIndex: 50, flexWrap: "wrap", gap: "12px",
  },
  logo: { display: "flex", alignItems: "center", gap: "12px" },
  logoMark: { fontSize: "24px", color: "#a78bfa", lineHeight: 1 },
  logoName: { fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 800, color: "#e8e8e8", letterSpacing: "0.02em" },
  logoSub:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "1px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  statusPills: { display: "flex", gap: "6px", flexWrap: "wrap" },
  statusPill: {
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "3px 10px", borderRadius: "999px", border: "1px solid",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
  },
  main: { flex: 1, padding: "20px 28px", maxWidth: "1440px", width: "100%", margin: "0 auto", boxSizing: "border-box" },

  // Scenario selector
  scenarioSection: { marginBottom: "20px" },
  scenarioLabel:   { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  scenarioLabelText: {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)",
  },
  scenarioHint: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" },
  scenarioButtons: { display: "flex", gap: 10, flexWrap: "wrap" },
  scenarioBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px", borderRadius: 10,
    fontFamily: "'Syne', sans-serif",
    transition: "all 0.2s ease", minWidth: 170,
  },
  scenarioBtnText: { display: "flex", flexDirection: "column", gap: 2, textAlign: "left" },
  spinnerSmall: {
    width: 18, height: 18, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.15)",
    borderTopColor: "#fff",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  errorBanner: {
    marginTop: 10, padding: "8px 14px", borderRadius: 8,
    background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)",
    color: "#ff4d6d", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
  },

  grid: { display: "grid", gridTemplateColumns: "300px 1fr 280px", gap: "16px", alignItems: "flex-start" },
  leftPanel:   { display: "flex", flexDirection: "column" },
  centerPanel: { display: "flex", flexDirection: "column" },
  rightPanel:  { display: "flex", flexDirection: "column" },

  runBtn: {
    width: "100%", marginTop: "12px", padding: "14px", borderRadius: "10px",
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)", border: "none", color: "#fff",
    fontFamily: "'Syne', sans-serif", fontSize: "14px", fontWeight: 700, letterSpacing: "0.04em",
    transition: "all 0.2s ease", boxShadow: "0 4px 20px rgba(167,139,250,0.25)",
  },
  spinner: {
    width: 14, height: 14, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff",
    display: "inline-block", animation: "spin 0.7s linear infinite",
  },
  emptyState: {
    textAlign: "center", padding: "80px 40px",
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px",
  },
  emptyIcon:  { fontSize: "48px", color: "rgba(167,139,250,0.3)", marginBottom: "16px" },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "10px" },
  emptyDesc:  { fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.25)", lineHeight: "1.7", maxWidth: "380px", margin: "0 auto" },

  statsCard:  { marginTop: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px" },
  statsPill:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "14px" },
  statsGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  statItem:   { textAlign: "center", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" },
  statValue:  { fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, color: "#e8e8e8", marginBottom: "3px" },
  statLabel:  { fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" },

  footer: {
    display: "flex", justifyContent: "space-between", padding: "14px 28px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)",
    flexWrap: "wrap", gap: "6px",
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
`;
