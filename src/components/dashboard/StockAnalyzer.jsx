import React, { useState, useEffect, useRef } from "react";
import { Search, Star, ArrowLeft, RefreshCw } from "lucide-react";
import TechnicalChart from "../charts/TechnicalChart";
import StockInfoTabs from "./StockInfoTabs";
import MarketScreeners from "./MarketScreeners";

export default function StockAnalyzer({ showToast }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [candles, setCandles] = useState([]);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tf, setTf] = useState("3M");

  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);

  const debounceRef = useRef(null);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("analyzer_watchlist");
      return saved ? JSON.parse(saved) : ["AAPL", "NVDA", "SCB.BK"];
    } catch { return ["AAPL", "NVDA", "SCB.BK"]; }
  });

  useEffect(() => {
    localStorage.setItem("analyzer_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Autocomplete suggest effect
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prices?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter to only equities, ETFs, mutual funds (same as AssetSearchSelector)
          const filtered = data.filter(item => {
            const t = (item.type || "").toUpperCase();
            return t === "EQUITY" || t === "ETF" || t === "MUTUALFUND";
          });
          setSuggestions(filtered.slice(0, 7));
          setShowDrop(filtered.length > 0);
        }
      } catch (e) {
        console.error("Autocomplete fetch failed:", e);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const handleSearch = async (symbolToSearch) => {
    const sym = symbolToSearch ? symbolToSearch.toUpperCase().trim() : searchTerm.toUpperCase().trim();
    if (!sym) return;

    setLoading(true);
    setError("");
    setShowDrop(false);
    try {
      // Fetch details & history concurrently, wrapping details so it doesn't block history on failure
      const fetchDetails = async () => {
        try {
          const res = await fetch(`/api/prices?details=${encodeURIComponent(sym)}`);
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.error("Failed to fetch detailed asset info:", e);
        }
        return {
          symbol: sym,
          profile: { name: sym, exchange: "GLOBAL", currency: sym.endsWith(".BK") ? "THB" : "USD" },
          metrics: { metric: {} },
          news: [],
          earnings: [],
          calendar: []
        };
      };

      const [historyRes, detailsData] = await Promise.all([
        fetch(`/api/prices?history=${encodeURIComponent(sym)}&tf=${tf}`),
        fetchDetails()
      ]);

      if (!historyRes.ok) {
        throw new Error("ดึงข้อมูลประวัติราคาไม่สำเร็จ กรุณาตรวจสอบสัญลักษณ์");
      }

      const historyData = await historyRes.json();

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

  const handleTfChange = async (newTf) => {
    if (!selectedSymbol) return;
    setTf(newTf);
    setLoading(true);
    try {
      const historyRes = await fetch(`/api/prices?history=${encodeURIComponent(selectedSymbol)}&tf=${newTf}`);
      if (!historyRes.ok) throw new Error("ดึงประวัติราคาในกรอบเวลานี้ไม่สำเร็จ");
      const historyData = await historyRes.json();
      setCandles(historyData.candles || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = (sym) => {
    if (watchlist.includes(sym)) {
      setWatchlist(watchlist.filter(s => s !== sym));
      showToast(`⭐ นำ ${sym} ออกจากหุ้นโปรดแล้ว`, "info");
    } else {
      setWatchlist([...watchlist, sym]);
      showToast(`⭐ เพิ่ม ${sym} เข้าในหุ้นโปรดแล้ว`, "success");
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text-main)" }}>
                ข้อมูลหุ้น: <span style={{ color: "var(--primary)" }}>{selectedSymbol}</span>
              </span>

              {/* Timeframe Selector */}
              <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.02)", padding: 3, borderRadius: 10 }}>
                {["1W", "1M", "3M", "1Y"].map((t) => (
                  <button
                    key={t}
                    disabled={loading}
                    onClick={() => handleTfChange(t)}
                    style={{
                      border: "none",
                      background: tf === t ? "var(--primary)" : "transparent",
                      color: tf === t ? "#ffffff" : "var(--text-muted)",
                      padding: "4px 12px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Chart Overlay */}
            <TechnicalChart 
              candles={candles} 
              symbol={selectedSymbol} 
              currentPrice={currentPrice} 
              currency={details?.profile?.currency || "USD"}
            />

             {/* Fundamentals Info Tabs */}
             <StockInfoTabs 
               symbol={selectedSymbol}
               profile={details?.profile || {}} 
               metrics={details?.metrics || {}} 
               earnings={details?.earnings || []} 
               news={details?.news || []} 
               calendar={details?.calendar || []}
               thaiSummary={details?.thaiSummary || ""}
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
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDrop(true); }}
                  onFocus={() => setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 200)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 14, border: "1px solid var(--border)", background: "rgba(0,0,0,0.01)", color: "var(--text-main)", fontSize: 14, fontWeight: 800 }}
                />
                
                {searching && <div className="spinner sm" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />}

                {/* Dropdown Suggestions */}
                {showDrop && suggestions.length > 0 && (
                  <div className="suggestions-dropdown" style={{ zIndex: 1000 }}>
                    {suggestions.map(item => (
                      <div 
                        key={item.symbol} 
                        className="suggestion-item" 
                        onMouseDown={(e) => { 
                          e.preventDefault(); 
                          pickSuggestion(item); 
                        }}
                      >
                        <div className="suggestion-left">
                          <span className="suggestion-symbol">{item.symbol.replace(".BK", "")}</span>
                          <span className="suggestion-name">{item.name}</span>
                        </div>
                        <div className="suggestion-right">
                          <span className="suggestion-exchange">{item.exchange}</span>
                          <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>{item.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

          {/* Market Screeners */}
          <MarketScreeners handleSearch={handleSearch} showToast={showToast} />

        </div>
      )}

    </div>
  );

  function pickSuggestion(item) {
    setSearchTerm(item.symbol);
    setShowDrop(false);
    handleSearch(item.symbol);
  }
}
