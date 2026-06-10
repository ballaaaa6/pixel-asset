import React from "react";
import { Search, X } from "lucide-react";
import { getDisplaySymbol } from "../../utils/assetHelpers";

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc. (แอปเปิ้ล)", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "NVDA", name: "NVIDIA Corporation (เอ็นวิเดีย)", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "TSLA", name: "Tesla, Inc. (เทสลา)", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "MSFT", name: "Microsoft Corporation (ไมโครซอฟท์)", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "AMZN", name: "Amazon.com, Inc. (แอมะซอน)", exchange: "NASDAQ", type: "EQUITY" },
  { symbol: "PTT.BK", name: "PTT Public Company Limited (ปตท.)", exchange: "SET", type: "EQUITY" },
  { symbol: "CPALL.BK", name: "CP ALL Public Company Limited (ซีพี ออลล์)", exchange: "SET", type: "EQUITY" },
  { symbol: "AOT.BK", name: "Airports of Thailand (ท่าอากาศยานไทย)", exchange: "SET", type: "EQUITY" },
  { symbol: "BDMS.BK", name: "Bangkok Dusit Medical Services (กรุงเทพดุสิตเวชการ)", exchange: "SET", type: "EQUITY" },
  { symbol: "KBANK.BK", name: "Kasikornbank Public Company (ธนาคารกสิกรไทย)", exchange: "SET", type: "EQUITY" }
];

const POPULAR_CRYPTOS = [
  { symbol: "BTC-USD", name: "Bitcoin (บิตคอยน์ / BTC)", exchange: "CCY", type: "CRYPTO" },
  { symbol: "ETH-USD", name: "Ethereum (อีเธอเรียม / ETH)", exchange: "CCY", type: "CRYPTO" },
  { symbol: "SOL-USD", name: "Solana (โซลานา / SOL)", exchange: "CCY", type: "CRYPTO" },
  { symbol: "BNB-USD", name: "BNB (บีเอ็นบี / BNB)", exchange: "CCY", type: "CRYPTO" },
  { symbol: "XRP-USD", name: "Ripple (ริปเปิล / XRP)", exchange: "CCY", type: "CRYPTO" },
  { symbol: "ADA-USD", name: "Cardano (คาร์ดาโน / ADA)", exchange: "CCY", type: "CRYPTO" },
  { symbol: "DOGE-USD", name: "Dogecoin (ดอจคอยน์ / DOGE)", exchange: "CCY", type: "CRYPTO" }
];

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

  const isQueryEmpty = !query.trim();
  const displaySuggestions = isQueryEmpty
    ? (type === "stock" ? POPULAR_STOCKS : POPULAR_CRYPTOS)
    : suggestions;

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
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 44 }}
            placeholder={type === "stock" ? "พิมพ์ชื่อหุ้น เช่น Apple, NVDA, PTT, CPALL…" : "พิมพ์ เช่น Bitcoin, ETH, SOL…"}
            value={query}
            autoFocus
            onChange={e => { setQuery(e.target.value); setConfirmed(false); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 200)}
          />
          {searching && <div className="spinner sm" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />}
          {showDrop && displaySuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {displaySuggestions.map(item => (
                <div key={item.symbol} className="suggestion-item" onMouseDown={(e) => { e.preventDefault(); pickSuggestion(item); }}>
                  <div className="suggestion-left"><span className="suggestion-symbol">{getDisplaySymbol(item.symbol)}</span><span className="suggestion-name">{item.name}</span></div>
                  <div className="suggestion-right"><span className="suggestion-exchange">{item.exchange}</span><span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>{item.type}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
