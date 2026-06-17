import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, AlertTriangle, FileText } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { parseOptionSymbol } from "../../utils/dimePdfParser";

/**
 * DimeImportPreviewModal
 * Shows a parsed Dime Transactions History report table before confirming import.
 * Highlights option contracts, duplicate Order IDs, and parse errors.
 */
export default function DimeImportPreviewModal({ isOpen, onClose, transactions, existingAssets, onConfirm }) {
  const [selected, setSelected] = useState(() => new Set(transactions.map((_, i) => i)));

  React.useEffect(() => {
    if (!isOpen) return;
    return registerModal(onClose);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    setSelected(new Set(transactions.map((_, i) => i)));
  }, [transactions]);

  const deduped = useMemo(() => {
    return transactions.map((tx, i) => {
      let isDuplicate = false;
      if (tx.orderId && existingAssets) {
        const match = existingAssets.find(a =>
          a.symbol.toUpperCase() === tx.symbol.toUpperCase() &&
          (a.broker || "").toUpperCase() === (tx.broker || "").toUpperCase()
        );
        if (match && (match.lots || []).some(l => l.orderId === tx.orderId)) {
          isDuplicate = true;
        }
      }
      return { ...tx, _idx: i, _isDuplicate: isDuplicate };
    });
  }, [transactions, existingAssets]);

  const toggleRow = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === transactions.length) setSelected(new Set());
    else setSelected(new Set(transactions.map((_, i) => i)));
  };

  const handleConfirm = () => {
    const toImport = transactions.filter((_, i) => selected.has(i));
    onConfirm(toImport);
  };

  const counts = useMemo(() => ({
    total: transactions.length,
    options: transactions.filter(t => parseOptionSymbol(t.symbol)).length,
    duplicates: deduped.filter(t => t._isDuplicate).length,
    selected: selected.size,
  }), [transactions, deduped, selected]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: 860, width: "96vw" }}>
        <div className="modal-header">
          <span className="modal-title">
            <FileText size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            พรีวิวรายงาน Dime! ({counts.total} รายการ)
          </span>
          <button className="btn-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Summary badges */}
        <div style={{ display: "flex", gap: 8, padding: "10px 20px", flexWrap: "wrap", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "var(--primary-light)", color: "var(--primary)", fontWeight: 700 }}>
            {counts.selected} เลือก / {counts.total} ทั้งหมด
          </span>
          {counts.options > 0 && (
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#EDE9FE", color: "#7C3AED", fontWeight: 700 }}>
              📜 {counts.options} ออปชัน
            </span>
          )}
          {counts.duplicates > 0 && (
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>
              ⚠️ {counts.duplicates} ซ้ำกัน (จะถูกข้าม)
            </span>
          )}
        </div>

        {/* Table */}
        <div className="modal-body" style={{ padding: 0, maxHeight: "55vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#F8FAFC", position: "sticky", top: 0, zIndex: 1, boxShadow: "0 1px 0 var(--border)" }}>
                <th style={{ padding: "9px 12px", width: 36, textAlign: "center" }}>
                  <input type="checkbox" checked={selected.size === transactions.length} onChange={toggleAll} style={{ cursor: "pointer" }} />
                </th>
                <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>วันที่</th>
                <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>ประเภท</th>
                <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)" }}>สินทรัพย์</th>
                <th style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>จำนวน</th>
                <th style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "var(--text-muted)" }}>ราคา</th>
                <th style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>Order ID</th>
                <th style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "var(--text-muted)" }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {deduped.map((tx) => {
                const optionInfo = parseOptionSymbol(tx.symbol);
                const isChecked = selected.has(tx._idx);
                const rowBg = tx._isDuplicate ? "#FFFBEB" : isChecked ? "transparent" : "#FAFAFA";
                return (
                  <tr
                    key={tx._idx}
                    onClick={() => toggleRow(tx._idx)}
                    style={{ borderTop: "1px solid var(--border)", cursor: "pointer", background: rowBg, opacity: tx._isDuplicate ? 0.65 : 1 }}
                  >
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "8px 12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{tx.date}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {tx.transactionType === "BUY"
                        ? <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4 }}>BUY</span>
                        : <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 6px", borderRadius: 4 }}>SELL</span>
                      }
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{tx.symbol}</div>
                      {optionInfo && (
                        <div style={{ fontSize: 10, color: "#7C3AED", background: "#EDE9FE", padding: "2px 7px", borderRadius: 10, marginTop: 3, display: "inline-block", fontWeight: 600 }}>
                          📜 {optionInfo.type} · ${optionInfo.strike} · {optionInfo.expiry}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{tx.qty}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>
                      ${tx.avgPrice?.toFixed(2)}
                      {tx.ccy === "THB" && <div style={{ fontSize: 10, color: "var(--text-faint)" }}>฿</div>}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {tx.orderId
                        ? <code style={{ fontSize: 10, background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>{tx.orderId}</code>
                        : <span style={{ color: "var(--text-faint)" }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {tx._isDuplicate
                        ? <span title="Order ID ซ้ำ — จะถูกข้าม"><AlertTriangle size={14} color="#92400E" /></span>
                        : <span title="พร้อมนำเข้า"><Check size={14} color="#16A34A" /></span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-footer" style={{ padding: "12px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary ripple-btn" onClick={onClose} style={{ height: 42, fontSize: 13 }}>ยกเลิก</button>
          <button
            className="btn ripple-btn"
            onClick={handleConfirm}
            disabled={counts.selected === 0}
            style={{ height: 42, fontSize: 13, background: counts.selected > 0 ? "var(--primary)" : "var(--border)", color: counts.selected > 0 ? "white" : "var(--text-muted)", border: "none", fontWeight: 700, boxShadow: counts.selected > 0 ? "0 4px 12px var(--primary-glow)" : "none" }}
          >
            นำเข้า {counts.selected} รายการ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
