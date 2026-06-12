import React from "react";
import { getSector, getSectorBeta } from "../../utils/sectorHelpers";
import { Activity, Shield, TrendingUp } from "lucide-react";

export default function EconomicSentimentWidget({ assets = [] }) {
  const fearGreedValue = 68;

  const getFearGreedLabel = (v) => {
    if (v < 20) return "Extreme Fear (กลัวจัด)";
    if (v < 40) return "Fear (กลัว)";
    if (v < 60) return "Neutral (ปกติ)";
    if (v < 80) return "Greed (โลภ)";
    return "Extreme Greed (โลภจัด)";
  };

  const getFearGreedColor = (v) => {
    if (v < 20) return "#EF4444";
    if (v < 40) return "#F59E0B";
    if (v < 60) return "#EAB308";
    if (v < 80) return "#10B981";
    return "#047857";
  };

  // Calculate Weighted Portfolio Beta
  const holdings = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat");
  const totalUSD = holdings.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

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

  // Beta Rating Label
  const getBetaRating = (beta) => {
    if (beta > 1.2) return { text: "ผันผวนสูง (Aggressive)", color: "#EF4444" };
    if (beta < 0.8) return { text: "ผันผวนต่ำ (Defensive)", color: "#10B981" };
    return { text: "ผันผวนปานกลาง (Moderate)", color: "var(--primary)" };
  };
  const betaRating = getBetaRating(portfolioBeta);

  // Generate dynamic market message
  const getDynamicMessage = () => {
    if (portfolioBeta > 1.2) {
      return "พอร์ตของคุณเน้นการเติบโตสูง (Beta > 1.2) ในสภาวะตลาดโลภควรระวังการไล่ราคาของสินทรัพย์ที่มีความร้อนแรงเกินไป";
    }
    if (portfolioBeta < 0.8) {
      return "พอร์ตของคุณเน้นความปลอดภัย (Beta < 0.8) มีแนวโน้มทนทานต่อแรงเทขายได้ดีกว่าตลาดปกติ เหมาะสำหรับถือครองยาว";
    }
    return "พอร์ตของคุณเคลื่อนไหวสอดคล้องกับดัชนีหลัก (Beta ~ 1.0) สามารถสะสมสินทรัพย์แบบเฉลี่ยต้นทุน (DCA) ได้ต่อเนื่อง";
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 16,
        padding: "20px 24px",
        height: "100%",
        boxSizing: "border-box"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={18} style={{ color: "var(--primary)" }} />
          ความเสี่ยง & อารมณ์ตลาด
        </span>
        <span 
          style={{ 
            fontSize: 11, 
            fontWeight: 800, 
            color: "var(--primary)", 
            background: "rgba(99, 102, 241, 0.08)", 
            padding: "2px 8px", 
            borderRadius: 8 
          }}
        >
          Market Pulse
        </span>
      </div>

      {/* Row 1: Fear & Greed Index Mini Gauge */}
      <div 
        style={{ 
          background: "rgba(0, 0, 0, 0.01)", 
          borderRadius: 16, 
          padding: 14, 
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            🔥 Fear & Greed Index
          </span>
          <span style={{ fontSize: 14, fontWeight: 900, color: getFearGreedColor(fearGreedValue) }}>
            {fearGreedValue} - {getFearGreedLabel(fearGreedValue).split(" ")[0]}
          </span>
        </div>
        
        {/* Simple Progress Bar */}
        <div style={{ position: "relative", width: "100%", height: 8, background: "rgba(0,0,0,0.03)", borderRadius: 4, overflow: "hidden" }}>
          {/* Gradient Background */}
          <div 
            style={{ 
              position: "absolute", 
              left: 0, 
              top: 0, 
              bottom: 0, 
              right: 0, 
              background: "linear-gradient(to right, #EF4444 0%, #F59E0B 35%, #EAB308 50%, #10B981 75%, #047857 100%)",
              opacity: 0.15
            }} 
          />
          {/* Active value fill */}
          <div 
            style={{ 
              width: `${fearGreedValue}%`, 
              height: "100%", 
              background: `linear-gradient(to right, #EF4444 0%, #F59E0B 35%, #EAB308 50%, ${getFearGreedColor(fearGreedValue)} 100%)`, 
              borderRadius: 4,
              transition: "width 1s ease"
            }} 
          />
        </div>
      </div>

      {/* Row 2: Portfolio Beta & Risk */}
      <div 
        style={{ 
          background: "rgba(0, 0, 0, 0.01)", 
          borderRadius: 16, 
          padding: 14, 
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            🛡️ อัตราความเสี่ยงพอร์ต (Beta)
          </span>
          <span style={{ fontSize: 14, fontWeight: 900, color: betaRating.color }}>
            {portfolioBeta}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ความผันผวนเมื่อเทียบกับ S&P 500:</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: betaRating.color, background: `${betaRating.color}15`, padding: "2px 8px", borderRadius: 8 }}>
            {betaRating.text.split(" ")[0]}
          </span>
        </div>
      </div>

      {/* Dynamic Summary Prompt */}
      <div 
        style={{ 
          background: "rgba(99, 102, 241, 0.03)", 
          borderRadius: 16, 
          padding: 12, 
          border: "1px dashed rgba(99, 102, 241, 0.2)",
          display: "flex",
          gap: 8,
          alignItems: "flex-start"
        }}
      >
        <TrendingUp size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
          {getDynamicMessage()}
        </span>
      </div>
    </div>
  );
}
