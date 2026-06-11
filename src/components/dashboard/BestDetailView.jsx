import React, { useMemo } from "react";
import { getDisplaySymbol, getAssetFullName } from "../../utils/assetHelpers";

export default function BestDetailView({ sortedAssets, bestAsset, fmt }) {
  const bestFullAsset = useMemo(() => {
    if (!bestAsset) return null;
    return sortedAssets.find(a => a.symbol === bestAsset.symbol);
  }, [bestAsset, sortedAssets]);

  const topAssets = useMemo(() => {
    return [...sortedAssets]
      .filter(a => a.qty > 0.00001 && (a.avgCost > 0 || a.avgPrice > 0))
      .sort((a, b) => b.gainPct - a.gainPct)
      .slice(0, 3);
  }, [sortedAssets]);

  if (!bestFullAsset) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        ยังไม่มีข้อมูลสถิติผลตอบแทนที่ดีที่สุด
      </div>
    );
  }

  const isThai = bestFullAsset.symbol.endsWith(".BK");

  return (
    <div>
      {/* Champion Spotlight Card */}
      <div className="spotlight-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "inline-flex", padding: "4px 10px", background: "rgba(245, 158, 11, 0.15)", color: "#D97706", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          🌟 CHAMPION OF THE PORTFOLIO
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)", letterSpacing: -0.5 }}>
          {getDisplaySymbol(bestFullAsset.symbol)}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>
          {getAssetFullName(bestFullAsset.symbol, bestFullAsset.name, bestFullAsset.category)}
        </div>
        
        {/* Big profit percent */}
        <div style={{ fontSize: 32, fontWeight: 900, color: "var(--gain)", marginTop: 12 }}>
          +{bestFullAsset.gainPct.toFixed(2)}%
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 18,
          background: "rgba(255, 255, 255, 0.05)",
          padding: 12,
          borderRadius: 10,
          border: "1px solid rgba(255, 255, 255, 0.06)",
          fontSize: 12
        }}>
          <div style={{ textAlign: "left" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>ต้นทุนเฉลี่ย:</span>
            <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: 2 }}>
              {isThai ? `฿${bestFullAsset.avgCost.toFixed(2)}` : `$${bestFullAsset.avgCost.toFixed(2)}`}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>ราคาปัจจุบัน:</span>
            <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: 2 }}>
              {isThai ? `฿${bestFullAsset.price.toFixed(2)}` : `$${bestFullAsset.price.toFixed(2)}`}
            </div>
          </div>
          <div style={{ textAlign: "left", marginTop: 4 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>มูลค่าปัจจุบัน:</span>
            <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: 2 }}>
              {fmt.usd(bestFullAsset.valueUSD)}
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: 4 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>กำไรที่ยังไม่รับรู้:</span>
            <div style={{ fontWeight: 700, color: "var(--gain)", marginTop: 2 }}>
              +{fmt.usd(bestFullAsset.unrealizedPnL)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>🏅 สินทรัพย์ที่ทำเปอร์เซ็นต์กำไรสูงสุด 3 อันดับแรก</div>
      
      <div style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
        {topAssets.map((item, idx) => (
          <div key={item.id} className="kpi-detail-list-item" style={{ padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: idx === 0 ? "rgba(245, 158, 11, 0.15)" : idx === 1 ? "rgba(100, 116, 139, 0.15)" : "rgba(180, 83, 9, 0.15)",
                color: idx === 0 ? "#D97706" : idx === 1 ? "#475569" : "#B45309",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10.5,
                fontWeight: 800
              }}>
                {idx + 1}
              </span>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{getDisplaySymbol(item.symbol)}</span>
            </div>
            
            <div style={{ fontWeight: 800, color: "var(--gain)", fontSize: 13 }}>
              +{item.gainPct.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
