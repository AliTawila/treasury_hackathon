// src/components/ExtractedFieldsCard.jsx
import React, { useState } from "react";

function Field({ label, value, warn }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={{ ...styles.fieldValue, color: empty ? "rgba(255,255,255,0.2)" : warn ? "#f5a623" : "#e8e8e8" }}>
        {empty ? "—" : String(value)}
        {warn && <span style={styles.warnDot} title="Uncertain extraction">⚠</span>}
      </div>
    </div>
  );
}

export default function ExtractedFieldsCard({ invoice, payment }) {
  const [tab, setTab] = useState("invoice");

  const data = tab === "invoice" ? invoice : payment;
  const conf = data?.extraction_confidence;
  const warnings = data?.warnings || [];

  const invoiceFields = [
    { label: "Invoice No.", key: "invoice_number" },
    { label: "Payer", key: "payer" },
    { label: "Payee", key: "payee" },
    { label: "Amount", key: "amount" },
    { label: "Currency", key: "currency" },
    { label: "Date", key: "date" },
    { label: "Due Date", key: "due_date" },
  ];

  const paymentFields = [
    { label: "Sender", key: "sender" },
    { label: "Receiver", key: "receiver" },
    { label: "Amount Sent", key: "amount_sent" },
    { label: "Currency", key: "currency_sent" },
    { label: "Date", key: "date" },
    { label: "Reference", key: "reference" },
    { label: "Method", key: "method" },
  ];

  const fields = tab === "invoice" ? invoiceFields : paymentFields;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.pill}>EXTRACTED FIELDS</span>
        {conf !== undefined && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: conf > 0.9 ? "#00e5a0" : "#f5a623" }}>
            {Math.round(conf * 100)}% confidence
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["invoice", "payment"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              borderBottom: tab === t ? "2px solid rgba(255,255,255,0.6)" : "2px solid transparent",
              color: tab === t ? "#e8e8e8" : "rgba(255,255,255,0.3)",
            }}
          >
            {t === "invoice" ? "Invoice" : "Payment Proof"}
          </button>
        ))}
      </div>

      <div style={styles.fields}>
        {fields.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            value={data?.[f.key]}
            warn={warnings.some((w) => w.toLowerCase().includes(f.key.replace("_", " ")))}
          />
        ))}
      </div>

      {warnings.length > 0 && (
        <div style={styles.warningBox}>
          {warnings.map((w, i) => (
            <div key={i} style={styles.warningItem}>⚠ {w}</div>
          ))}
        </div>
      )}

      <div style={styles.source}>
        <span style={styles.sourceLabel}>Extracted by</span>
        <span style={styles.sourceValue}>Morpheus Vision API</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    padding: "20px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  pill: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.4)",
  },
  tabs: {
    display: "flex",
    gap: "0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    marginBottom: "14px",
  },
  tab: {
    background: "none",
    border: "none",
    padding: "6px 14px",
    cursor: "pointer",
    fontFamily: "'Syne', sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.03em",
    transition: "all 0.2s",
  },
  fields: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 16px",
  },
  field: {
    padding: "6px 0",
  },
  fieldLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.05em",
    marginBottom: "2px",
  },
  fieldValue: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "13px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  warnDot: {
    fontSize: "10px",
    color: "#f5a623",
  },
  warningBox: {
    marginTop: "12px",
    background: "rgba(245,166,35,0.08)",
    border: "1px solid rgba(245,166,35,0.2)",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  warningItem: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "11px",
    color: "#f5a623",
    marginBottom: "4px",
  },
  source: {
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sourceLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.2)",
  },
  sourceValue: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.5)",
    fontWeight: 600,
  },
};
