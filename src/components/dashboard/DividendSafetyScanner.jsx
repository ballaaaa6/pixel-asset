import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, AlertTriangle, Shield } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { fmtPct } from "../../utils/formatters";

export default function DividendSafetyScanner({ safetyScore, flaggedCount, computedAssets, hideValues }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    return registerModal(() => setIsOpen(false));
  }, [isOpen]);

  const getSafetyColor = (score) => {
    if (score >= 80) return "var(--gain)";
    if (score >= 55) return "var(--gold)";
    return "var(--loss)";
  };

  const getSafetyLabel = (score) => {
    if (score >= 80) return "ปลอดภัยสูง (High Safety)";
    if (score >= 55) return "เสี่ยงปานกลาง (Moderate)";
    return "เสี่ยงสูง/ระวังกับดักปันผล (High Risk)";
  };

  return (
    <>
      <div 
        className="card clickable ripple-btn"
        style={{ 
          padding: 24, 
          display: "flex", 
          flexDirection: "column", 
          gap: 16, 
          cursor: "pointer", 
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16
        }}
        onClick={() => setIsOpen(true)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Shield size={18} style={{ color: getSafetyColor(safetyScore) }} />
            วิเคราะห์ความปลอดภัยปันผล
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>คลิกเพื่อดูรายละเอียด 🔍</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
          <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Simple Circular Progress SVG */}
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#F1F5F9" strokeWidth="6" />
              <circle 
                cx="40" 
                cy="40" 
                r="34" 
                fill="none" 
                stroke={getSafetyColor(safetyScore)} 
                strokeWidth="6" 
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - safetyScore / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", fontSize: 18, fontWeight: 900, color: "var(--text-main)" }}>
              {safetyScore}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)" }}>
              {getSafetyLabel(safetyScore)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
              พอร์ตของคุณมีหุ้นติดสัญญาณเตือนอัตราจ่ายปันผลสูงผิดปกติ (Dividend Trap) ทั้งหมด{" "}
              <strong style={{ color: flaggedCount > 0 ? "var(--loss)" : "var(--text-main)", fontWeight: 800 }}>
                {flaggedCount} ตัว
              </strong>
            </span>
          </div>
        </div>

        {flaggedCount > 0 && (
          <div style={{ display: "flex", gap: 8, background: "rgba(239, 68, 68, 0.05)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239, 68, 68, 0.1)" }}>
            <AlertTriangle size={14} style={{ color: "var(--loss)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "var(--loss)", fontWeight: 700 }}>
              พบ Yield สูงผิดปกติเสี่ยงโดนลดปันผล: {computedAssets.filter(a => a.safetyRating === "Warning" && a.annualIncomeUSD > 0).map(a => a.symbol).join(", ")}
            </span>
          </div>
        )}
      </div>

      {isOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                🛡️ ตัวสแกนความปลอดภัยปันผล & กับดักปันผล
              </span>
              <button className="btn-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, background: "var(--primary-light)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" }}>
                <ShieldCheck size={20} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>Dividend Trap (กับดักปันผล)</strong> คือหุ้นที่มีอัตราปันผล (Yield) สูงมากอย่างไม่สมเหตุสมผล ซึ่งมักเกิดจากราคาหุ้นร่วงอย่างรุนแรง หรือบริษัทจ่ายปันผลมากกว่ากำไรสะสม (Payout Ratio &gt; 80-90%) ซึ่งมีความเสี่ยงสูงที่จะถูกลดหรือยกเลิกการจ่ายปันผลในภายหลัง
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>รายการความปลอดภัยของสินทรัพย์ในพอร์ต</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {computedAssets.filter(a => a.annualIncomeUSD > 0).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-faint)", fontSize: 12 }}>ไม่มีรายการปันผลในพอร์ต</div>
                  ) : (
                    computedAssets
                      .filter(a => a.annualIncomeUSD > 0)
                      .sort((a, b) => {
                        const scoreA = a.safetyRating === "Warning" ? 3 : a.safetyRating === "Moderate" ? 2 : 1;
                        const scoreB = b.safetyRating === "Warning" ? 3 : b.safetyRating === "Moderate" ? 2 : 1;
                        return scoreB - scoreA; // Warning first
                      })
                      .map((asset, i) => {
                        const isWarning = asset.safetyRating === "Warning";
                        const isModerate = asset.safetyRating === "Moderate";

                        return (
                          <div 
                            key={i} 
                            style={{ 
                              display: "flex", 
                              flexDirection: "column", 
                              gap: 8, 
                              padding: 14, 
                              background: isWarning 
                                ? "rgba(239, 68, 68, 0.03)" 
                                : isModerate 
                                ? "rgba(245, 158, 11, 0.03)" 
                                : "rgba(0, 0, 0, 0.01)", 
                              borderRadius: 12, 
                              border: `1px solid ${isWarning ? "rgba(239, 68, 68, 0.2)" : isModerate ? "rgba(245, 158, 11, 0.2)" : "var(--border)"}`
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text-main)" }}>{asset.symbol}</span>
                                <span 
                                  style={{ 
                                    fontSize: 10, 
                                    fontWeight: 700, 
                                    padding: "2px 8px", 
                                    borderRadius: 8, 
                                    background: isWarning ? "rgba(239, 68, 68, 0.1)" : isModerate ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                    color: isWarning ? "var(--loss)" : isModerate ? "var(--gold)" : "var(--gain)"
                                  }}
                                >
                                  {isWarning ? "ระวังกับดัก" : isModerate ? "เสี่ยงปานกลาง" : "ปลอดภัยดี"}
                                </span>
                              </div>
                              <div style={{ textAlign: "right", display: "flex", gap: 12 }}>
                                <div>
                                  <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block" }}>Yield</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{fmtPct(asset.yieldPct)}</span>
                                </div>
                                <div>
                                  <span style={{ fontSize: 10, color: "var(--text-faint)", display: "block" }}>Est. Payout</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{asset.payoutRatio}%</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                              {isWarning ? (
                                <span>⚠️ <strong>ข้อความเตือน:</strong> อัตราเงินปันผลสูงผิดปกติ ({fmtPct(asset.yieldPct)}) และประมาณการ Payout Ratio สูงถึง {asset.payoutRatio}% มีความเสี่ยงที่รายได้ปันผลจะลดลงอย่างมีนัยสำคัญในอนาคต</span>
                              ) : isModerate ? (
                                <span>⚡ <strong>ข้อแนะนำ:</strong> สัดส่วนปันผลและ Payout Ratio อยู่ในระดับตึงตัวเล็กน้อย ({asset.payoutRatio}%) ควรติดตามผลกำไรสุทธิของบริษัทเป็นระยะ</span>
                              ) : (
                                <span>✓ <strong>สถานะปกติ:</strong> กระแสเงินสดการจ่ายปันผลมีความยั่งยืนสูง ความเสี่ยงการถูกปรับลดต่ำมาก</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
