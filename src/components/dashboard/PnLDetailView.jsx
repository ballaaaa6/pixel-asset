import React, { useMemo } from "react";
import { getDisplaySymbol, getAssetFullName, getHistoricalExchangeRate } from "../../utils/assetHelpers";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function PnLDetailView({
  sortedAssets,
  totalGainUSD,
  totalGainTHB,
  totalGainPct,
  totalRealizedUSD,
  totalUnrealizedUSD,
  exchangeRate,
  historicalRates,
  initialCapitalUSD,
  totalUSD,
  fmt
}) {
  const { fxImpactTHB, pricePnLTHB } = useMemo(() => {
    let totalFxTHB = 0;
    
    sortedAssets.forEach(asset => {
      const isThai = asset.symbol.toUpperCase().endsWith(".BK");
      const isCash = asset.type === "fiat" || asset.category === "fiat";
      if (isThai || isCash) return;
      
      let activeBuys = [];
      let assetRealizedFxTHB = 0;
      
      const lots = asset.lots || [];
      const sortedLots = [...lots].sort((a, b) => new Date(a.date + "T" + (a.time || "00:00")) - new Date(b.date + "T" + (b.time || "00:00")));
      
      sortedLots.forEach(lot => {
        const qty = lot.qty;
        const txRate = getHistoricalExchangeRate(lot.date, historicalRates, exchangeRate);
        const priceUSD = lot.price || 0;
        
        if (qty > 0) {
          activeBuys.push({ qty, txRate, priceUSD });
        } else if (qty < 0) {
          let sellQty = Math.abs(qty);
          while (sellQty > 0 && activeBuys.length > 0) {
            const firstBuy = activeBuys[0];
            const takeQty = Math.min(sellQty, firstBuy.qty);
            
            const sellPriceUSD = priceUSD;
            const lotRealizedFX = takeQty * sellPriceUSD * (txRate - firstBuy.txRate);
            assetRealizedFxTHB += lotRealizedFX;
            
            firstBuy.qty -= takeQty;
            sellQty -= takeQty;
            if (firstBuy.qty <= 0.00001) {
              activeBuys.shift();
            }
          }
        }
      });
      
      let assetUnrealizedFxTHB = 0;
      activeBuys.forEach(buy => {
        const currentPriceUSD = asset.priceUSD || 0;
        assetUnrealizedFxTHB += buy.qty * currentPriceUSD * (exchangeRate - buy.txRate);
      });
      
      totalFxTHB += (assetRealizedFxTHB + assetUnrealizedFxTHB);
    });
    
    const pricePnL = totalGainTHB - totalFxTHB;
    return { fxImpactTHB: totalFxTHB, pricePnLTHB: pricePnL };
  }, [sortedAssets, historicalRates, exchangeRate, totalGainTHB]);

  const yieldMultiplier = useMemo(() => {
    if (!initialCapitalUSD || initialCapitalUSD <= 0) return 1.0;
    return totalUSD / initialCapitalUSD;
  }, [initialCapitalUSD, totalUSD]);

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
        marginBottom: 16,
        textAlign: "center",
        boxShadow: totalUp ? "0 10px 25px -5px rgba(16, 185, 129, 0.08)" : "0 10px 25px -5px rgba(239, 68, 68, 0.08)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>ผลตอบแทนสะสมรวมทั้งหมด</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: totalUp ? "var(--gain)" : "var(--loss)", marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          {totalGainUSD >= 0 ? "+" : ""}{fmt.usd(totalGainUSD)}
          <span style={{ fontSize: 13, marginLeft: 6, fontWeight: 700 }} className={`kpi-badge ${totalUp ? "up" : "down"}`}>
            {totalUp ? "▲" : "▼"}{fmt.pct(totalGainPct)}
          </span>
        </div>
        <div style={{ fontSize: 14, color: totalGainTHB >= 0 ? "var(--gain)" : "var(--loss)", fontWeight: 700, marginTop: 2 }}>
          {totalGainTHB >= 0 ? "+" : ""}{fmt.thb(totalGainTHB)}
        </div>

        {/* Yield Multiplier Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 10px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          marginTop: 10,
          color: "var(--text-main)",
          border: "1px solid rgba(255, 255, 255, 0.12)"
        }}>
          📈 Yield Multiplier: {yieldMultiplier.toFixed(2)}x
        </div>
      </div>

      {/* Advanced Analytics Grid (2x2) */}
      <div className="stats-grid-2x2">
        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ผลตอบแทนจากหุ้น (Price P&L)</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: pricePnLTHB >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 4 }}>
            {pricePnLTHB >= 0 ? "+" : ""}{fmt.thb(pricePnLTHB)}
          </span>
          <span style={{ fontSize: 9.5, color: "var(--text-faint)", marginTop: 1 }}>
            {pricePnLTHB >= 0 ? "กำไรมูลค่าหุ้น" : "ขาดทุนมูลค่าหุ้น"}
          </span>
        </div>
        
        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ผลกระทบค่าเงิน (FX P&L)</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: fxImpactTHB >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 4 }}>
            {fxImpactTHB >= 0 ? "+" : ""}{fmt.thb(fxImpactTHB)}
          </span>
          <span style={{ fontSize: 9.5, color: "var(--text-faint)", marginTop: 1 }}>
            {fxImpactTHB >= 0 ? "บาทอ่อนช่วยหนุน" : "บาทแข็งฉุดพอร์ต"}
          </span>
        </div>

        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>รับรู้แล้ว (Realized)</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: totalRealizedUSD >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 4 }}>
            {totalRealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalRealizedUSD)}
          </span>
        </div>

        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ยังไม่รับรู้ (Unrealized)</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: totalUnrealizedUSD >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 4 }}>
            {totalUnrealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalUnrealizedUSD)}
          </span>
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
