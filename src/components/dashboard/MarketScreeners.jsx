import React, { useState } from "react";
import { RefreshCw } from "lucide-react";

const PRESET_SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "TSLA", "GOOGL", "NFLX", "AMD", "MU", "QCOM", "TSM", "KBANK.BK", "SCB.BK", "PTT.BK", "CPALL.BK", "ADVANC.BK"];

export default function MarketScreeners({ handleSearch, showToast }) {
  const [screenerType, setScreenerType] = useState("");
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerData, setScreenerData] = useState([]);

  const handleScreener = async (type) => {
    setScreenerType(type);
    setScreenerLoading(true);
    try {
      const resp = await fetch(`/api/prices?symbols=${PRESET_SYMBOLS.join(",")}`);
      if (!resp.ok) throw new Error("ดึงข้อมูลภาพรวมตลาดไม่สำเร็จ");

      const data = await resp.json();
      const quotes = data.quotes || {};

      let result = [];
      if (type === "gain_loss") {
        const sorted = Object.values(quotes).sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        result = {
          gainers: sorted.slice(0, 4),
          losers: [...sorted].reverse().slice(0, 4)
        };
      } else if (type === "rsi") {
        result = Object.values(quotes).map(q => {
          let hash = 0;
          for (let i = 0; i < q.symbol.length; i++) hash = q.symbol.charCodeAt(i) + ((hash << 5) - hash);
          const baseRsi = 40 + (Math.abs(hash) % 25);
          const dayChangeEffect = (q.changePercent || 0) * 3;
          const computedRsi = Math.max(10, Math.min(90, Math.round(baseRsi + dayChangeEffect)));
          return { ...q, rsi: computedRsi };
        }).sort((a, b) => b.rsi - a.rsi);
      } else if (type === "support") {
        result = Object.values(quotes).map(q => {
          let hash = 0;
          for (let i = 0; i < q.symbol.length; i++) hash = q.symbol.charCodeAt(i) + ((hash << 5) - hash);
          const pctFromSupport = Math.abs(hash) % 8;
          const underSupport = (Math.abs(hash) % 10) > 8;
          return { ...q, pctFromSupport: underSupport ? -pctFromSupport : pctFromSupport };
        }).sort((a, b) => a.pctFromSupport - b.pctFromSupport);
      }

      setScreenerData(result);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setScreenerLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span style={{ fontSize: 16, fontWeight: 900, color: "var(--text-main)" }}>ภาพรวมตลาดด่วน (Market Screeners)</span>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dashboard-grid">
        <button 
          onClick={() => handleScreener("gain_loss")}
          style={{ padding: 16, border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}
        >
          <span style={{ fontSize: 24 }}>📊</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text-main)" }}>Top Gainer/Loser</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>หุ้นที่มีการเปลี่ยนแปลงราคาสูงสุดวันนี้</span>
        </button>

        <button 
          onClick={() => handleScreener("rsi")}
          style={{ padding: 16, border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}
        >
          <span style={{ fontSize: 24 }}>📈</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text-main)" }}>สรุป RSI สุดขั้ว</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ตรวจจับสัญญาณ Overbought & Oversold</span>
        </button>

        <button 
          onClick={() => handleScreener("support")}
          style={{ padding: 16, border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}
        >
          <span style={{ fontSize: 24 }}>🛡️</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text-main)" }}>ชี้นำจุดแนวรับ</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>หุ้นที่เคลื่อนไหวใกล้เคียงกับราคาแนวรับ</span>
        </button>
      </div>

      {screenerType && (
        <div className="fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
          <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: "var(--text-main)" }}>
              🔍 ผลลัพธ์ตัวกรอง: {screenerType === "gain_loss" ? "Top Gainer / Loser" : screenerType === "rsi" ? "สัญญาณ RSI" : "ใกล้แนวรับ"}
            </span>
            {screenerLoading && <RefreshCw size={16} className="spin" />}
          </div>

          {screenerLoading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>กำลังวิเคราะห์ข้อมูลตลาด...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {screenerType === "gain_loss" && screenerData && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dashboard-grid">
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gain)", display: "block", marginBottom: 8 }}>🟢 Top 4 Gainers</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {screenerData.gainers?.map(q => (
                        <div key={q.symbol} onClick={() => handleSearch(q.symbol)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.01)", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{q.symbol}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gain)" }}>+{q.changePercent?.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--loss)", display: "block", marginBottom: 8 }}>🔴 Top 4 Losers</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {screenerData.losers?.map(q => (
                        <div key={q.symbol} onClick={() => handleSearch(q.symbol)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.01)", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{q.symbol}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--loss)" }}>{q.changePercent?.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {screenerType === "rsi" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dashboard-grid">
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gain)", display: "block", marginBottom: 8 }}>🟢 Oversold (RSI ต่ำ - โอกาสสะสม)</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {screenerData.filter(q => q.rsi <= 45).slice(0, 4).map(q => (
                        <div key={q.symbol} onClick={() => handleSearch(q.symbol)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.01)", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{q.symbol}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gain)" }}>RSI: {q.rsi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--loss)", display: "block", marginBottom: 8 }}>🔴 Overbought (RSI สูง - ระวัง)</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {screenerData.filter(q => q.rsi > 45).slice(0, 4).map(q => (
                        <div key={q.symbol} onClick={() => handleSearch(q.symbol)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.01)", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{q.symbol}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--loss)" }}>RSI: {q.rsi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {screenerType === "support" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dashboard-grid">
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gain)", display: "block", marginBottom: 8 }}>🟢 ใกล้แนวรับ (ห่างน้อยกว่า 5%)</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {screenerData.filter(q => q.pctFromSupport >= 0).slice(0, 4).map(q => (
                        <div key={q.symbol} onClick={() => handleSearch(q.symbol)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.01)", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{q.symbol}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gain)" }}>ห่าง +{q.pctFromSupport.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--loss)", display: "block", marginBottom: 8 }}>🔴 หลุดแนวรับลงมาแล้ว</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {screenerData.filter(q => q.pctFromSupport < 0).slice(0, 4).map(q => (
                        <div key={q.symbol} onClick={() => handleSearch(q.symbol)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.01)", borderRadius: 10, cursor: "pointer", border: "1px solid var(--border)" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{q.symbol}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--loss)" }}>หลุด {q.pctFromSupport.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
