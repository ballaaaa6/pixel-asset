import React, { useState, useEffect, useRef } from "react";
import { X, Search, Save, Plus, Trash2, ChevronDown, ChevronUp, History } from "lucide-react";

/* ─── Formatters ─── */
const fmtDate  = (s) => s ? new Date(s + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "—";
const fmtUSD   = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 }).format(n);
const fmtQty   = (n) => n == null ? "—" : new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(n);

export default function AssetModal({ isOpen, onClose, onSave, editingAsset }) {
  const [type,        setType]        = useState("stock");
  const [symbol,      setSymbol]      = useState("");
  const [name,        setName]        = useState("");
  const [qty,         setQty]         = useState("");
  const [price,       setPrice]       = useState("");
  const [date,        setDate]        = useState(() => new Date().toISOString().split("T")[0]);

  /* Search state */
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);
  const [confirmed,   setConfirmed]   = useState(false); // true when symbol picked

  /* History panel */
  const [showHistory, setShowHistory] = useState(false);

  const debounceRef  = useRef(null);
  const qtyInputRef  = useRef(null);

  /* ─── Reset on open ─── */
  useEffect(() => {
    if (!isOpen) return;

    if (editingAsset) {
      setType(editingAsset.category || editingAsset.type || "stock");
      setSymbol(editingAsset.symbol || "");
      setName(editingAsset.name || "");
      setQuery(editingAsset.symbol || "");
      setQty("");
      setPrice("");
      setDate(new Date().toISOString().split("T")[0]);
      setConfirmed(true);
      setShowDrop(false);
      setSuggestions([]);
    } else {
      setType("stock");
      setSymbol("");
      setName("");
      setQuery("");
      setQty("");
      setPrice("");
      setDate(new Date().toISOString().split("T")[0]);
      setConfirmed(false);
      setShowDrop(false);
      setSuggestions([]);
    }
    setShowHistory(false);
  }, [isOpen, editingAsset]);

  /* ─── Debounced search (only when NOT confirmed) ─── */
  useEffect(() => {
    if (confirmed || editingAsset) return;

    clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 1) {
      setSuggestions([]);
      setShowDrop(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prices?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 7));
          setShowDrop(data.length > 0);
        }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, confirmed, editingAsset]);

  if (!isOpen) return null;

  /* ─── Select suggestion — use onMouseDown so it fires BEFORE onBlur ─── */
  const pickSuggestion = (item) => {
    setSymbol(item.symbol);
    setName(item.name);
    setQuery(item.symbol);
    setShowDrop(false);
    setConfirmed(true);
    setSuggestions([]);
    // Auto-focus qty after picking
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  /* ─── Clear picked symbol to re-search ─── */
  const clearSymbol = () => {
    setSymbol("");
    setName("");
    setQuery("");
    setConfirmed(false);
    setShowDrop(false);
    setSuggestions([]);
  };

  /* ─── Category change ─── */
  const pickCategory = (c) => {
    if (editingAsset) return;
    setType(c);
    clearSymbol();
    if (c === "gold") {
      setSymbol("GC=F");
      setName("Spot Gold (ทองคำตลาดโลก)");
      setQuery("GC=F");
      setConfirmed(true);
    }
  };

  /* ─── Quick preset ─── */
  const applyPreset = (s, n) => {
    setSymbol(s);
    setName(n);
    setQuery(s);
    setConfirmed(true);
    setShowDrop(false);
    setSuggestions([]);
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  /* ─── Submit ─── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const pQty   = parseFloat(qty);
    const pPrice = parseFloat(price);
    if (!symbol.trim())            { alert("เลือกสินทรัพย์ก่อนนะครับ"); return; }
    if (isNaN(pQty) || pQty <= 0) { alert("ใส่จำนวนให้ถูกต้อง (มากกว่า 0)"); return; }
    if (isNaN(pPrice) || pPrice < 0) { alert("ใส่ราคาทุนให้ถูกต้อง"); return; }

    onSave({
      symbol: symbol.trim().toUpperCase(),
      name:   name.trim() || symbol.trim().toUpperCase(),
      type,
      qty:      pQty,
      avgPrice: pPrice,
      date,
    });
  };

  /* ─── Purchase history from lots ─── */
  const lots = editingAsset?.lots || [];

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {editingAsset
              ? `➕ ซื้อเพิ่ม ${editingAsset.symbol}`
              : "เพิ่มสินทรัพย์ใหม่"}
          </h2>
          <button onClick={onClose} className="btn-close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* ── Category selector (only for new asset) ── */}
            {!editingAsset && (
              <div className="form-group">
                <label className="form-label">ประเภทสินทรัพย์</label>
                <div className="category-selector">
                  {[
                    { key: "stock",  emoji: "🇺🇸", label: "หุ้น" },
                    { key: "gold",   emoji: "🥇", label: "ทองคำ" },
                    { key: "crypto", emoji: "🪙", label: "คริปโต" },
                    { key: "fiat",   emoji: "💵", label: "เงินสด" },
                  ].map(c => (
                    <button key={c.key} type="button"
                      className={`category-btn${type === c.key ? " active" : ""} ripple-btn`}
                      onClick={() => pickCategory(c.key)}>
                      <span className="category-emoji">{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Symbol search OR confirmed chip ── */}
            <div className="form-group">
              <label className="form-label">
                {!editingAsset ? (
                  type === "stock"  ? "ค้นหาหุ้น (ชื่อย่อหรือชื่อบริษัท)" :
                  type === "crypto" ? "ค้นหาเหรียญ (เช่น Bitcoin, SOL)" :
                  type === "gold"   ? "ทองคำตลาดโลก" :
                  "ค้นหาสกุลเงิน"
                ) : "สินทรัพย์"}
              </label>

              {/* Confirmed chip */}
              {confirmed || editingAsset ? (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--primary-light)", border: "1.5px solid var(--primary)",
                  borderRadius: 16, padding: "10px 14px"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 15 }}>{symbol}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{name}</div>
                  </div>
                  {!editingAsset && (
                    <button type="button" className="btn-close" onClick={clearSymbol}
                      style={{ background: "rgba(82,54,255,0.1)", color: "var(--primary)" }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                /* Search input + dropdown */
                <div style={{ position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: 44 }}
                      placeholder={
                        type === "stock"  ? "พิมพ์ เช่น Apple, NVDA, PTT.BK…" :
                        type === "crypto" ? "พิมพ์ เช่น Bitcoin, ETH, SOL…" :
                        type === "gold"   ? "GC=F" : "THB=X, EURUSD=X…"
                      }
                      value={query}
                      autoFocus
                      onChange={e => { setQuery(e.target.value); setConfirmed(false); }}
                      onFocus={() => { if (suggestions.length > 0) setShowDrop(true); }}
                      onBlur={() => {
                        // Delay so onMouseDown on suggestion fires first
                        setTimeout(() => setShowDrop(false), 180);
                      }}
                    />
                    {searching && (
                      <div className="spinner sm" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
                    )}
                  </div>

                  {/* Dropdown */}
                  {showDrop && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions.map(item => (
                        <div key={item.symbol} className="suggestion-item"
                          onMouseDown={(e) => { e.preventDefault(); pickSuggestion(item); }}>
                          <div className="suggestion-left">
                            <span className="suggestion-symbol">{item.symbol}</span>
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
              )}

              {/* Quick presets */}
              {!editingAsset && !confirmed && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {type === "stock" && (
                    <>
                      {[["AAPL","Apple Inc."],["NVDA","NVIDIA Corp."],["TSLA","Tesla Inc."],["PTT.BK","PTT ปตท."]].map(([s,n]) => (
                        <button key={s} type="button" className="ripple-btn"
                          style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "#F1F5F9", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit" }}
                          onMouseDown={(e) => { e.preventDefault(); applyPreset(s, n); }}>
                          {s}
                        </button>
                      ))}
                    </>
                  )}
                  {type === "crypto" && (
                    <>
                      {[["BTC-USD","Bitcoin"],["ETH-USD","Ethereum"],["SOL-USD","Solana"],["BNB-USD","BNB"]].map(([s,n]) => (
                        <button key={s} type="button" className="ripple-btn"
                          style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "#FFF7ED", border: "1px solid #FED7AA", cursor: "pointer", fontFamily: "inherit" }}
                          onMouseDown={(e) => { e.preventDefault(); applyPreset(s, n); }}>
                          {s.split("-")[0]}
                        </button>
                      ))}
                    </>
                  )}
                  {type === "fiat" && (
                    <>
                      {[["THB=X","USD/THB"],["EURUSD=X","EUR/USD"],["SGDTHB=X","SGD/THB"]].map(([s,n]) => (
                        <button key={s} type="button" className="ripple-btn"
                          style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "#ECFDF5", border: "1px solid #A7F3D0", cursor: "pointer", fontFamily: "inherit" }}
                          onMouseDown={(e) => { e.preventDefault(); applyPreset(s, n); }}>
                          {n}
                        </button>
                      ))}
                    </>
                  )}
                  {type === "gold" && (
                    <button type="button" className="ripple-btn"
                      style={{ height: 28, borderRadius: 8, padding: "0 10px", fontSize: 11, fontWeight: 700, background: "var(--gold-light)", border: "1px solid #FCD34D", cursor: "pointer", fontFamily: "inherit" }}
                      onMouseDown={(e) => { e.preventDefault(); applyPreset("GC=F", "Spot Gold"); }}>
                      GC=F Spot Gold 🥇
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Qty & Price inputs ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">จำนวน (หน่วย)</label>
                <input ref={qtyInputRef} type="number" step="any" min="0.000001"
                  className="form-input" placeholder="เช่น 10, 1.5"
                  value={qty} onChange={e => setQty(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  ราคาต่อหน่วย
                  <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 4 }}>
                    {symbol.includes(".BK") ? "(THB)" : "(USD)"}
                  </span>
                </label>
                <input type="number" step="any" min="0"
                  className="form-input" placeholder={symbol.includes(".BK") ? "บาท/หุ้น" : "USD/unit"}
                  value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
            </div>

            {/* ── Purchase Date ── */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">วันที่ซื้อ <span style={{ fontSize: 10, color: "var(--text-faint)" }}>(เก็บเป็น Log ประวัติ)</span></label>
              <input type="date" className="form-input"
                value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* ── Purchase History (ถ้ามี lots แล้ว) ── */}
            {editingAsset && lots.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <button type="button"
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "8px 0",
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 700, color: "var(--text-muted)", fontFamily: "inherit", width: "100%"
                  }}
                  onClick={() => setShowHistory(p => !p)}>
                  <History size={14} />
                  ประวัติการซื้อ ({lots.length} รายการ)
                  {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showHistory && (
                  <div style={{
                    border: "1px solid var(--border)", borderRadius: 16,
                    overflow: "hidden", marginTop: 6, animation: "fadeIn 0.2s ease-out"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>วันที่</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>จำนวน</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>ราคาทุน</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>มูลค่า</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...lots].reverse().map((lot, i) => (
                          <tr key={lot.id || i} style={{ borderTop: "1px solid var(--border)" }}>
                            <td style={{ padding: "9px 12px", color: "var(--text-muted)" }}>{fmtDate(lot.date)}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>{fmtQty(lot.qty)}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>{fmtUSD(lot.price)}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                              {fmtUSD(lot.qty * lot.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "1.5px solid var(--border)", background: "var(--primary-light)" }}>
                          <td colSpan={2} style={{ padding: "8px 12px", fontWeight: 700, color: "var(--primary)" }}>รวม</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)", fontSize: 11 }}>
                            avg {fmtUSD(editingAsset.avgCost)}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>
                            {fmtUSD(lots.reduce((s, l) => s + l.qty * l.price, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tip box */}
            {!editingAsset && (
              <div style={{
                marginTop: 14, background: "#FFFBEB", border: "1px solid #FEF3C7",
                borderRadius: 14, padding: "10px 14px", fontSize: 11, color: "#92400E",
                lineHeight: 1.6, display: "flex", gap: 8
              }}>
                <span>💡</span>
                <span>
                  {type === "stock"  && "หุ้นไทยต่อท้ายด้วย .BK เช่น PTT.BK · ราคาทุนใส่เป็นบาทได้เลย"}
                  {type === "crypto" && "ต่อท้ายด้วย -USD เช่น BTC-USD · ราคาทุนใส่เป็น USD"}
                  {type === "gold"   && "GC=F คือ Spot Gold ราคาต่อออนซ์ (USD)"}
                  {type === "fiat"   && "ใส่จำนวนเงินสดที่ถือ และราคาทุนเทียบ USD"}
                </span>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary ripple-btn" onClick={onClose}
              style={{ height: 48, flex: "0 0 100px" }}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary ripple-btn"
              style={{ height: 48, flex: 1 }}
              disabled={!symbol}>
              <Save size={16} />
              {editingAsset ? `บันทึก (ซื้อเพิ่ม ${qty ? fmtQty(parseFloat(qty) || 0) : "?"} หน่วย)` : "เพิ่มเข้าพอร์ต"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
