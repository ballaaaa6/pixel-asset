import React from "react";
import { PieChart, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import { getSector, getSectorColor } from "../../utils/sectorHelpers";
import { fmtUSD } from "../../utils/formatters";

export default function PortfolioAllocationList({ assets = [], hideValues = false }) {
  const allHoldings = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat");
  const totalHoldingsValue = allHoldings.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  // Sector Breakdown
  const sectorMap = {};
  allHoldings.forEach(a => {
    const sec = getSector(a.symbol);
    sectorMap[sec] = (sectorMap[sec] || 0) + (a.valueUSD || 0);
  });

  const sectorBreakdown = Object.keys(sectorMap)
    .map(name => ({
      name,
      amount: sectorMap[name],
      pct: totalHoldingsValue > 0 ? (sectorMap[name] / totalHoldingsValue) * 100 : 0
    }))
    .sort((a, b) => b.pct - a.pct);

  // Individual Stock Concentration (Top Holdings)
  const stockBreakdown = allHoldings
    .map(a => ({
      symbol: a.symbol,
      amount: a.valueUSD || 0,
      pct: totalHoldingsValue > 0 ? ((a.valueUSD || 0) / totalHoldingsValue) * 100 : 0
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  // Clean symbol for display
  const getDisplaySymbol = (sym) => {
    return sym && sym.includes(".") ? sym.split(".")[0] : sym;
  };

  return (
    <div 
      className="card" 
      style={{ 
        padding: 24, 
        background: "var(--bg-card)", 
        borderRadius: 24, 
        border: "1px solid var(--border)", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.01)" 
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="dashboard-grid">
        {/* Left Column: Sector Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={16} style={{ color: "var(--primary)" }} /> สัดส่วนกลุ่มอุตสาหกรรม (Sectors)
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
            {sectorBreakdown.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>
                ไม่มีข้อมูลสินทรัพย์ที่ระบุอุตสาหกรรมได้
              </div>
            ) : (
              sectorBreakdown.map((sec, idx) => {
                const secColor = getSectorColor(sec.name);
                const isConcentrated = sec.pct > 40;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                      <span style={{ fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: secColor }} /> {sec.name}
                      </span>
                      <span style={{ fontWeight: 800, color: isConcentrated ? "var(--loss)" : "var(--text-muted)" }}>
                        {sec.pct.toFixed(1)}% {isConcentrated && "⚠️ เสี่ยงกระจุก"}
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.03)", borderRadius: 3, overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${sec.pct}%`, 
                          height: "100%", 
                          background: secColor, 
                          borderRadius: 3,
                          transition: "width 0.8s ease" 
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Top Assets Concentration */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={16} style={{ color: "var(--primary)" }} /> การกระจุกตัวของหุ้นรายตัว (Concentration)
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stockBreakdown.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>
                ไม่มีสินทรัพย์ในพอร์ตโฟลิโอ
              </div>
            ) : (
              stockBreakdown.map((stock, idx) => {
                const isOverConcentrated = stock.pct > 30;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "10px 14px", 
                      background: isOverConcentrated ? "rgba(239, 68, 68, 0.02)" : "rgba(0,0,0,0.01)", 
                      border: `1px solid ${isOverConcentrated ? "rgba(239, 68, 68, 0.12)" : "var(--border)"}`, 
                      borderRadius: 12 
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "var(--text-main)" }}>
                        {getDisplaySymbol(stock.symbol)}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                        มูลค่า: {fmtUSD(stock.amount, hideValues)}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: isOverConcentrated ? "var(--loss)" : "var(--text-main)" }}>
                        {stock.pct.toFixed(1)}%
                      </span>
                      {isOverConcentrated && (
                        <span style={{ fontSize: 8, color: "var(--loss)", fontWeight: 800, display: "flex", alignItems: "center", gap: 2 }}>
                          <AlertTriangle size={8} /> เกิน 30% (เสี่ยงสูง)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
