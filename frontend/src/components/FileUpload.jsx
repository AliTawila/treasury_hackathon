// src/components/FileUpload.jsx
import React, { useRef, useState } from "react";

function UploadCard({ label, icon, accept, file, onFile, hint }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: file
          ? "1.5px solid rgba(0,229,160,0.4)"
          : dragging
          ? "1.5px dashed rgba(255,255,255,0.4)"
          : "1.5px dashed rgba(255,255,255,0.12)",
        borderRadius: "10px",
        padding: "18px 14px",
        cursor: "pointer",
        background: file
          ? "rgba(0,229,160,0.05)"
          : dragging
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.02)",
        transition: "all 0.2s ease",
        textAlign: "center",
        minHeight: "100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <span style={{ fontSize: "22px" }}>{icon}</span>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "12px", fontWeight: 600, color: file ? "#00e5a0" : "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
        {file ? file.name : label}
      </div>
      {file ? (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(0,229,160,0.7)" }}>
          {(file.size / 1024).toFixed(1)} KB — ready
        </div>
      ) : (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{hint}</div>
      )}
    </div>
  );
}

export default function FileUpload({ files, onChange }) {
  const update = (key) => (file) => onChange({ ...files, [key]: file });

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.pill}>DOCUMENT UPLOAD</span>
        <span style={styles.sub}>3 files required</span>
      </div>
      <div style={styles.grid}>
        <UploadCard
          label="Invoice"
          icon="🧾"
          accept=".pdf,.png,.jpg,.jpeg"
          file={files.invoice}
          onFile={update("invoice")}
          hint="PDF or image"
        />
        <UploadCard
          label="Payment Proof"
          icon="💳"
          accept=".pdf,.png,.jpg,.jpeg"
          file={files.paymentProof}
          onFile={update("paymentProof")}
          hint="Screenshot or PDF"
        />
        <UploadCard
          label="Bank Statement"
          icon="🏦"
          accept=".csv,.xlsx,.xls"
          file={files.bankStatement}
          onFile={update("bankStatement")}
          hint="CSV or Excel"
        />
      </div>
      <div style={styles.note}>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", fontFamily: "'IBM Plex Mono', monospace" }}>
          ✦ AI extracts fields — deterministic code handles all financial calculations
        </span>
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
    marginBottom: "16px",
  },
  pill: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.4)",
  },
  sub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "rgba(255,255,255,0.2)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  note: {
    marginTop: "12px",
    textAlign: "center",
  },
};
