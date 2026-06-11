import React, { useMemo } from "react";
import { getDisplaySymbol } from "../../utils/assetHelpers";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function PnLDetailView({ sortedAssets, totalGainUSD, totalGainTHB, totalGainPct, totalRealizedUSD, totalUnrealizedUSD, fmt }) {
  const sortedByPnL = useMemo(() => {
    return [...sortedAssets].sort((a, b) => b.totalPnL - a.totalPnL);
  }, [sortedAssets]);

  const totalUp = totalGainUSD >= 0;

  return (
    <div>
      {/* Top Header Card */}
      <div style={{
        padding: 18,
        background: totalUp 
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(52, 211, 153, 0.08) 100%)"
          : "linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(248, 113, 113, 0.08) 100%)",
        border: totalUp ? "1.5px solid rgba(16, 185, 129, 0.35)" : "1.5px solid rgba(239, 68, 68, 0.35)",
        borderRadius: 16,
        marginBottom: 18,
        textAlign: "center",
        boxShadow: totalUp ? "0 10px 25px -5px rgba(16, 185, 129, 0.08)" : "0 10px 25px -5px rgba(239, 68, 68, 0.08)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>ผลตอบแทนสะสมรวมทั้งหมด</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: totalUp ? "var(--gain)" : "var(--loss)", marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          {totalGainUSD >= 0 ? "+" : ""}{fmt.usd(totalGainUSD)}
          <span style={{ fontSize: 14, marginLeft: 6, fontWeight: 700 }} className={`kpi-badge ${totalUp ? "up" : "down"}`}>
            {totalUp ? "▲" : "▼"}{fmt.pct(totalGainPct)}
          </span>
        </div>
        <div style={{ fontSize: 14, color: totalGainTHB >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: 700, marginTop: 2 }}>
          {totalGainTHB >= 0 ? "+" : ""}{fmt.thb(totalGainTHB)}
        </div>

        {/* Realized vs Unrealized Breakdown */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 14, background: "rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: 10 }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>รับรู้แล้ว (Realized)</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: totalRealizedUSD >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 2 }}>{fmt.usd(totalRealizedUSD)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>ยังไม่รับรู้ (Unrealized)</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: totalUnrealizedUSD >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 2 }}>{fmt.usd(totalUnrealizedUSD)}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>🏆 อันดับผลตอบแทนรายสินทรัพย์ (P&L Ranking)</div>
      
      <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
        {sortedByPnL.map((item) => {
          const itemPnL = item.totalPnL || 0;
          const isGain = itemPnL >= 0;
          return (
            <div key={item.id} className="kpi-detail-list-item">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{getDisplaySymbol(item.symbol)}</span>
                  <span className={`badge-type ${item.category || "stock"}`} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 4 }}>
                    {CATEGORY_LABELS[item.category] || item.category || "stock"}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1 }}>
                  ทุน: {fmt.usd(item.totalInvested)}
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: isGain ? "var(--gain)" : "var(--loss)" }}>
                  {isGain ? "+" : ""}{fmt.usd(itemPnL)}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 1 }}>
                  ({fmt.pct(item.totalPnLPct || item.gainPct)})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
