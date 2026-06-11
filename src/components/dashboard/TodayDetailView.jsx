import React, { useMemo } from "react";
import { getDisplaySymbol } from "../../utils/assetHelpers";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function TodayDetailView({ sortedAssets, todayChangeUSD, todayChangePct, exchangeRate, fmt }) {
  const { gainers, losers, movers } = useMemo(() => {
    const active = sortedAssets.filter(a => a.qty > 0.00001 && a.todayChg !== 0);
    const sortedMovers = [...active].sort((a, b) => Math.abs(b.todayChg) - Math.abs(a.todayChg));
    const g = active.filter(a => a.todayChg > 0).length;
    const l = active.filter(a => a.todayChg < 0).length;
    return { gainers: g, losers: l, movers: sortedMovers };
  }, [sortedAssets]);

  const todayUp = todayChangeUSD >= 0;

  return (
    <div>
      {/* Top Header Card */}
      <div style={{
        padding: 16,
        background: todayUp 
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.04) 100%)"
          : "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(248, 113, 113, 0.04) 100%)",
        border: todayUp ? "1.5px solid rgba(16, 185, 129, 0.25)" : "1.5px solid rgba(239, 68, 68, 0.25)",
        borderRadius: 14,
        marginBottom: 16,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>ความเคลื่อนไหวพอร์ตวันนี้</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: todayUp ? "var(--gain)" : "var(--loss)", marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          {todayChangeUSD !== 0 && (todayUp ? "+" : "-")}
          {fmt.usd(Math.abs(todayChangeUSD))}
          <span style={{ fontSize: 14, marginLeft: 6, fontWeight: 700 }} className={`kpi-badge ${todayUp ? "up" : "down"}`}>
            {todayUp ? "▲" : "▼"}{fmt.pct(todayChangePct)}
          </span>
        </div>
        <div style={{ fontSize: 14, color: todayUp ? "var(--gain)" : "var(--loss)", fontWeight: 700, marginTop: 2 }}>
          {todayChangeUSD >= 0 ? "+" : "-"}{fmt.thb(Math.abs(todayChangeUSD * exchangeRate))}
        </div>
        
        {/* Gainers vs Losers Meter */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, fontSize: 11.5, fontWeight: 700 }}>
          <span style={{ color: "var(--gain)" }}>🟢 ขึ้น {gainers} ตัว</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span style={{ color: "var(--loss)" }}>🔴 ลง {losers} ตัว</span>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>🔥 รายการที่เคลื่อนไหวแรงสุดวันนี้ (Movers)</div>
      
      <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
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
