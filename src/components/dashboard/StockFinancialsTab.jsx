import React from "react";

export default function StockFinancialsTab({ metrics = {}, formatLargeNum, fmtPercent, fmtVal }) {
  const m = metrics.metric || {};

  const financialMetrics = [
    {
      label: "Market Capitalization (มูลค่าบริษัท)",
      value: formatLargeNum(m.marketCapitalization),
      color: "var(--text-main)"
    },
    {
      label: "Enterprise Value (มูลค่ากิจการ)",
      value: formatLargeNum(m.enterpriseValue),
      color: "var(--text-main)"
    },
    {
      label: "P/E Ratio (Trailing)",
      value: fmtVal(m.peTrailing, ""),
      color: "var(--text-main)"
    },
    {
      label: "P/E Ratio (Forward)",
      value: fmtVal(m.forwardPE, ""),
      color: "var(--text-main)"
    },
    {
      label: "Price to Sales (P/S Ratio)",
      value: fmtVal(m.psTrailing, ""),
      color: "var(--text-main)"
    },
    {
      label: "Price to Book (P/B Ratio)",
      value: fmtVal(m.pbCurrent, ""),
      color: "var(--text-main)"
    },
    {
      label: "PEG Ratio (P/E to Growth)",
      value: fmtVal(m.pegRatio, ""),
      color: "var(--text-main)"
    },
    {
      label: "EV to Revenue (EV/Revenue)",
      value: m.evToRevenue != null ? `${m.evToRevenue.toFixed(2)}x` : "-",
      color: "var(--text-main)"
    },
    {
      label: "EV to EBITDA (EV/EBITDA)",
      value: m.evToEbitda != null ? `${m.evToEbitda.toFixed(2)}x` : "-",
      color: "var(--text-main)"
    },
    {
      label: "Gross Margin TTM (อัตรากำไรขั้นต้น)",
      value: fmtPercent(m.grossMarginTTM),
      color: "var(--gain)"
    },
    {
      label: "Net Profit Margin TTM (อัตรากำไรสุทธิ)",
      value: fmtPercent(m.netProfitMarginTTM),
      color: "var(--primary)"
    },
    {
      label: "Return on Equity (ROE TTM)",
      value: fmtPercent(m.returnOnEquity),
      color: "var(--gain)"
    },
    {
      label: "Return on Assets (ROA TTM)",
      value: fmtPercent(m.returnOnAssets),
      color: "var(--primary)"
    },
    {
      label: "EPS TTM (กำไรต่อหุ้น)",
      value: fmtVal(m.epsTTM),
      color: "var(--text-main)"
    },
    {
      label: "Debt to Equity (หนี้สินต่อทุน)",
      value: m.debtToEquity != null ? `${m.debtToEquity.toFixed(2)}%` : "-",
      color: "var(--text-main)"
    },
    {
      label: "Current Ratio (ทุนหมุนเวียน)",
      value: m.currentRatio != null ? `${m.currentRatio.toFixed(2)}x` : "-",
      color: "var(--text-main)"
    },
    {
      label: "Quick Ratio (สินทรัพย์คล่องตัวสูง)",
      value: m.quickRatio != null ? `${m.quickRatio.toFixed(2)}x` : "-",
      color: "var(--text-main)"
    },
    {
      label: "Operating Cash Flow TTM (กระแสเงินสดดำเนินงาน)",
      value: formatLargeNum(m.operatingCashflow),
      color: "var(--text-main)"
    },
    {
      label: "Free Cash Flow TTM (กระแสเงินสดอิสระ)",
      value: formatLargeNum(m.freeCashflow),
      color: "var(--text-main)"
    },
    {
      label: "Div Yield Trailing (อัตราเงินปันผลย้อนหลัง)",
      value: fmtPercent(m.dividendYieldTrailing),
      color: "var(--gain)"
    },
    {
      label: "Div Yield Forward (อัตราเงินปันผลคาดการณ์)",
      value: fmtPercent(m.dividendYieldForward),
      color: "var(--gain)"
    },
    {
      label: "Dividend Per Share TTM (เงินปันผลต่อหุ้นรวม)",
      value: fmtVal(m.dividendPerShareTTM),
      color: "var(--text-main)"
    }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {financialMetrics.map((metric, idx) => (
        <div 
          key={idx} 
          style={{ 
            padding: 10, 
            background: "rgba(0,0,0,0.015)", 
            borderRadius: 12, 
            border: "1px solid var(--border)", 
            display: "flex", 
            flexDirection: "column" 
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 800 }}>{metric.label}</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: metric.color, marginTop: 2 }}>{metric.value}</span>
        </div>
      ))}
    </div>
  );
}
