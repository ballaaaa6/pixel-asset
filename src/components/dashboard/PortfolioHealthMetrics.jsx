import React from "react";
import { Shield, Activity } from "lucide-react";
import { getSector, getSectorBeta } from "../../utils/sectorHelpers";

export default function PortfolioHealthMetrics({ assets = [], avgCorrelation = 0, diversificationScore = 75 }) {
  // Get active holdings (excluding cash/fiat)
  const holdings = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat");
  const totalUSD = holdings.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  // Calculate Weighted Portfolio Beta
  let portfolioBeta = 1.0;
  if (holdings.length > 0 && totalUSD > 0) {
    let weightedBetaSum = 0;
    holdings.forEach(a => {
      const sector = getSector(a.symbol);
      const beta = getSectorBeta(sector);
      const weight = (a.valueUSD || 0) / totalUSD;
      weightedBetaSum += beta * weight;
    });
    portfolioBeta = parseFloat(weightedBetaSum.toFixed(2));
  }

  // Calculate Overall Portfolio Health Score
  // Combined from Diversification Score (80%) and Volatility deviation from market (20%)
  const betaDeviation = Math.abs(portfolioBeta - 1.0); // how far from 1.0
  const betaFactor = Math.max(0, 1 - betaDeviation); // 1.0 if beta=1.0, decreases as beta deviates
  const healthScore = Math.max(10, Math.min(100, Math.round(diversificationScore * 0.8 + betaFactor * 20)));

  // Risk Rating Label
  const getRiskRating = (beta) => {
    if (beta > 1.2) return { text: "ผันผวนสูง (Aggressive)", color: "var(--loss)" };
    if (beta < 0.8) return { text: "ปลอดภัย/ผันผวนต่ำ (Defensive)", color: "var(--gain)" };
    return { text: "ผันผวนปานกลาง (Moderate)", color: "var(--primary)" };
  };
  const risk = getRiskRating(portfolioBeta);

  return (
    <div 
      className="card" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        padding: 24, 
        background: "var(--bg-card)", 
        borderRadius: 24, 
        border: "1px solid var(--border)", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
        height: "100%",
        boxSizing: "border-box"
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <Activity size={18} style={{ color: "var(--primary)" }} /> สรุปสุขภาพพอร์ตและระดับความเสี่ยง
      </span>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24 }} className="dashboard-grid">
        {/* Left Column: Radial Health Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid var(--border)", paddingRight: 16 }}>
          <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="6" />
              <circle 
                cx="50" 
                cy="50" 
                r="42" 
                fill="none" 
                stroke={healthScore >= 80 ? "var(--gain)" : healthScore >= 55 ? "var(--primary)" : "var(--loss)"} 
                strokeWidth="6" 
                strokeDasharray={`${2 * Math.PI * 42}`} 
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - healthScore / 100)}`} 
                strokeLinecap="round" 
                transform="rotate(-90 50 50)" 
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", lineHeight: 1 }}>{healthScore}%</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", marginTop: 2 }}>HEALTH</span>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginTop: 12, textAlign: "center" }}>
            คะแนนสุขภาพพอร์ตโฟลิโอ
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textAlign: "center", lineHeight: 1.4 }}>
            คำนวณจากค่าความสัมพันธ์เฉลี่ยและการจัดกลุ่มอุตสาหกรรม
          </span>
        </div>

        {/* Right Column: Beta & Diversification stats */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          {/* Portfolio Beta */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                Portfolio Beta <Shield size={12} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, color: risk.color }}>{portfolioBeta}</span>
            </div>
            <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.03)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
              {/* Beta range visualization: 0.0 to 2.0. Center is 1.0 (50%). */}
              <div 
                style={{ 
                  position: "absolute", 
                  left: "50%", 
                  top: 0, 
                  bottom: 0, 
                  width: 2, 
                  background: "var(--border)", 
                  zIndex: 2 
                }} 
              />
              <div 
                style={{ 
                  width: `${Math.min(100, (portfolioBeta / 2) * 100)}%`, 
                  height: "100%", 
                  background: risk.color, 
                  borderRadius: 3,
                  transition: "width 1s ease-in-out"
                }} 
              />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", display: "block" }}>
              ระดับ: <span style={{ color: risk.color }}>{risk.text}</span>
            </span>
          </div>

          {/* Diversification Score */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)" }}>คะแนนการกระจายความเสี่ยง</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{diversificationScore}%</span>
            </div>
            <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.03)", borderRadius: 3, overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${diversificationScore}%`, 
                  height: "100%", 
                  background: diversificationScore >= 75 ? "var(--gain)" : diversificationScore >= 50 ? "var(--primary)" : "var(--loss)", 
                  borderRadius: 3,
                  transition: "width 1s ease"
                }} 
              />
            </div>
            <span style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.3 }}>
              ค่าสหสัมพันธ์เฉลี่ย: <strong style={{ color: "var(--text-main)" }}>{avgCorrelation}</strong> (ค่ายิ่งต่ำ ยิ่งกระจายความเสี่ยงดี)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
