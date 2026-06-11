import React, { useMemo } from "react";
import { fmtUSD } from "../../utils/formatters";

export default function CostValueBar({
  totalUSD,
  totalCostUSD,
  totalGainUSD,
  totalGainPct,
  hideValues
}) {
  const isProfit = totalUSD >= totalCostUSD;
  const costPct = totalUSD > 0 ? (totalCostUSD / totalUSD) * 100 : 0;
  const valuePct = totalCostUSD > 0 ? (totalUSD / totalCostUSD) * 100 : 0;

  if (totalCostUSD <= 0 && totalUSD <= 0) return null;

  return (
    <div className="card cost-vs-value-card stagger-1" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span className="card-section-title" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          ⚖️ สัดส่วนต้นทุนเทียบกับมูลค่าปัจจุบัน (Cost vs. Value)
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: isProfit ? "var(--gain)" : "var(--loss)" }}>
          {isProfit ? "กำไรสะสม" : "ขาดทุนสะสม"} {fmtUSD(totalGainUSD, hideValues)} ({totalGainPct.toFixed(2)}%)
        </span>
      </div>

      <div className="progress-bar-wrapper" style={{ height: 12, background: "#E2E8F0", borderRadius: 6, overflow: "hidden", display: "flex" }}>
        {isProfit ? (
          <>
            <div
              className="progress-bar-cost"
              style={{
                width: `${Math.max(5, Math.min(95, costPct))}%`,
                background: "var(--primary)",
                height: "100%",
                transition: "width 0.5s ease"
              }}
              title={`ต้นทุน: ${fmtUSD(totalCostUSD, hideValues)}`}
            />
            <div
              className="progress-bar-profit"
              style={{
                width: `${100 - Math.max(5, Math.min(95, costPct))}%`,
                background: "var(--gain)",
                height: "100%",
                transition: "width 0.5s ease"
              }}
              title={`กำไร: ${fmtUSD(totalUSD - totalCostUSD, hideValues)}`}
            />
          </>
        ) : (
          <>
            <div
              className="progress-bar-value"
              style={{
                width: `${Math.max(5, Math.min(95, valuePct))}%`,
                background: "var(--loss)",
                height: "100%",
                transition: "width 0.5s ease"
              }}
              title={`มูลค่าปัจจุบัน: ${fmtUSD(totalUSD, hideValues)}`}
            />
            <div
              className="progress-bar-loss"
              style={{
                width: `${100 - Math.max(5, Math.min(95, valuePct))}%`,
                background: "rgba(239, 68, 68, 0.15)",
                borderLeft: "1px dashed var(--loss)",
                height: "100%",
                transition: "width 0.5s ease"
              }}
              title={`ขาดทุน: ${fmtUSD(totalCostUSD - totalUSD, hideValues)}`}
            />
          </>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginTop: 8, color: "var(--text-muted)", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", marginRight: 6 }} />
            ต้นทุนรวม: <strong style={{ color: "var(--text-main)" }}>{fmtUSD(totalCostUSD, hideValues)}</strong>
          </span>
          <span>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: isProfit ? "var(--gain)" : "var(--loss)", marginRight: 6 }} />
            มูลค่าปัจจุบัน: <strong style={{ color: "var(--text-main)" }}>{fmtUSD(totalUSD, hideValues)}</strong>
          </span>
        </div>
        <span>
          ตัวคูณมูลค่า: <strong style={{ color: "var(--text-main)" }}>{(totalUSD / (totalCostUSD || 1)).toFixed(2)}x</strong>
        </span>
      </div>
    </div>
  );
}
