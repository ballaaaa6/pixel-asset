import React, { useMemo } from "react";
import { getDisplaySymbol, getAssetFullName } from "../../utils/assetHelpers";

const CATEGORY_LABELS = { stock: "หุ้น", crypto: "คริปโต", gold: "ทองคำ/น้ำมัน", fiat: "เงินสด" };

export default function ValueDetailView({ assets, exchangeRate, totalUSD, fmt }) {
  const activeAssetsSorted = useMemo(() => {
    return [...assets]
      .filter(a => a.qty > 0.00001)
      .map(a => {
        const valueUSD = a.valueUSD || 0;
        const pct = totalUSD > 0 ? (valueUSD / totalUSD) * 100 : 0;
        return { ...a, valueUSD, pct };
      })
      .sort((a, b) => b.valueUSD - a.valueUSD);
  }, [assets, totalUSD]);

  // 1. Diversification Analysis
  const { divScore, divColor } = useMemo(() => {
    if (activeAssetsSorted.length === 0) return { divScore: "ไม่มีสินทรัพย์", divColor: "var(--text-muted)" };
    const maxPct = activeAssetsSorted[0].pct;
    if (maxPct > 55) return { divScore: "กระจุกตัวสูง (High Risk) ⚠️", divColor: "var(--loss)" };
    if (maxPct > 35) return { divScore: "กระจายตัวปานกลาง (Moderate) ⚖️", divColor: "var(--gold)" };
    if (activeAssetsSorted.length >= 3) return { divScore: "กระจายตัวดีเยี่ยม (Excellent) 🛡️", divColor: "var(--gain)" };
    return { divScore: "กระจายตัวทั่วไป (Normal)", divColor: "var(--primary)" };
  }, [activeAssetsSorted]);

  // 2. Market Breakdown (Thai vs US/Global)
  const { thaiUSD, globalUSD } = useMemo(() => {
    let thai = 0;
    let glob = 0;
    activeAssetsSorted.forEach(a => {
      if (a.symbol.toUpperCase().endsWith(".BK")) {
        thai += a.valueUSD;
      } else {
        glob += a.valueUSD;
      }
    });
    return { thaiUSD: thai, globalUSD: glob };
  }, [activeAssetsSorted]);

  const thaiPct = totalUSD > 0 ? (thaiUSD / totalUSD) * 100 : 0;
  const globalPct = totalUSD > 0 ? (globalUSD / totalUSD) * 100 : 0;

  return (
    <div>
      {/* Top Header Card */}
      <div style={{
        padding: 18,
        background: "linear-gradient(135deg, rgba(82, 54, 255, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)",
        border: "1.5px solid rgba(82, 54, 255, 0.3)",
        borderRadius: 16,
        marginBottom: 16,
        textAlign: "center",
        boxShadow: "0 10px 25px -5px rgba(82, 54, 255, 0.08)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>มูลค่าตลาดพอร์ตโฟลิโอปัจจุบัน</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)", marginTop: 6 }}>{fmt.usd(totalUSD)}</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{fmt.thb(totalUSD * exchangeRate)}</div>
        <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 8 }}>FX Rate: 1 USD = {exchangeRate.toFixed(2)} THB</div>
      </div>

      {/* Advanced Analytics Grid (2x2) */}
      <div className="stats-grid-2x2">
        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>ดัชนีกระจายความเสี่ยง</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: divColor, marginTop: 4 }}>{divScore}</span>
        </div>
        <div className="stats-grid-card">
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>การกระจายตลาด</span>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10.5, fontWeight: 700 }}>
            <span style={{ color: "var(--primary)" }}>🇺🇸 Global: {globalPct.toFixed(0)}%</span>
            <span style={{ color: "var(--gain)" }}>🇹🇭 Thai: {thaiPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>📦 สัดส่วนการกระจายพอร์ต (Asset Distribution)</div>
      
      <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
        {activeAssetsSorted.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12.5 }}>ยังไม่มีสินทรัพย์ในพอร์ต</div>
        ) : (
          activeAssetsSorted.map((item) => (
            <div key={item.id} className="kpi-detail-list-item">
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{getDisplaySymbol(item.symbol)}</span>
                  <span className={`badge-type ${item.category || "stock"}`} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 4 }}>
                    {CATEGORY_LABELS[item.category] || item.category || "stock"}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
                  {getAssetFullName(item.symbol, item.name, item.category)}
                </div>
                <div className="allocation-bar-track">
                  <div className="allocation-bar-fill" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt.usd(item.valueUSD)}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 1 }}>{fmt.pct(item.pct)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
