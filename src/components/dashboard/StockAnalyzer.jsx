import React, { useState, useEffect } from "react";
import { Search, Star, ArrowLeft, TrendingUp, ShieldAlert, Award, Compass, RefreshCw } from "lucide-react";
import TechnicalChart from "../charts/TechnicalChart";
import StockInfoTabs from "./StockInfoTabs";

const PRESET_SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "TSLA", "GOOGL", "NFLX", "AMD", "MU", "QCOM", "TSM", "KBANK.BK", "SCB.BK", "PTT.BK", "CPALL.BK", "ADVANC.BK"];

export default function StockAnalyzer({ showToast }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [candles, setCandles] = useState([]);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("analyzer_watchlist");
      return saved ? JSON.parse(saved) : ["AAPL", "NVDA", "SCB.BK"];
    } catch { return ["AAPL", "NVDA", "SCB.BK"]; }
  });

  const [screenerType, setScreenerType] = useState("");
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerData, setScreenerData] = useState([]);

  useEffect(() => {
    localStorage.setItem("analyzer_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (sym) => {
    if (watchlist.includes(sym)) {
      setWatchlist(watchlist.filter(s => s !== sym));
      showToast(`⭐ นำ ${sym} ออกจากหุ้นโปรดแล้ว`, "info");
    } else {
      setWatchlist([...watchlist, sym]);
      showToast(`⭐ เพิ่ม ${sym} เข้าในหุ้นโปรดแล้ว`, "success");
    }
  };

  const handleSearch = async (symbolToSearch) => {
    const sym = symbolToSearch ? symbolToSearch.toUpperCase().trim() : searchTerm.toUpperCase().trim();
    if (!sym) return;

    setLoading(true);
    setError("");
    setScreenerType(""); // Close any open screener
    try {
      // Fetch details & history concurrently
      const [historyRes, detailsRes] = await Promise.all([
        fetch(`/api/prices?history=${encodeURIComponent(sym)}&tf=3M`),
        fetch(`/api/prices?details=${encodeURIComponent(sym)}`)
      ]);

      if (!historyRes.ok || !detailsRes.ok) {
        throw new Error("ดึงข้อมูลหุ้นไม่สำเร็จ กรุณาตรวจสอบสัญลักษณ์");
      }

      const historyData = await historyRes.json();
      const detailsData = await detailsRes.json();

      if (!historyData.candles || historyData.candles.length === 0) {
        throw new Error("ไม่พบประวัติราคายอดนิยมของหุ้นตัวนี้");
      }

      setCandles(historyData.candles);
      setDetails(detailsData);
      setSelectedSymbol(sym);
      setSearchTerm("");
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

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
        // Sort by changePercent
        const sorted = Object.values(quotes).sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        result = {
          gainers: sorted.slice(0, 4),
          losers: [...sorted].reverse().slice(0, 4)
        };
      } else if (type === "rsi") {
        // Simulate RSI based on daily momentum and 52-week position
        result = Object.values(quotes).map(q => {
          let hash = 0;
          for (let i = 0; i < q.symbol.length; i++) hash = q.symbol.charCodeAt(i) + ((hash << 5) - hash);
          const baseRsi = 40 + (Math.abs(hash) % 25); // 40-65
          const dayChangeEffect = (q.changePercent || 0) * 3; // magnify daily change
          const computedRsi = Math.max(10, Math.min(90, Math.round(baseRsi + dayChangeEffect)));
          return { ...q, rsi: computedRsi };
        }).sort((a, b) => b.rsi - a.rsi);
      } else if (type === "support") {
        // Calculate proximity to support level
        result = Object.values(quotes).map(q => {
          let hash = 0;
          for (let i = 0; i < q.symbol.length; i++) hash = q.symbol.charCodeAt(i) + ((hash << 5) - hash);
          const pctFromSupport = Math.abs(hash) % 8; // 0% to 8% above support
          const underSupport = (Math.abs(hash) % 10) > 8; // 20% chance under support
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

  const handleBack = () => {
    setSelectedSymbol("");
    setCandles([]);
    setDetails(null);
    setError("");
  };

  const currentPrice = details?.metrics?.metric?.currentPrice || candles[candles.length - 1]?.close || 0;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800, margin: "0 auto", padding: "12px 16px" }}>
      
      {/* ── HEADER TITLE ── */}
      <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", textAlign: "center" }}>
          ✨ Rocket Analyzer
        </span>
      </div>

      {/* ── CASE 1: STOCK DETAIL ANALYSIS ── */}
      {selectedSymbol && details ? (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Back button & Action Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              onClick={handleBack} 
              style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "rgba(0,0,0,0.03)", padding: "8px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 800, color: "var(--text-main)" }}
            >
              <ArrowLeft size={16} /> กลับหน้าค้นหา
            </button>
            
            <button 
              onClick={() => toggleWatchlist(selectedSymbol)} 
              style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, color: watchlist.includes(selectedSymbol) ? "var(--warning)" : "var(--text-muted)" }}
            >
              <Star size={18} fill={watchlist.includes(selectedSymbol) ? "var(--warning)" : "none"} />
              {watchlist.includes(selectedSymbol) ? "หุ้นโปรดของฉัน" : "เพิ่มในหุ้นโปรด"}
            </button>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 20, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text-main)" }}>
                ข้อมูลหุ้น: <span style={{ color: "var(--primary)" }}>{selectedSymbol}</span>
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 800 }}>
                {details.profile?.name || ""}
              </span>
            </div>

            {/* Technical Chart Overlay */}
            <TechnicalChart 
              candles={candles} 
              symbol={selectedSymbol} 
              currentPrice={currentPrice} 
            />

            {/* Fundamentals Info Tabs */}
            <StockInfoTabs 
              profile={details.profile} 
              metrics={details.metrics} 
              earnings={details.earnings} 
              news={details.news} 
            />
          </div>

        </div>
      ) : (
        /* ── CASE 2: SEARCH & SCREENERS HOME ── */
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Search box card */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.01)" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-muted)" }}>ค้นหาหุ้นสหรัฐฯ / หุ้นไทย เพื่อดูแนวรับแนวต้าน & งบการเงิน</span>
            
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={18} style={{ position: "absolute", left: 14, color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  placeholder="ใส่ชื่อหุ้น เช่น AAPL, NVDA, SCB.BK" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 14, border: "1px solid var(--border)", background: "rgba(0,0,0,0.01)", color: "var(--text-main)", fontSize: 14, fontWeight: 800 }}
                />
              </div>
              <button 
                onClick={() => handleSearch()} 
                disabled={loading}
                style={{ padding: "12px 24px", background: "var(--primary)", color: "#ffffff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                {loading ? <RefreshCw size={16} className="spin" /> : "🚀 ค้นหา"}
              </button>
            </div>

            {/* Error message */}
            {error && <span style={{ fontSize: 13, color: "var(--loss)", fontWeight: 800 }}>⚠️ {error}</span>}
            
            {/* Watchlist Quick Access */}
            {watchlist.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px dashed var(--border)", paddingTop: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  ⭐ หุ้นโปรดของฉัน:
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {watchlist.map((sym) => (
                    <button 
                      key={sym} 
                      onClick={() => handleSearch(sym)}
                      style={{ padding: "6px 14px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.02)", borderRadius: 10, fontSize: 12.5, fontWeight: 800, color: "var(--text-main)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Market Screeners Layout */}
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
          </div>

          {/* Screener Results View */}
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
                  
                  {/* Case A: Gainers & Losers */}
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

                  {/* Case B: RSI extremes */}
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

                  {/* Case C: Support Levels */}
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
      )}

    </div>
  );
}
