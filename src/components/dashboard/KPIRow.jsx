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
    usd: (n) => fmtUSD(n, hideValues),
    thb: (n, decimals = 2) => fmtTHB(n, decimals, hideValues),
    pct: fmtPct,
  }), [hideValues]);

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
        <div className="kpi-value">
          <AnimatedCounter value={totalUSD} formatFn={fmt.usd} />
        </div>
        <div className="kpi-sub">
          <AnimatedCounter value={totalTHB} formatFn={(v) => fmt.thb(v, 2)} />
        </div>
      </GlowTiltCard>

      <GlowTiltCard className={`kpi-card clickable ${todayUp ? "gain-card" : "loss-card"}`} onClick={() => onCardClick?.("today")}>
        <div className="kpi-label">📅 วันนี้</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <div className="kpi-value" style={{ color: todayUp ? "var(--gain)" : "var(--loss)", margin: 0, whiteSpace: "nowrap" }}>
            {todayChange !== 0 ? (todayUp ? "+" : "-") : ""}
            <AnimatedCounter value={todayChange !== 0 ? Math.abs(todayChange) : 0} formatFn={(v) => v === 0 ? "—" : fmt.usd(v)} />
          </div>
          {todayChange !== 0 && (
            <span className={`kpi-badge ${todayUp ? "up" : "down"}`} style={{ margin: 0, whiteSpace: "nowrap" }}>
              {todayUp ? "▲" : "▼"} {fmt.pct(todayChangePct)}
            </span>
          )}
        </div>
        {todayChange !== 0 && (
          <div className="kpi-sub" style={{ marginTop: 2 }}>
            {todayUp ? "+" : "-"}
            <AnimatedCounter value={Math.abs(todayChangeTHB)} formatFn={(v) => fmt.thb(v, 2)} />
          </div>
        )}
      </GlowTiltCard>

      <GlowTiltCard className={`kpi-card clickable ${totalUp ? "gain-card" : "loss-card"}`} onClick={() => onCardClick?.("pnl")}>
        <div className="kpi-label">📊 กำไร/ขาดทุนรวม</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <div className="kpi-value" style={{ color: totalUp ? "var(--gain)" : "var(--loss)", margin: 0, whiteSpace: "nowrap" }}>
            {totalGain !== 0 ? (totalUp ? "+" : "-") : ""}
            <AnimatedCounter value={totalGain !== 0 ? Math.abs(totalGain) : 0} formatFn={(v) => v === 0 ? "—" : fmt.usd(v)} />
          </div>
          {totalGain !== 0 && (
            <span className={`kpi-badge ${totalUp ? "up" : "down"}`} style={{ margin: 0, whiteSpace: "nowrap" }}>
              {totalUp ? "▲" : "▼"} {fmt.pct(totalGainPct)}
            </span>
          )}
        </div>
        {totalGain !== 0 && (
          <div className="kpi-sub" style={{ marginTop: 2 }}>
            {totalUp ? "+" : "-"}
            <AnimatedCounter value={Math.abs(totalGainTHB)} formatFn={(v) => fmt.thb(v, 2)} />
          </div>
        )}
      </GlowTiltCard>

      <GlowTiltCard className="kpi-card gold-card clickable" onClick={() => onCardClick?.("best")}>
        <div className="kpi-label">🏆 ดีที่สุด</div>
        {bestAsset ? (
          <>
            <div className="kpi-value small">{bestAsset.symbol}</div>
            <div className="kpi-sub" style={{ color: "var(--gain)", fontWeight: 700 }}>
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
