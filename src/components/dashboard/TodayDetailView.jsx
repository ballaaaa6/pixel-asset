import React, { useMemo } from "react";
import { getDisplaySymbol } from "../../utils/assetHelpers";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function TodayDetailView({ sortedAssets, todayChangeUSD, todayChangePct, exchangeRate, fmt }) {
  const { gainers, losers, movers, winner, loser } = useMemo(() => {
    const active = sortedAssets.filter(a => a.qty > 0.00001);
    const withChg = active.filter(a => a.todayChg !== 0);
    const sortedMovers = [...withChg].sort((a, b) => Math.abs(b.todayChg) - Math.abs(a.todayChg));
    const g = withChg.filter(a => a.todayChg > 0).length;
    const l = withChg.filter(a => a.todayChg < 0).length;

    // Find best percent gain today and worst percent loss today
    const sortedByPct = [...active].sort((a, b) => b.todayPct - a.todayPct);
    const win = sortedByPct.length > 0 && sortedByPct[0].todayPct > 0 ? sortedByPct[0] : null;
    const los = sortedByPct.length > 0 && sortedByPct[sortedByPct.length - 1].todayPct < 0 ? sortedByPct[sortedByPct.length - 1] : null;

    return { gainers: g, losers: l, movers: sortedMovers, winner: win, loser: los };
  }, [sortedAssets]);

  const todayUp = todayChangeUSD >= 0;

  // Sentiment analysis
  const { sentimentLabel, sentimentClass } = useMemo(() => {
    if (todayChangePct > 1.2) return { sentimentLabel: "พอร์ตกระทิงดุ (Bullish Day) 🚀", sentimentClass: "sentiment-bullish" };
    if (todayChangePct < -1.2) return { sentimentLabel: "พอร์ตหมีดุ (Bearish Day) 📉", sentimentClass: "sentiment-bearish" };
    return { sentimentLabel: "ตลาดทรงตัว (Sideways P&L) ⚖️", sentimentClass: "sentiment-sideways" };
  }, [todayChangePct]);

  return (
    <div>
      {/* Top Header Card */}
      <div style={{
        padding: 18,
        background: todayUp 
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(52, 211, 153, 0.08) 100%)"
          : "linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(248, 113, 113, 0.08) 100%)",
        border: todayUp ? "1.5px solid rgba(16, 185, 129, 0.35)" : "1.5px solid rgba(239, 68, 68, 0.35)",
        borderRadius: 16,
        marginBottom: 16,
        textAlign: "center",
        boxShadow: todayUp ? "0 10px 25px -5px rgba(16, 185, 129, 0.08)" : "0 10px 25px -5px rgba(239, 68, 68, 0.08)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>ความเคลื่อนไหวพอร์ตวันนี้</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: todayUp ? "var(--gain)" : "var(--loss)", marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          {todayChangeUSD !== 0 && (todayUp ? "+" : "-")}
          {fmt.usd(Math.abs(todayChangeUSD))}
          <span style={{ fontSize: 13, marginLeft: 6, fontWeight: 700 }} className={`kpi-badge ${todayUp ? "up" : "down"}`}>
            {todayUp ? "▲" : "▼"}{fmt.pct(todayChangePct)}
          </span>
        </div>
        <div style={{ fontSize: 14, color: todayUp ? "var(--gain)" : "var(--loss)", fontWeight: 700, marginTop: 2 }}>
          {todayChangeUSD >= 0 ? "+" : "-"}{fmt.thb(Math.abs(todayChangeUSD * exchangeRate))}
        </div>
        
        {/* Sentiment Badge */}
        <div className={`daily-sentiment-badge ${sentimentClass}`}>
          {sentimentLabel}
        </div>
      </div>

      {/* Grid 2x2: Market Movers Stats & Winner/Loser */}
      <div className="stats-grid-2x2">
        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ขึ้น/ลง วันนี้</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
            🟢 ขึ้น {gainers} | 🔴 ลง {losers}
          </span>
        </div>
        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ดาวรุ่งพุ่งแรงวันนี้</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--gain)", marginTop: 4 }}>
            {winner ? `${getDisplaySymbol(bestAsset?.symbol || winner.symbol)} (+${winner.todayPct.toFixed(2)}%)` : "—"}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>🔥 รายการที่เคลื่อนไหวแรงสุดวันนี้ (Movers)</div>
      
      <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
        {movers.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12.5 }}>ไม่มีข้อมูลการเคลื่อนไหวราคาในวันนี้</div>
        ) : (
          movers.map((item) => {
            const isUp = item.todayChg > 0;
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
                    จำนวนถือ: {item.qty} หน่วย
                  </div>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isUp ? "var(--gain)" : "var(--loss)" }}>
                    {isUp ? "+" : ""}{fmt.usd(item.todayChg)}
                  </div>
                  <div style={{ fontSize: 10.5, color: isUp ? "var(--gain)" : "var(--loss)", fontWeight: 700, marginTop: 1 }}>
                    {isUp ? "▲" : "▼"}{fmt.pct(item.todayPct)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
