import React from "react";
import { HelpCircle } from "lucide-react";
import FearGreedGauge from "./FearGreedGauge";
import PortfolioHealthMetrics from "./PortfolioHealthMetrics";
import PortfolioAdviceList from "./PortfolioAdviceList";
import PortfolioStressTest from "./PortfolioStressTest";

export default function PortfolioCorrelation({ assets = [], exchangeRate = 35.0, hideValues }) {
  // Extract active assets for analysis
  const activeAssets = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat");
  const displaySymbols = activeAssets.slice(0, 5).map(a => a.symbol);

  // Calculate average correlation and diversification score
  let sumCorrelation = 0, countPairs = 0;
  for (let i = 0; i < displaySymbols.length; i++) {
    for (let j = i + 1; j < displaySymbols.length; j++) {
      // Simulate correlation coefficients for calculations
      const sorted = [displaySymbols[i], displaySymbols[j]].sort().join("-");
      let hash = 0;
      for (let k = 0; k < sorted.length; k++) {
        hash = sorted.charCodeAt(k) + ((hash << 5) - hash);
      }
      const coeff = ((Math.abs(hash) % 201) - 100) / 100;
      sumCorrelation += coeff;
      countPairs++;
    }
  }

  const avgCorrelation = countPairs > 0 ? parseFloat((sumCorrelation / countPairs).toFixed(2)) : 0;
  const diversificationScore = Math.max(0, Math.min(100, Math.round(75 - avgCorrelation * 35)));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Information Header Banner */}
      <div style={{ background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <HelpCircle size={24} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)" }}>วิเคราะห์การกระจายความเสี่ยงและสุขภาพพอร์ตโฟลิโอ</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            การประเมินความเสี่ยงพอร์ตด้วยดัชนีอารมณ์ตลาด (Fear & Greed Index) และแบบจำลองวิเคราะห์ผลกระทบเมื่อตลาดเกิดความตึงเครียดในสถานการณ์ต่างๆ เพื่อช่วยให้นักลงทุนปรับสมดุลความผันผวนและวิเคราะห์ระดับความเสี่ยงของพอร์ตได้อย่างมีประสิทธิภาพ
          </span>
        </div>
      </div>

      {/* Main Grid: Fear & Greed + Health Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 24 }} className="dashboard-grid">
        <FearGreedGauge />
        <PortfolioHealthMetrics 
          assets={assets} 
          avgCorrelation={avgCorrelation} 
          diversificationScore={diversificationScore} 
        />
      </div>

      {/* Portfolio Stress Test & Crisis Simulator */}
      <PortfolioStressTest 
        assets={assets}
        exchangeRate={exchangeRate}
        hideValues={hideValues}
      />

      {/* Actionable Advice & Rebalancing Recommendations */}
      <PortfolioAdviceList 
        assets={assets} 
        avgCorrelation={avgCorrelation} 
        diversificationScore={diversificationScore} 
      />
    </div>
  );
}
