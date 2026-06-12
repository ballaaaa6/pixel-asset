import React from "react";

export default function StockPerformanceTab({ metrics = {}, currency = "USD" }) {
  const m = metrics.metric || {};
  const prefix = currency === "THB" ? "฿" : "$";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* 1. 52W High */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาสูงสุดใน 52 สัปดาห์</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--gain)", marginTop: 2, display: "block" }}>
          {m["52WeekHigh"] != null ? `${prefix}${m["52WeekHigh"].toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
        </span>
      </div>

      {/* 2. 52W Low */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาต่ำสุดใน 52 สัปดาห์</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--loss)", marginTop: 2, display: "block" }}>
          {m["52WeekLow"] != null ? `${prefix}${m["52WeekLow"].toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
        </span>
      </div>

      {/* 3. Dividend Rate */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>อัตราการจ่ายปันผล (Dividend Rate)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>
          {m.dividendPerShareTTM != null ? `${prefix}${m.dividendPerShareTTM.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${prefix}0.00`}
        </span>
      </div>

      {/* 4. Yield (Trailing / Forward) */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ปันผลตอบแทน (Yield Trailing / Forward)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", marginTop: 2, display: "block" }}>
          {m.dividendYieldTrailing != null ? `${m.dividendYieldTrailing.toFixed(2)}%` : "-"} / {m.dividendYieldForward != null ? `${m.dividendYieldForward.toFixed(2)}%` : "-"}
        </span>
      </div>

      {/* 5. 5Y Avg Yield */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ปันผลตอบแทนเฉลี่ย 5 ปี (5Y Avg Yield)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", marginTop: 2, display: "block" }}>
          {m.dividendYield5YAvg != null ? `${m.dividendYield5YAvg.toFixed(2)}%` : "-"}
        </span>
      </div>

      {/* 6. 50-Day MA */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาเฉลี่ย 50 วัน (50-Day MA)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>
          {m["50DayAverage"] != null ? `${prefix}${m["50DayAverage"].toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
        </span>
      </div>

      {/* 7. 200-Day MA */}
      <div style={{ padding: 10, background: "rgba(0,0,0,0.015)", borderRadius: 12, border: "1px solid var(--border)", gridColumn: "span 2" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>ราคาเฉลี่ย 200 วัน (200-Day MA)</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 2, display: "block" }}>
          {m["200DayAverage"] != null ? `${prefix}${m["200DayAverage"].toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "-"}
        </span>
      </div>
    </div>
  );
}
