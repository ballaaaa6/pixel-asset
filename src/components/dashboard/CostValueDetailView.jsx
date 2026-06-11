import React, { useMemo } from "react";
import { getDisplaySymbol, getAssetFullName } from "../../utils/assetHelpers";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function CostValueDetailView({
  sortedAssets,
  totalUSD,
  totalCostUSD,
  totalGainUSD,
  totalGainPct,
  totalGainTHB,
  totalRealizedUSD,
  totalUnrealizedUSD,
  exchangeRate,
  fmt
}) {
  // 1. Margin of Safety Analysis
  const { marginOfSafety, safetyLabel, safetyColor } = useMemo(() => {
    if (totalUSD <= 0 || totalUSD <= totalCostUSD) {
      return { marginOfSafety: 0, safetyLabel: "พอร์ตต่ำกว่าทุนสะสม (Capital Deficit) 🚨", safetyColor: "var(--loss)" };
    }
    const mos = ((totalUSD - totalCostUSD) / totalUSD) * 100;
    let label = "พอร์ตปลอดภัยใกล้ระดับทุน (Low Buffer) ⚠️";
    let color = "var(--gold)";
    
    if (mos > 30) {
      label = "พอร์ตเสถียรภาพสูงเยี่ยม (Excellent Buffer) 🛡️";
      color = "var(--gain)";
    } else if (mos > 15) {
      label = "พอร์ตปลอดภัยปานกลาง (Healthy Buffer) ⚖️";
      color = "var(--primary)";
    }
    
    return { marginOfSafety: mos, safetyLabel: label, safetyColor: color };
  }, [totalUSD, totalCostUSD]);

  // 2. Category Breakdown (Cost vs Value per Asset Class)
  const categoryBreakdown = useMemo(() => {
    const catMap = {};
    sortedAssets.forEach(a => {
      const cat = a.category || "stock";
      if (!catMap[cat]) {
        catMap[cat] = { costUSD: 0, valueUSD: 0 };
      }
      catMap[cat].costUSD += a.costUSD || 0;
      catMap[cat].valueUSD += a.valueUSD || 0;
    });
    
    return Object.entries(catMap).map(([cat, data]) => {
      const gainUSD = data.valueUSD - data.costUSD;
      const gainPct = data.costUSD > 0 ? (gainUSD / data.costUSD) * 100 : 0;
      return { cat, ...data, gainUSD, gainPct };
    }).sort((a, b) => b.valueUSD - a.valueUSD);
  }, [sortedAssets]);

  const totalUp = totalUSD >= totalCostUSD;
  const valuationMultiplier = totalCostUSD > 0 ? totalUSD / totalCostUSD : 1;

  return (
    <div>
      {/* Top Header Card - Margin of Safety */}
      <div style={{
        padding: 20,
        background: totalUp 
          ? "linear-gradient(135deg, rgba(82, 54, 255, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)"
          : "linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(248, 113, 113, 0.08) 100%)",
        border: totalUp ? "1.5px solid rgba(82, 54, 255, 0.35)" : "1.5px solid rgba(239, 68, 68, 0.35)",
        borderRadius: 16,
        marginBottom: 16,
        textAlign: "center",
        boxShadow: totalUp ? "0 10px 25px -5px rgba(82, 54, 255, 0.08)" : "0 10px 25px -5px rgba(239, 68, 68, 0.08)"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>ดัชนีความปลอดภัยพอร์ตโฟลิโอ (Margin of Safety)</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: safetyColor, marginTop: 6 }}>
          {marginOfSafety.toFixed(1)}%
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontWeight: 600 }}>
          {totalUp 
            ? `พอร์ตรองรับการร่วงปรับฐานได้อีก ${marginOfSafety.toFixed(1)}% ก่อนจะแตะระดับทุนสะสม`
            : `มูลค่ารวมพอร์ตต่ำกว่าทุนสะสมขาดดุลทุนอยู่ ${Math.abs(100 - (totalUSD/totalCostUSD)*100).toFixed(1)}%`}
        </div>

        {/* Safety Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px 14px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          marginTop: 12,
          color: safetyColor,
          border: `1.5px solid ${safetyColor}33`
        }}>
          {safetyLabel}
        </div>
      </div>

      {/* Grid 2x2 - Capital & Valuation Stats */}
      <div className="stats-grid-2x2" style={{ gap: 12, marginBottom: 16 }}>
        <div className="stats-grid-card" style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ต้นทุนลงทุนในสินทรัพย์</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
            {fmt.usd(totalCostUSD)}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
            {fmt.thb(totalCostUSD * exchangeRate)}
          </span>
        </div>

        <div className="stats-grid-card" style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>มูลค่าตลาดปัจจุบัน</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
            {fmt.usd(totalUSD)}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
            {fmt.thb(totalUSD * exchangeRate)}
          </span>
        </div>

        <div className="stats-grid-card" style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>กำไรที่รับรู้เงินสดแล้ว</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: totalRealizedUSD >= 0 ? "var(--gain)" : "var(--loss)", marginTop: 4 }}>
            {totalRealizedUSD >= 0 ? "+" : ""}{fmt.usd(totalRealizedUSD)}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
            {totalRealizedUSD >= 0 ? "Realized Cash out" : "Realized Deficit"}
          </span>
        </div>

        <div className="stats-grid-card" style={{ padding: "12px 14px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ตัวคูณมูลค่าการลงทุน</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: totalUp ? "var(--gain)" : "var(--loss)", marginTop: 4 }}>
            {valuationMultiplier.toFixed(2)}x
          </span>
          <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
            {totalUp ? "มูลค่าโตขึ้น" : "มูลค่าลดลง"}
          </span>
        </div>
      </div>

      {/* Asset Class Cost vs Value */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>📂 สัดส่วนต้นทุนแยกตามประเภทสินทรัพย์</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {categoryBreakdown.map(item => (
          <div key={item.cat} className="kpi-detail-list-item" style={{ padding: "10px 14px", background: "rgba(255, 255, 255, 0.03)", borderRadius: 10 }}>
            <div>
              <span className={`badge-type ${item.cat}`} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                {CATEGORY_LABELS[item.cat] || item.cat}
              </span>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>
                ทุน: {fmt.usd(item.costUSD)} | มูลค่า: {fmt.usd(item.valueUSD)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: item.gainUSD >= 0 ? "var(--gain)" : "var(--loss)" }}>
                {item.gainUSD >= 0 ? "+" : ""}{item.gainPct.toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                {fmt.usd(item.gainUSD)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset-by-Asset Detail List */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12 }}>⚖️ ตารางเปรียบเทียบทุนรายตัว (Asset Cost vs Value)</div>
      <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
        {sortedAssets.map(item => {
          const itemCost = item.costUSD || 0;
          const itemVal = item.valueUSD || 0;
          const isItemProfit = itemVal >= itemCost;
          
          let costBarPct = 100;
          if (itemVal > 0 && isItemProfit) {
            costBarPct = (itemCost / itemVal) * 100;
          } else if (itemCost > 0 && !isItemProfit) {
            costBarPct = (itemVal / itemCost) * 100;
          }

          return (
            <div key={item.id} className="kpi-detail-list-item" style={{ padding: "12px 16px", flexDirection: "column", alignItems: "stretch", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{getDisplaySymbol(item.symbol)}</span>
                    <span className={`badge-type ${item.category || "stock"}`} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4 }}>
                      {CATEGORY_LABELS[item.category] || item.category || "stock"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                    ทุน: {fmt.usd(itemCost)} | มูลค่า: {fmt.usd(itemVal)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: isItemProfit ? "var(--gain)" : "var(--loss)" }}>
                    {isItemProfit ? "+" : ""}{item.gainPct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                    {fmt.usd(itemVal - itemCost)}
                  </div>
                </div>
              </div>

              {/* Shrunk Glassmorphic Cost/Value Bar */}
              <div style={{ height: 6, background: "rgba(226, 232, 240, 0.5)", borderRadius: 3, overflow: "hidden", display: "flex", width: "100%" }}>
                {isItemProfit ? (
                  <>
                    <div style={{ width: `${Math.max(5, Math.min(95, costBarPct))}%`, background: "var(--primary)", height: "100%" }} />
                    <div style={{ width: `${100 - Math.max(5, Math.min(95, costBarPct))}%`, background: "var(--gain)", height: "100%" }} />
                  </>
                ) : (
                  <>
                    <div style={{ width: `${Math.max(5, Math.min(95, costBarPct))}%`, background: "var(--loss)", height: "100%" }} />
                    <div style={{ width: `${100 - Math.max(5, Math.min(95, costBarPct))}%`, background: "rgba(239, 68, 68, 0.15)", height: "100%" }} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
