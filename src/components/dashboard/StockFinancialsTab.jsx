import React from "react";

export default function StockFinancialsTab({ metrics = {}, formatLargeNum, fmtPercent, fmtVal }) {
  const m = metrics.metric || {};

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* 1. Market Cap */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Market Capitalization (มูลค่าบริษัท)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{formatLargeNum(m.marketCapitalization)}</span>
      </div>

      {/* 2. Trailing P/E */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>P/E Ratio (Trailing)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(m.peTrailing, "")}</span>
      </div>

      {/* 3. Forward P/E */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>P/E Ratio (Forward)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(m.forwardPE, "")}</span>
      </div>

      {/* 4. P/S Ratio */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Price to Sales (P/S Ratio)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(m.psTrailing, "")}</span>
      </div>

      {/* 5. Price to Book */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Price to Book (P/B Ratio)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(m.pbCurrent, "")}</span>
      </div>

      {/* 6. PEG Ratio */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>PEG Ratio (P/E to Growth)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>{fmtVal(m.pegRatio, "")}</span>
      </div>

      {/* 7. Gross Margin */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Gross Margin TTM (อัตรากำไรขั้นต้น)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--gain)", marginTop: 2 }}>{fmtPercent(m.grossMarginTTM)}</span>
      </div>

      {/* 8. Net Profit Margin */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Net Profit Margin TTM (อัตรากำไรสุทธิ)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>{fmtPercent(m.netProfitMarginTTM)}</span>
      </div>

      {/* 9. ROE */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Return on Equity (ROE TTM)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--gain)", marginTop: 2 }}>{fmtPercent(m.returnOnEquity)}</span>
      </div>

      {/* 10. ROA */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Return on Assets (ROA TTM)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>{fmtPercent(m.returnOnAssets)}</span>
      </div>

      {/* 11. Debt to Equity */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Debt to Equity (หนี้สินต่อทุน)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>
          {m.debtToEquity != null ? `${m.debtToEquity.toFixed(2)}%` : "-"}
        </span>
      </div>

      {/* 12. Current Ratio */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>Current Ratio (ทุนหมุนเวียน)</span>
        <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)", marginTop: 2 }}>
          {m.currentRatio != null ? `${m.currentRatio.toFixed(2)}x` : "-"}
        </span>
      </div>
    </div>
  );
}
