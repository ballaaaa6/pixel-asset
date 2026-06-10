import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Save } from "lucide-react";
import { getCurrencyTicker } from "../utils/assetHelpers.js";
import { fmtDate, fmtUSD, fmtQty } from "../utils/formatters.js";
import { CURRENCIES } from "../utils/constants.js";
import { useReceiptScanner } from "../hooks/useReceiptScanner.js";
import ReceiptUploadZone from "./modal/ReceiptUploadZone.jsx";
import ScannedQueueList from "./modal/ScannedQueueList.jsx";
import AssetHistoryTable from "./modal/AssetHistoryTable.jsx";
import AssetSearchSelector from "./modal/AssetSearchSelector.jsx";
import BrokerSelectBadges from "./modal/BrokerSelectBadges.jsx";

export default function AssetModal({ isOpen, onClose, onSave, editingAsset, exchangeRate, showToast, onSessionExpired }) {
  const [type, setType] = useState("stock");
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("");
  const [broker, setBroker] = useState("");
  const [txType, setTxType] = useState("BUY");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currencyQuery, setCurrencyQuery] = useState("");
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const [currencyRate, setCurrencyRate] = useState(1.0);
  const [currencyRateLoading, setCurrencyRateLoading] = useState(false);
  const [scannedQueue, setScannedQueue] = useState([]);
  const [customRate, setCustomRate] = useState("");
  const [showBrokerDrop, setShowBrokerDrop] = useState(false);
  const debounceRef = useRef(null);
  const qtyInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const triggerToast = (msg, toastType = "success") => showToast ? showToast(msg, toastType) : alert(msg);

  const { scanning, scanningStatus, handleDropReceipt, handleFileSelect } = useReceiptScanner({
    scannedQueue, setScannedQueue, setSymbol, setQuery, setName, setType, setQty, setPrice, setDate, setTime, setBroker, setTxType, setConfirmed, triggerToast, onSessionExpired
  });

  const filteredCurrencies = useMemo(() => {
    const q = currencyQuery.trim().toLowerCase();
    const pinned = CURRENCIES.filter(c => c.code === "THB" || c.code === "USD");
    const others = CURRENCIES.filter(c => c.code !== "THB" && c.code !== "USD");
    if (!q) return [...pinned, ...others];
    return [...pinned, ...others].filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [currencyQuery]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingAsset) {
      const cat = editingAsset.category || editingAsset.type || "stock";
      setType(cat); setSymbol(editingAsset.symbol || ""); setName(editingAsset.name || "");
      setQuery(editingAsset.symbol || ""); setCurrencyQuery(cat === "fiat" ? (editingAsset.symbol || "") : "");
      setQty(""); setPrice(""); setDate(new Date().toISOString().split("T")[0]); setTime("");
      setBroker(editingAsset.broker || ""); setConfirmed(true); setShowDrop(false); setShowCurrencyDrop(false); setSuggestions([]);
      setCustomRate("");
    } else {
      setType("stock"); setSymbol(""); setName(""); setQuery(""); setCurrencyQuery("");
      setQty(""); setPrice(""); setDate(new Date().toISOString().split("T")[0]); setTime("");
      setBroker(""); setConfirmed(false); setShowDrop(false); setShowCurrencyDrop(false); setSuggestions([]);
      setCustomRate("");
    }
    setShowHistory(false); setScannedQueue([]);
  }, [isOpen, editingAsset]);

  useEffect(() => {
    if (type !== "fiat" || !symbol) return;
    if (symbol === "USD") { setCurrencyRate(1.0); return; }
    if (symbol === "THB") { setCurrencyRate(1.0 / (exchangeRate || 35.0)); return; }
    setCurrencyRateLoading(true);
    const ticker = getCurrencyTicker(symbol);
    fetch(`/api/prices?symbols=${encodeURIComponent(ticker)}`)
      .then(res => res.json())
      .then(data => {
        const q = data.quotes?.[ticker];
        if (q && q.price > 0) setCurrencyRate(["EUR", "GBP", "AUD", "NZD"].includes(symbol) ? q.price : 1.0 / q.price);
      })
      .catch(console.error)
      .finally(() => setCurrencyRateLoading(false));
  }, [symbol, type, exchangeRate]);

  useEffect(() => {
    if (confirmed || editingAsset) return;
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); setShowDrop(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/prices?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 7)); setShowDrop(data.length > 0);
        }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, confirmed, editingAsset]);

  if (!isOpen) return null;

  const pickSuggestion = (item) => {
    setSymbol(item.symbol); setName(item.name); setQuery(item.symbol);
    setShowDrop(false); setConfirmed(true); setSuggestions([]);
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };
  const clearSymbol = () => {
    setSymbol(""); setName(""); setQuery(""); setConfirmed(false); setShowDrop(false); setSuggestions([]);
  };
  const pickCategory = (c) => {
    if (editingAsset) return;
    setType(c); clearSymbol();
    if (c === "gold") applyPreset("GC=F", "Spot Gold (ทองคำตลาดโลก)");
    else if (c === "fiat") applyPreset("THB", "Thai Baht (บาท 🇹🇭)");
  };
  const applyPreset = (s, n) => {
    setSymbol(s); setName(n); setQuery(s); setConfirmed(true);
    setShowDrop(false); setSuggestions([]);
    if (type === "fiat") setCurrencyQuery(s);
    setTimeout(() => qtyInputRef.current?.focus(), 50);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pQty = parseFloat(qty);
    if (!symbol.trim()) { triggerToast("เลือกสินทรัพย์ก่อนนะครับ", "error"); return; }
    if (isNaN(pQty) || pQty <= 0) { triggerToast("ใส่จำนวนให้ถูกต้อง (มากกว่า 0)", "error"); return; }
    let pPrice = parseFloat(price);
    if (type === "fiat") {
      if (symbol === "USD") {
        pPrice = 1.0;
      } else if (["EUR", "GBP", "AUD", "NZD"].includes(symbol)) {
        pPrice = customRate ? parseFloat(customRate) : currencyRate;
      } else {
        pPrice = customRate ? (1.0 / parseFloat(customRate)) : currencyRate;
      }
    }
    if (type !== "fiat" && (isNaN(pPrice) || pPrice < 0)) { triggerToast("ใส่ราคาทุนให้ถูกต้อง", "error"); return; }

    onSave({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || symbol.trim().toUpperCase(),
      type,
      qty: pQty,
      avgPrice: pPrice,
      date: date ? date.trim() : new Date().toISOString().split("T")[0],
      time: time ? time.trim() : "00:00",
      broker: broker.trim(),
      transactionType: txType,
    });
  };

  const handleBatchSubmit = (e) => {
    e.preventDefault();
    if (scannedQueue.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const cleanedQueue = [];

    for (const item of scannedQueue) {
      if (!item.symbol.trim()) { triggerToast("กรุณากรอกสัญลักษณ์สินทรัพย์ให้ครบถ้วน", "error"); return; }
      const pQty = parseFloat(item.qty);
      if (isNaN(pQty) || pQty <= 0) { triggerToast(`กรุณากรอกจำนวนของ ${item.symbol} ให้ถูกต้อง (มากกว่า 0)`, "error"); return; }
      const pPrice = parseFloat(item.avgPrice);
      if (item.type !== "fiat" && (isNaN(pPrice) || pPrice < 0)) { triggerToast(`กรุณากรอกราคาทุนต่อหน่วยของ ${item.symbol} ให้ถูกต้อง`, "error"); return; }

      cleanedQueue.push({
        ...item,
        symbol: item.symbol.trim().toUpperCase(),
        name: item.name ? item.name.trim() : item.symbol.trim().toUpperCase(),
        qty: pQty,
        avgPrice: pPrice,
        date: item.date ? item.date.trim() : today,
        time: item.time ? item.time.trim() : "00:00",
        broker: item.broker ? item.broker.trim() : "Dime!"
      });
    }
    onSave(cleanedQueue);
  };

  const lots = editingAsset?.lots || [];

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingAsset
              ? (txType === "SELL"
                  ? (type === "fiat" ? `📤 ถอนเงินสด ${editingAsset.symbol}` : `🔴 ขายสินทรัพย์ ${editingAsset.symbol}`)
                  : (type === "fiat" ? `📥 ฝากเงินสด ${editingAsset.symbol}` : `🟢 ซื้อสินทรัพย์ ${editingAsset.symbol}`)
                )
              : (scannedQueue.length > 0 ? `📋 ตรวจสอบคิวสแกน (${scannedQueue.length} รายการ)` : "เพิ่มสินทรัพย์ใหม่")}
          </h2>
          <button onClick={onClose} className="btn-close"><X size={18} /></button>
        </div>

        <form onSubmit={scannedQueue.length > 0 ? handleBatchSubmit : handleSubmit}>
          <div className="modal-body">
            {!editingAsset && scannedQueue.length === 0 && (
              <ReceiptUploadZone
                scanning={scanning}
                scanningStatus={scanningStatus}
                fileInputRef={fileInputRef}
                handleDropReceipt={handleDropReceipt}
                handleFileSelect={handleFileSelect}
              />
            )}
            {scannedQueue.length > 0 ? (
              <ScannedQueueList
                scannedQueue={scannedQueue}
                setScannedQueue={setScannedQueue}
                fileInputRef={fileInputRef}
                handleDropReceipt={handleDropReceipt}
              />
            ) : (
              <>
                {!editingAsset && (
                  <div className="form-group">
                    <label className="form-label">ประเภทสินทรัพย์</label>
                    <div className="category-selector">
                      {[
                        { key: "stock", emoji: "🇺🇸", label: "หุ้น" },
                        { key: "gold", emoji: "🥇/🛢️", label: "ทองคำ/น้ำมัน" },
                        { key: "crypto", emoji: "🪙", label: "คริปโต" },
                        { key: "fiat", emoji: "💵", label: "เงินสด" },
                      ].map(c => (
                        <button key={c.key} type="button" className={`category-btn${type === c.key ? " active" : ""} ripple-btn`} onClick={() => pickCategory(c.key)}>
                          <span className="category-emoji">{c.emoji}</span>
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {type === "gold" && !editingAsset && (
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">เลือกประเภทโภคภัณฑ์</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F1F5F9", padding: 4, borderRadius: 12, gap: 4 }}>
                      <button type="button" onClick={() => applyPreset("GC=F", "Spot Gold (ทองคำตลาดโลก)")} style={{ height: 38, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: symbol === "GC=F" ? "var(--primary)" : "transparent", color: symbol === "GC=F" ? "white" : "var(--text-muted)", transition: "var(--transition)" }}>
                        🥇 ทองคำ (Spot Gold)
                      </button>
                      <button type="button" onClick={() => applyPreset("CL=F", "Crude Oil (น้ำมันดิบตลาดโลก)")} style={{ height: 38, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: symbol === "CL=F" ? "var(--primary)" : "transparent", color: symbol === "CL=F" ? "white" : "var(--text-muted)", transition: "var(--transition)" }}>
                        🛢️ น้ำมัน (Crude Oil)
                      </button>
                    </div>
                  </div>
                )}

                <AssetSearchSelector
                  type={type}
                  symbol={symbol}
                  name={name}
                  editingAsset={editingAsset}
                  confirmed={confirmed}
                  clearSymbol={clearSymbol}
                  query={query}
                  setQuery={setQuery}
                  setConfirmed={setConfirmed}
                  suggestions={suggestions}
                  searching={searching}
                  showDrop={showDrop}
                  setShowDrop={setShowDrop}
                  pickSuggestion={pickSuggestion}
                  applyPreset={applyPreset}
                  currencyQuery={currencyQuery}
                  setCurrencyQuery={setCurrencyQuery}
                  showCurrencyDrop={showCurrencyDrop}
                  setShowCurrencyDrop={setShowCurrencyDrop}
                  filteredCurrencies={filteredCurrencies}
                  setSymbol={setSymbol}
                  setName={setName}
                />

                {confirmed && (
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">ประเภทรายการ</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F1F5F9", padding: 4, borderRadius: 12, gap: 4 }}>
                      <button type="button" onClick={() => setTxType("BUY")} style={{ height: 38, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: txType === "BUY" ? (type === "fiat" ? "var(--primary)" : "var(--gain)") : "transparent", color: txType === "BUY" ? "white" : "var(--text-muted)", transition: "var(--transition)" }}>
                        {type === "fiat" ? "📥 ฝากเงินสด" : "🟢 ซื้อ (Buy)"}
                      </button>
                      <button type="button" onClick={() => setTxType("SELL")} style={{ height: 38, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: txType === "SELL" ? "var(--loss)" : "transparent", color: txType === "SELL" ? "white" : "var(--text-muted)", transition: "var(--transition)" }}>
                        {type === "fiat" ? "📤 ถอนเงินสด" : "🔴 ขาย (Sell)"}
                      </button>
                    </div>
                  </div>
                )}

                {type === "fiat" ? (
                  <div style={{ display: "grid", gridTemplateColumns: symbol === "USD" ? "1fr" : "1fr 1fr", gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label className="form-label">จำนวนเงินสด</label>
                        {currencyRateLoading && <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}><span className="spinner sm" style={{ width: 12, height: 12, borderWidth: "1.5px" }} /> ดึงอัตรา...</span>}
                      </div>
                      <input ref={qtyInputRef} type="number" step="any" min="0.01" className="form-input" placeholder={`กรอกจำนวนเงินสด (${symbol || "สกุลเงิน"})`} value={qty} onChange={(e) => setQty(e.target.value)} required autoFocus />
                    </div>
                    {symbol !== "USD" && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">
                          {["EUR", "GBP", "AUD", "NZD"].includes(symbol)
                            ? `อัตราแลกเปลี่ยนทุน (USD/${symbol})`
                            : `อัตราแลกเปลี่ยนทุน (${symbol}/USD)`}
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.000001"
                          className="form-input"
                          placeholder={
                            currencyRate
                              ? (["EUR", "GBP", "AUD", "NZD"].includes(symbol)
                                  ? currencyRate.toFixed(4)
                                  : (1.0 / currencyRate).toFixed(2))
                              : "35.20"
                          }
                          value={customRate}
                          onChange={(e) => setCustomRate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">จำนวน (หน่วย)</label>
                      <input ref={qtyInputRef} type="number" step="any" min="0.000001" className="form-input" placeholder="เช่น 10, 1.5" value={qty} onChange={e => setQty(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">ราคาต่อหน่วย<span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 4 }}>{symbol.includes(".BK") ? "(THB)" : "(USD)"}</span></label>
                      <input type="number" step="any" min="0" className="form-input" placeholder={symbol.includes(".BK") ? "บาท/หุ้น" : "USD/unit"} value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">วันที่ทำรายการ</label>
                    <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">เวลาที่ทำรายการ</label>
                    <input type="time" className="form-input" value={time} onChange={e => setTime(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 14, marginBottom: 0, position: "relative" }}>
                  <label className="form-label">{type === "fiat" ? "ธนาคาร" : "โบรกเกอร์"}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={type === "fiat" ? "พิมพ์ธนาคารที่ฝากเงิน" : "พิมพ์โบรกเกอร์ที่ซื้อขาย"}
                    value={broker}
                    onChange={e => { setBroker(e.target.value); setShowBrokerDrop(true); }}
                    onFocus={() => setShowBrokerDrop(true)}
                    onBlur={() => setTimeout(() => setShowBrokerDrop(false), 200)}
                  />
                  {showBrokerDrop && (
                    <BrokerSelectBadges type={type} symbol={symbol} value={broker} onChange={(val) => { setBroker(val); setShowBrokerDrop(false); }} />
                  )}
                </div>
                <AssetHistoryTable lots={lots} editingAsset={editingAsset} showHistory={showHistory} setShowHistory={setShowHistory} fmtDate={fmtDate} fmtQty={fmtQty} fmtUSD={fmtUSD} />
                {!editingAsset && (
                  <div style={{ marginTop: 14, background: "#FFFBEB", border: "1px solid #FEF3C7", borderRadius: 14, padding: "10px 14px", fontSize: 11, color: "#92400E", lineHeight: 1.6, display: "flex", gap: 8 }}>
                    <span>💡</span>
                    <span>
                      {type === "stock" && "พิมพ์ชื่อหุ้นที่ต้องการค้นหาแล้วเลือกจากรายการได้เลย · หุ้นไทยราคาหน่วยเป็นบาท"}
                      {type === "crypto" && "ต่อท้ายด้วย -USD เช่น BTC-USD · ราคาทุนใส่เป็น USD"}
                      {type === "gold" && "GC=F คือ Spot Gold, CL=F คือ Crude Oil ตลาดโลก (USD)"}
                      {type === "fiat" && "กรอกจำนวนเงินสดที่คุณถือครองและเลือกสกุลเงินสดได้เลย"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary ripple-btn" onClick={onClose} style={{ height: 48, flex: "0 0 100px" }}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary ripple-btn" style={{ height: 48, flex: 1 }} disabled={scannedQueue.length === 0 && !symbol}>
              <Save size={16} />
              {editingAsset
                ? (txType === "SELL"
                    ? (type === "fiat" ? `ถอนเงินสด -${qty ? fmtQty(parseFloat(qty) || 0) : "?"} THB` : `ขายออก -${qty ? fmtQty(parseFloat(qty) || 0) : "?"} หน่วย`)
                    : (type === "fiat" ? `ฝากเงินสด +${qty ? fmtQty(parseFloat(qty) || 0) : "?"} THB` : `ซื้อเพิ่ม +${qty ? fmtQty(parseFloat(qty) || 0) : "?"} หน่วย`)
                  )
                : (scannedQueue.length > 0 ? `ยืนยันและนำเข้าทั้งหมด (${scannedQueue.length} รายการ)` : "เพิ่มเข้าพอร์ต")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
