import React, { useMemo } from "react";
import { fmtUSD, fmtTHB, fmtPct } from "../../utils/formatters";
import GlowTiltCard from "../common/GlowTiltCard";
import AnimatedCounter from "../common/AnimatedCounter";

export default function KPIRow({
  totalUSD,
  totalTHB,
  todayChange,
  todayChangeTHB,
  todayChangePct,
  totalGain,
  totalGainTHB,
  totalGainPct,
  bestAsset,
  loading,
  hideValues,
  onCardClick
}) {
  const fmt = useMemo(() => ({
    usd: (n) => fmtUSD(n, false),
    thb: (n, decimals = 2) => fmtTHB(n, decimals, false),
    pct: fmtPct,
  }), []);

  if (loading) {
    return (
      <div className="kpi-row stagger-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="kpi-card">
            <div className="skeleton skeleton-text" style={{ width: "60%", marginBottom: 10 }} />
            <div className="skeleton skeleton-text xl" style={{ width: "80%", marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: "40%" }} />
          </div>
        ))}
      </div>
    );
  }

  const todayUp = todayChange >= 0;
  const totalUp = totalGain >= 0;

  return (
    <div className="kpi-row stagger-1">
      <GlowTiltCard className="kpi-card primary clickable" onClick={() => onCardClick?.("value")}>
        <div className="kpi-label">💰 มูลค่ารวม</div>
        <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`}>
          <AnimatedCounter value={totalUSD} formatFn={fmt.usd} />
        </div>
        <div className={`kpi-sub ${hideValues ? "privacy-blurred" : ""}`}>
          <AnimatedCounter value={totalTHB} formatFn={(v) => fmt.thb(v, 2)} />
        </div>
      </GlowTiltCard>

      <GlowTiltCard className={`kpi-card clickable ${todayUp ? "gain-card" : "loss-card"}`} onClick={() => onCardClick?.("today")}>
        <div className="kpi-label">📅 วันนี้</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`} style={{ color: todayChange > 0 ? "var(--gain)" : todayChange < 0 ? "var(--loss)" : "var(--text-muted)", margin: 0, whiteSpace: "nowrap" }}>
            {todayChange > 0 ? "+" : todayChange < 0 ? "-" : ""}
            <AnimatedCounter value={Math.abs(todayChange || 0)} formatFn={fmt.usd} />
          </div>
          <span className={`kpi-badge ${todayChange > 0 ? "up" : todayChange < 0 ? "down" : "up"} ${hideValues ? "privacy-blurred" : ""}`} style={{ margin: 0, whiteSpace: "nowrap" }}>
            {todayChange > 0 ? "▲" : todayChange < 0 ? "▼" : "▲"} {fmt.pct(todayChangePct || 0)}
          </span>
        </div>
        <div className={`kpi-sub ${hideValues ? "privacy-blurred" : ""}`} style={{ marginTop: 2 }}>
          {todayChange > 0 ? "+" : todayChange < 0 ? "-" : ""}
          <AnimatedCounter value={Math.abs(todayChangeTHB || 0)} formatFn={(v) => fmt.thb(v, 2)} />
        </div>
      </GlowTiltCard>

      <GlowTiltCard className={`kpi-card clickable ${totalUp ? "gain-card" : "loss-card"}`} onClick={() => onCardClick?.("pnl")}>
        <div className="kpi-label">📊 กำไร/ขาดทุนรวม</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <div className={`kpi-value ${hideValues ? "privacy-blurred" : ""}`} style={{ color: totalGain > 0 ? "var(--gain)" : totalGain < 0 ? "var(--loss)" : "var(--text-muted)", margin: 0, whiteSpace: "nowrap" }}>
            {totalGain > 0 ? "+" : totalGain < 0 ? "-" : ""}
            <AnimatedCounter value={Math.abs(totalGain || 0)} formatFn={fmt.usd} />
          </div>
          <span className={`kpi-badge ${totalGain > 0 ? "up" : totalGain < 0 ? "down" : "up"} ${hideValues ? "privacy-blurred" : ""}`} style={{ margin: 0, whiteSpace: "nowrap" }}>
            {totalGain > 0 ? "▲" : totalGain < 0 ? "▼" : "▲"} {fmt.pct(totalGainPct || 0)}
          </span>
        </div>
        <div className={`kpi-sub ${hideValues ? "privacy-blurred" : ""}`} style={{ marginTop: 2 }}>
          {totalGain > 0 ? "+" : totalGain < 0 ? "-" : ""}
          <AnimatedCounter value={Math.abs(totalGainTHB || 0)} formatFn={(v) => fmt.thb(v, 2)} />
        </div>
      </GlowTiltCard>

      <GlowTiltCard className="kpi-card gold-card clickable" onClick={() => onCardClick?.("best")}>
        <div className="kpi-label">🏆 ดีที่สุด</div>
        {bestAsset ? (
          <>
            <div className="kpi-value small">{bestAsset.symbol}</div>
            <div className={`kpi-sub ${hideValues ? "privacy-blurred" : ""}`} style={{ color: "var(--gain)", fontWeight: 700 }}>
              {fmt.pct(bestAsset.pct)}
            </div>
          </>
        ) : (
          <div className="kpi-value small" style={{ color: "var(--text-muted)" }}>—</div>
        )}
      </GlowTiltCard>
    </div>
  );
}
