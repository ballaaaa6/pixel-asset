import React, { useMemo } from "react";
import { fmtUSD, fmtTHB } from "../../utils/formatters";
import NumberTicker from "../common/NumberTicker";

export default function CostValueBar({
  totalUSD,
  totalCostUSD,
  totalGainUSD,
  totalGainPct,
  exchangeRate,
  hideValues
}) {
  const isProfit = totalUSD >= totalCostUSD;
  const costPct = totalUSD > 0 ? (totalCostUSD / totalUSD) * 100 : 0;
  const valuePct = totalCostUSD > 0 ? (totalUSD / totalCostUSD) * 100 : 0;

  if (totalCostUSD <= 0 && totalUSD <= 0) return null;

  const gainUSDStr = fmtUSD(totalGainUSD, hideValues);
  const gainTHBStr = fmtTHB(totalGainUSD * exchangeRate, 2, hideValues);
  const gainPctStr = `${totalGainPct.toFixed(2)}%`;

  const costUSDStr = fmtUSD(totalCostUSD, hideValues);
  const costTHBStr = fmtTHB(totalCostUSD * exchangeRate, 2, hideValues);

  const valUSDStr = fmtUSD(totalUSD, hideValues);
  const valTHBStr = fmtTHB(totalUSD * exchangeRate, 2, hideValues);

  const multStr = `${(totalUSD / (totalCostUSD || 1)).toFixed(2)}x`;

  return (
    <div className="card cost-vs-value-card stagger-1" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span className="card-section-title" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          ⚖️ สัดส่วนต้นทุนเทียบกับมูลค่าปัจจุบัน (Cost vs. Value)
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: isProfit ? "var(--gain)" : "var(--loss)", display: "inline-flex", gap: 3, flexWrap: "wrap" }}>
          <span>{isProfit ? "กำไรสะสม: " : "ขาดทุนสะสม: "}</span>
          <NumberTicker value={gainUSDStr} />
          <span>(</span>
          <NumberTicker value={gainTHBStr} />
          <span>)</span>
          <span>(</span>
          <NumberTicker value={gainPctStr} />
          <span>)</span>
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
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", marginRight: 6 }} />
            ต้นทุนรวม:&nbsp;
            <strong style={{ color: "var(--text-main)" }}><NumberTicker value={costUSDStr} /> (<NumberTicker value={costTHBStr} />)</strong>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: isProfit ? "var(--gain)" : "var(--loss)", marginRight: 6 }} />
            มูลค่าปัจจุบัน:&nbsp;
            <strong style={{ color: "var(--text-main)" }}><NumberTicker value={valUSDStr} /> (<NumberTicker value={valTHBStr} />)</strong>
          </span>
        </div>
        <span>
          ตัวคูณมูลค่า: <strong style={{ color: "var(--text-main)" }}><NumberTicker value={multStr} /></strong>
        </span>
      </div>
    </div>
  );
}
