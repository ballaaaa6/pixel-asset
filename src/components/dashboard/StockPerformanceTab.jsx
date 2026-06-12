import React from "react";

export default function StockPerformanceTab({ metrics = {} }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาสูงสุดใน 52 สัปดาห์</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--gain)", marginTop: 2, display: "block" }}>${metrics.metric?.["52WeekHigh"]?.toFixed(2) ?? "-"}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาต่ำสุดใน 52 สัปดาห์</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--loss)", marginTop: 2, display: "block" }}>${metrics.metric?.["52WeekLow"]?.toFixed(2) ?? "-"}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>อัตราการจ่ายปันผล (Dividend)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>${metrics.metric?.dividendPerShareTTM?.toFixed(2) ?? "0.00"}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>อัตราเงินปันผลตอบแทน (Yield)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", marginTop: 2, display: "block" }}>{metrics.metric?.dividendYield5YAvg ? `${metrics.metric.dividendYield5YAvg.toFixed(2)}% (5Y Avg)` : "-"}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาเฉลี่ย 50 วัน (50-Day MA)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>${metrics.metric?.["50DayAverage"]?.toFixed(2) ?? "-"}</span>
      </div>
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาเฉลี่ย 200 วัน (200-Day MA)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>${metrics.metric?.["200DayAverage"]?.toFixed(2) ?? "-"}</span>
      </div>
    </div>
  );
}
