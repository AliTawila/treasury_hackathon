// src/components/FxFeeTraceCards.jsx
import React from "react";

function TraceRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 600, color: highlight || "#e8e8e8" }}>{value}</span>
    </div>
  );
}

export default function FxFeeTraceCards({ fxTrace, feeTrace }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {/* FX Rate Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span style={styles.pill}>FX RATE TRACE</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>Frankfurter API</span>
        </div>
        {fxTrace ? (
          <>
            <TraceRow label="Base Currency" value={fxTrace.base_currency} />
            <TraceRow label="Target Currency" value={fxTrace.target_currency} />
            <TraceRow label="Exchange Rate" value={fxTrace.rate?.toFixed(4)} highlight="#a78bfa" />
            <TraceRow label="Rate Date" value={fxTrace.rate_date} />
            <TraceRow label="Converted Amount" value={`${fxTrace.target_currency} ${fxTrace.converted_amount?.toFixed(2)}`} highlight="#a78bfa" />
          </>
        ) : (
          <div style={styles.empty}>No FX data yet</div>
        )}
      </div>

      {/* Fee Rule Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span style={styles.pill}>FEE RULE TRACE</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>Deterministic</span>
        </div>
        {feeTrace ? (
          <>
            <TraceRow label="Rule Applied" value={feeTrace.rule_name} />
            <TraceRow label="% Fee" value={`${(feeTrace.percentage_fee * 100).toFixed(1)}%`} />
            <TraceRow label="Flat Fee" value={feeTrace.flat_fee ? `${feeTrace.currency} ${feeTrace.flat_fee.toFixed(2)}` : "—"} />
            <TraceRow label="Fee Amount" value={`${feeTrace.currency} ${feeTrace.fee_amount?.toFixed(2)}`} highlight="#f87171" />
            <TraceRow label="Net After Fee" value={`${feeTrace.currency} ${feeTrace.net_after_fee?.toFixed(2)}`} highlight="#00e5a0" />
          </>
        ) : (
          <div style={styles.empty}>No fee data yet</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "16px",
  },
  cardTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  pill: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.4)",
  },
  empty: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    padding: "20px 0",
  },
};
