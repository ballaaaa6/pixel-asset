import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, PieChart, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { fmtUSD, fmtPct } from "../../utils/formatters";

export default function DividendDiversification({ sectorBreakdown, typeBreakdown, computedAssets, totalAnnualIncomeUSD }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    return registerModal(() => setIsOpen(false));
  }, [isOpen]);

  // Sector colors palette
  const getSectorColor = (index) => {
    const colors = [
      "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", // Blue
      "linear-gradient(135deg, #10B981 0%, #047857 100%)", // Green
      "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", // Purple
      "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", // Orange
      "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)", // Pink
      "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)"  // Cyan
    ];
    return colors[index % colors.length];
  };

  // Concentration Alerts
  const sectorRisk = sectorBreakdown.length > 0 && sectorBreakdown[0].pct > 40;
  
  // Find highest single asset share
  const sortedAssets = [...computedAssets]
    .filter(a => a.annualIncomeUSD > 0)
    .sort((a, b) => b.annualIncomeUSD - a.annualIncomeUSD);
  
  const topAssetShare = sortedAssets.length > 0 && totalAnnualIncomeUSD > 0
    ? (sortedAssets[0].annualIncomeUSD / totalAnnualIncomeUSD) * 100
    : 0;
  
  const assetRisk = topAssetShare > 30;

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
            <PieChart size={18} style={{ color: "var(--primary)" }} />
            การกระจายตัวของเงินปันผล
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>คลิกเพื่อดูรายละเอียด 🔍</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>สัดส่วนปันผลรายอุตสาหกรรม (Top Sectors)</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sectorBreakdown.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>ไม่มีอุตสาหกรรมที่จ่ายเงินปันผล</div>
            ) : (
              sectorBreakdown.slice(0, 3).map((sect, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
                    <span style={{ color: "var(--text-main)" }}>{sect.name}</span>
                    <span style={{ color: "var(--primary)" }}>{sect.pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${sect.pct}%`, height: "100%", background: getSectorColor(i), borderRadius: 3 }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {(sectorRisk || assetRisk) ? (
          <div style={{ display: "flex", gap: 8, background: "rgba(245, 158, 11, 0.05)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(245, 158, 11, 0.1)" }}>
            <AlertTriangle size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700 }}>
              {sectorRisk && assetRisk ? "กระจุกตัวอุตสาหกรรม & หุ้นรายตัวสูง" : sectorRisk ? "การปันผลกระจุกตัวรายอุตสาหกรรมสูง (>40%)" : "กระจุกตัวรายตัวหุ้นสูง (>30%)"}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, background: "rgba(16, 185, 129, 0.05)", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(16, 185, 129, 0.1)" }}>
            <CheckCircle size={14} style={{ color: "var(--gain)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "var(--gain)", fontWeight: 700 }}>
              การกระจายความเสี่ยงอยู่ในเกณฑ์ดีเยี่ยม
            </span>
          </div>
        )}
      </div>

      {isOpen && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                📊 การวิเคราะห์สัดส่วนและการกระจายความเสี่ยงปันผล
              </span>
              <button className="btn-close" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Risk Alert Info */}
              <div style={{ display: "flex", gap: 12, background: (sectorRisk || assetRisk) ? "rgba(245, 158, 11, 0.04)" : "rgba(16, 185, 129, 0.04)", borderRadius: 12, padding: 14, border: `1px solid ${(sectorRisk || assetRisk) ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)"}` }}>
                {sectorRisk || assetRisk ? (
                  <AlertTriangle size={20} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <CheckCircle size={20} style={{ color: "var(--gain)", flexShrink: 0, marginTop: 2 }} />
                )}
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>วิเคราะห์การกระจุกตัว (Concentration Risk):</strong>
                  {sectorRisk && <div style={{ marginTop: 4 }}>• ⚠️ <strong>กลุ่มอุตสาหกรรม {sectorBreakdown[0]?.name}:</strong> มีสัดส่วนถึง {sectorBreakdown[0]?.pct.toFixed(1)}% (ควรคุมไม่ให้เกิน 40%)</div>}
                  {assetRisk && <div style={{ marginTop: 4 }}>• ⚠️ <strong>หุ้นเดี่ยว {sortedAssets[0]?.symbol}:</strong> มีสัดส่วนถึง {topAssetShare.toFixed(1)}% ของปันผลทั้งหมด (ควรคุมไม่ให้เกิน 30%)</div>}
                  {!sectorRisk && !assetRisk && <div style={{ marginTop: 4 }}>✓ พอร์ตของคุณไม่มีสัดส่วนปันผลรายอุตสาหกรรมใดเกิน 40% และไม่มีหุ้นเดี่ยวใดจ่ายปันผลเกิน 30% ถือว่าปลอดภัยและมีเสถียรภาพของกระแสเงินสดสูงมาก</div>}
                </div>
              </div>

              {/* Grid 2 Columns for Sector and Dividend Quality Profile Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="dashboard-grid">
                
                {/* Left: Sectors */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>อุตสาหกรรมหลัก (Sectors)</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
                    {sectorBreakdown.map((sect, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{sect.name}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                            {sect.pct.toFixed(1)}% ({fmtUSD(sect.amountUSD)})
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${sect.pct}%`, height: "100%", background: getSectorColor(idx), borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Asset Quality Profile Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>โปรไฟล์ประเภทปันผล (Profiles)</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
                    {typeBreakdown.map((type, idx) => {
                      const typeColors = {
                        "Dividend King": "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", // Gold
                        "Dividend Aristocrat": "linear-gradient(135deg, #10B981 0%, #047857 100%)", // Green
                        "High Yield": "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)", // Pink
                        "Dividend Grower": "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" // Blue
                      };
                      const bg = typeColors[type.name] || "var(--primary)";
                      
                      return (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{type.name}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                              {type.pct.toFixed(1)}% ({fmtUSD(type.amountUSD)})
                            </span>
                          </div>
                          <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${type.pct}%`, height: "100%", background: bg, borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
