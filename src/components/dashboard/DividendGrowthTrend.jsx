import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, TrendingUp, TrendingDown, Info, Award } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { fmtPct, fmtUSD } from "../../utils/formatters";

export default function DividendGrowthTrend({ yocLeaderboard, computedAssets, averageYield, hideValues }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    return registerModal(() => setIsOpen(false));
  }, [isOpen]);

  // Compute average portfolio Yield on Cost
  const totalIncomeUSD = computedAssets.reduce((sum, a) => sum + (a.annualIncomeUSD || 0), 0);
  const totalCostUSD = computedAssets.reduce((sum, a) => sum + ((a.avgCostUSD || 0) * (a.qty || 0)), 0);
  const averageYOC = totalCostUSD > 0 ? (totalIncomeUSD / totalCostUSD) * 100 : 0;

  const yocOutperforms = averageYOC > averageYield;

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
            <Award size={18} style={{ color: "var(--gold)" }} />
            การเติบโตปันผล & Yield on Cost
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>คลิกเพื่อดูรายละเอียด 🔍</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", gap: 16, flex: 1 }}>
          <div style={{ flex: 1, textAlign: "center", borderRight: "1px solid var(--border)", paddingRight: 8 }}>
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 800, display: "block" }}>CURRENT YIELD เฉลี่ย</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text-main)", display: "block", marginTop: 4 }}>
              {fmtPct(averageYield)}
            </span>
          </div>

          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 800, display: "block" }}>YIELD ON COST เฉลี่ย</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: yocOutperforms ? "var(--gain)" : "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
              {fmtPct(averageYOC)}
              {yocOutperforms && <TrendingUp size={16} style={{ color: "var(--gain)" }} />}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4, margin: 0 }}>
          {yocOutperforms ? (
            <span>🎉 <strong>Yield on Cost</strong> ของพอร์ตคุณสูงกว่าปันผลปัจจุบัน <strong>+{(averageYOC - averageYield).toFixed(2)}%</strong> แสดงถึงความคุ้มค่าของการถือครองสินทรัพย์ระยะยาว</span>
          ) : (
            <span>💡 Yield on Cost คืออัตราปันผลเทียบกับ <strong>ราคาทุนเฉลี่ยที่คุณซื้อจริง</strong> หุ้นที่มีปันผลเติบโตจะช่วยดันให้ YOC ของคุณสูงขึ้นเรื่อยๆ ตามเวลา</span>
          )}
        </div>
      </div>

      {isOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                📈 วิเคราะห์การเติบโตปันผล (Yield on Cost Leaderboard)
              </span>
              <button className="btn-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 10, background: "#F8FAFC", borderRadius: 12, padding: 12, border: "1px solid var(--border)" }}>
                <Info size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>Yield on Cost (YOC)</strong> คือ อัตราเงินปันผลคิดเป็นร้อยละเทียบกับ <strong>ราคาทุนเฉลี่ยที่คุณซื้อจริง</strong> ในขณะที่ <strong>Current Yield</strong> คืออัตราเงินปันผลคิดเป็นร้อยละเทียบกับ <strong>ราคาตลาดในปัจจุบัน</strong>
                  <br />
                  หาก YOC สูงกว่า Current Yield (ลูกศรขึ้น <span style={{ color: "var(--gain)" }}>▲</span>) แสดงว่าคุณได้ประโยชน์จากการซื้อสินทรัพย์ราคาดีและอัตราปันผลเพิ่มขึ้น
                </div>
              </div>

              <div className="table-wrapper" style={{ maxHeight: 350, overflowY: "auto" }}>
                <table className="asset-table" style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>สินทรัพย์</th>
                      <th style={{ textAlign: "right" }}>ราคาทุนเฉลี่ย</th>
                      <th style={{ textAlign: "right" }}>ราคาตลาด</th>
                      <th style={{ textAlign: "right" }}>Current Yield</th>
                      <th style={{ textAlign: "right" }}>Yield on Cost (YOC)</th>
                      <th style={{ textAlign: "center" }}>เปรียบเทียบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yocLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "20px 0", color: "var(--text-faint)" }}>ไม่มีสินทรัพย์ปันผลในพอร์ต</td>
                      </tr>
                    ) : (
                      yocLeaderboard.map((asset, i) => {
                        const isUp = asset.yieldOnCostPct > asset.yieldPct;
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 800 }}>{asset.symbol}</td>
                            <td style={{ textAlign: "right" }}>{fmtUSD(asset.avgCostUSD)}</td>
                            <td style={{ textAlign: "right" }}>{fmtUSD(asset.priceUSD)}</td>
                            <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtPct(asset.yieldPct)}</td>
                            <td style={{ textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>{fmtPct(asset.yieldOnCostPct)}</td>
                            <td style={{ textAlign: "center" }}>
                              {asset.yieldOnCostPct > 0 && asset.yieldPct > 0 ? (
                                isUp ? (
                                  <span style={{ color: "var(--gain)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>
                                    <TrendingUp size={14} /> +{(asset.yieldOnCostPct - asset.yieldPct).toFixed(2)}%
                                  </span>
                                ) : (
                                  <span style={{ color: "var(--loss)", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>
                                    <TrendingDown size={14} /> {(asset.yieldOnCostPct - asset.yieldPct).toFixed(2)}%
                                  </span>
                                )
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
