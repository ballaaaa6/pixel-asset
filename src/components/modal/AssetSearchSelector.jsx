import React from "react";
import { Search, X } from "lucide-react";
import { getDisplaySymbol } from "../../utils/assetHelpers";

export default function AssetSearchSelector({
  type,
  symbol,
  name,
  editingAsset,
  confirmed,
  clearSymbol,
  query,
  setQuery,
  setConfirmed,
  suggestions,
  searching,
  showDrop,
  setShowDrop,
  pickSuggestion,
  applyPreset,
  currencyQuery,
  setCurrencyQuery,
  showCurrencyDrop,
  setShowCurrencyDrop,
  filteredCurrencies,
  setSymbol,
  setName
}) {
  if (type === "fiat") {
    return (
      <div className="form-group" style={{ position: "relative" }}>
        <label className="form-label">สกุลเงินสด</label>
        <div style={{ position: "relative" }}>
          <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
          <input type="text" className="form-input" style={{ paddingLeft: 44 }} placeholder="พิมพ์รหัสหรือชื่อสกุลเงิน เช่น THB, USD, JPY, EUR..." value={currencyQuery} onChange={(e) => { setCurrencyQuery(e.target.value); setShowCurrencyDrop(true); }} onFocus={() => setShowCurrencyDrop(true)} onBlur={() => setTimeout(() => setShowCurrencyDrop(false), 200)} disabled={editingAsset} />
        </div>
        {symbol && (
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "var(--primary-light)", padding: "6px 12px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}>
            💵 เลือกแล้ว: <strong>{symbol}</strong> - {name}
          </div>
        )}
        {showCurrencyDrop && (
          <div className="suggestions-dropdown" style={{ maxHeight: 220, overflowY: "auto", zIndex: 1000 }}>
            {filteredCurrencies.map(c => (
              <div key={c.code} className="suggestion-item" onMouseDown={() => { setSymbol(c.code); setName(c.name); setCurrencyQuery(c.code); setShowCurrencyDrop(false); setConfirmed(true); }} style={{ padding: "10px 14px", cursor: "pointer", background: symbol === c.code ? "var(--primary-light)" : "transparent", fontWeight: symbol === c.code ? 700 : 500 }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ color: symbol === c.code ? "var(--primary)" : "var(--text-main)" }}><strong>{c.code}</strong></span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">{!editingAsset ? (type === "stock" ? "ค้นหาหุ้น (ชื่อย่อหรือชื่อบริษัท)" : "ค้นหาเหรียญ (เช่น Bitcoin, SOL)") : "สินทรัพย์"}</label>
      {confirmed || editingAsset ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--primary-light)", border: "1.5px solid var(--primary)", borderRadius: 16, padding: "10px 14px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 15 }}>{getDisplaySymbol(symbol)}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{name}</div>
          </div>
          {!editingAsset && <button type="button" className="btn-close" onClick={clearSymbol} style={{ background: "rgba(82,54,255,0.1)", color: "var(--primary)" }}><X size={14} /></button>}
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
          <input type="text" className="form-input" style={{ paddingLeft: 44 }} placeholder={type === "stock" ? "พิมพ์ชื่อหุ้น เช่น Apple, NVDA, PTT, CPALL…" : "พิมพ์ เช่น Bitcoin, ETH, SOL…"} value={query} autoFocus onChange={e => { setQuery(e.target.value); setConfirmed(false); }} onFocus={() => { if (suggestions.length > 0) setShowDrop(true); }} onBlur={() => setTimeout(() => setShowDrop(false), 180)} />
          {searching && <div className="spinner sm" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />}
          {showDrop && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map(item => (
                <div key={item.symbol} className="suggestion-item" onMouseDown={(e) => { e.preventDefault(); pickSuggestion(item); }}>
                  <div className="suggestion-left"><span className="suggestion-symbol">{getDisplaySymbol(item.symbol)}</span><span className="suggestion-name">{item.name}</span></div>
                  <div className="suggestion-right"><span className="suggestion-exchange">{item.exchange}</span><span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>{item.type}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!editingAsset && !confirmed && type === "crypto" && (
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["BTC-USD","Bitcoin"],["ETH-USD","Ethereum"],["SOL-USD","Solana"],["BNB-USD","BNB"]].map(([s,n]) => (
            <button key={s} type="button" className="ripple-btn" style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "#FFF7ED", border: "1px solid #FED7AA", cursor: "pointer", fontFamily: "inherit" }} onMouseDown={(e) => { e.preventDefault(); applyPreset(s, n); }}>{s.split("-")[0]}</button>
          ))}
        </div>
      )}
    </div>
  );
}
