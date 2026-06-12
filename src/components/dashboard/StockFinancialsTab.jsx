import React from "react";

export default function StockFinancialsTab({ metrics = {}, formatLargeNum, fmtPercent, fmtVal }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Market Capitalization (มูลค่าบริษัท)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{formatLargeNum(metrics.metric?.marketCapitalization)}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>P/E Ratio (Trailing)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(metrics.metric?.peTrailing)}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Gross Margin TTM (อัตรากำไรขั้นต้น)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--gain)", marginTop: 2 }}>{fmtPercent(metrics.metric?.grossMarginTTM)}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Net Profit Margin TTM (อัตรากำไรสุทธิ)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>{fmtPercent(metrics.metric?.netProfitMarginTTM)}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Price to Book (MRQ)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(metrics.metric?.pbCurrent)}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>EPS (TTM)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(metrics.metric?.epsTTM, "$")}</span>
      </div>
    </div>
  );
}
