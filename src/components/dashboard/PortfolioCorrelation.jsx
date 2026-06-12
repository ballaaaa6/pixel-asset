import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, HelpCircle, Grid, ChevronDown, ChevronUp } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { getCorrelation } from "../../utils/sectorHelpers";
import FearGreedGauge from "./FearGreedGauge";
import PortfolioHealthMetrics from "./PortfolioHealthMetrics";
import PortfolioAdviceList from "./PortfolioAdviceList";
import PortfolioStressTest from "./PortfolioStressTest";

export default function PortfolioCorrelation({ assets = [], exchangeRate = 35.0, hideValues }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    if (!selectedCell) return;
    return registerModal(() => { setSelectedCell(null); });
  }, [selectedCell]);

  // Extract active assets for correlation analysis
  const activeAssetsForCorr = assets
    .filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat")
    .slice(0, 5)
    .map(a => a.symbol);
  
  const displaySymbols = activeAssetsForCorr.length >= 2 ? activeAssetsForCorr : ["MU", "NVDA", "SNDK"];

  // Calculate correlation pairs and average correlation
  const correlationPairs = [];
  let sumCorrelation = 0, countPairs = 0;

  for (let i = 0; i < displaySymbols.length; i++) {
    for (let j = i + 1; j < displaySymbols.length; j++) {
      const coeff = getCorrelation(displaySymbols[i], displaySymbols[j]);
      correlationPairs.push({ asset1: displaySymbols[i], asset2: displaySymbols[j], value: coeff });
      sumCorrelation += coeff;
      countPairs++;
    }
  }

  const avgCorrelation = countPairs > 0 ? parseFloat((sumCorrelation / countPairs).toFixed(2)) : 0;
  const diversificationScore = Math.max(0, Math.min(100, Math.round(75 - avgCorrelation * 35)));

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Information Header Banner */}
      <div style={{ background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <HelpCircle size={22} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>วิเคราะห์การกระจายความเสี่ยงและสุขภาพพอร์ตโฟลิโอ</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
            การประเมินความเสี่ยงพอร์ตด้วยดัชนีอารมณ์ตลาด (Fear & Greed Index), สหสัมพันธ์ (Correlation) และจำลองวิเคราะห์ผลกระทบเมื่อตลาดเกิดความตึงเครียด เพื่อช่วยให้นักลงทุนปรับสมดุลความผันผวนและป้องกันความเสี่ยงของพอร์ตได้อย่างมีประสิทธิภาพ
          </span>
        </div>
      </div>

      {/* Main Grid: Fear & Greed + Health Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }} className="dashboard-grid">
        <FearGreedGauge />
        <PortfolioHealthMetrics 
          assets={assets} 
          avgCorrelation={avgCorrelation} 
          diversificationScore={diversificationScore} 
        />
      </div>

      {/* Portfolio Stress Test & Crisis Simulator */}
      <PortfolioStressTest 
        assets={assets}
        exchangeRate={exchangeRate}
        hideValues={hideValues}
      />

      {/* Actionable Advice & Rebalancing Recommendations */}
      <PortfolioAdviceList 
        assets={assets} 
        avgCorrelation={avgCorrelation} 
        diversificationScore={diversificationScore} 
      />

      {/* Full Correlation Matrix Accordion */}
      <div 
        className="card" 
        style={{ 
          padding: "16px 20px", 
          background: "var(--bg-card)", 
          border: "1px solid var(--border)", 
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.01)"
        }}
      >
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            cursor: "pointer", 
            userSelect: "none" 
          }}
          onClick={() => setShowMatrix(!showMatrix)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Grid size={18} style={{ color: "var(--primary)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
                เครื่องมือเชิงลึก: ตารางวิเคราะห์สหสัมพันธ์ราคาสินทรัพย์ (Correlation Matrix)
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                แสดงค่าสัมประสิทธิ์ความสัมพันธ์ราคา (-1.00 ถึง +1.00) ของสินทรัพย์สูงสุด 5 รายการแรก
              </span>
            </div>
          </div>
          {showMatrix ? <ChevronUp size={18} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />}
        </div>

        {showMatrix && (
          <div className="fade-in" style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div className="table-wrapper" style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12 }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px" }}>
                <thead>
                  <tr>
                    <th style={{ background: "transparent", border: "none" }}></th>
                    {displaySymbols.map((sym, idx) => (
                      <th key={idx} style={{ padding: "6px 8px", fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textAlign: "center" }}>
                        {sym && sym.includes(".") ? sym.split(".")[0] : sym}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displaySymbols.map((rowSym, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ padding: "6px 8px", fontSize: 10, fontWeight: 800, color: "var(--text-muted)", verticalAlign: "middle" }}>
                        {rowSym && rowSym.includes(".") ? rowSym.split(".")[0] : rowSym}
                      </td>
                      {displaySymbols.map((colSym, cIdx) => {
                        const coeff = getCorrelation(rowSym, colSym);
                        const isDiagonal = rowSym === colSym;
                        return (
                          <td 
                            key={cIdx} 
                            style={{ 
                              padding: "10px 6px", 
                              textAlign: "center", 
                              borderRadius: 6, 
                              background: isDiagonal 
                                ? "rgba(99, 102, 241, 0.08)" 
                                : coeff >= 0.4 
                                  ? "rgba(239, 68, 68, 0.1)" 
                                  : coeff <= -0.2 
                                    ? "rgba(16, 185, 129, 0.1)" 
                                    : "rgba(241, 245, 249, 0.9)",
                              color: isDiagonal 
                                ? "var(--primary)" 
                                : coeff >= 0.4 
                                  ? "var(--loss)" 
                                  : coeff <= -0.2 
                                    ? "var(--gain)" 
                                    : "var(--text-muted)",
                              fontWeight: 900, 
                              fontSize: 11, 
                              cursor: "pointer",
                              border: isDiagonal ? "1px dashed var(--primary)" : "1px solid transparent", 
                              transition: "all 0.2s"
                            }}
                            className="ripple-btn" 
                            onClick={() => setSelectedCell({ row: rowSym, col: colSym, value: coeff })} 
                            title={`${rowSym} vs ${colSym}: ${coeff}`}
                          >
                            {coeff > 0 && !isDiagonal ? `+${coeff}` : coeff}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-faint)", fontWeight: 700, padding: "0 2px" }}>
              <span>🔴 +0.4 ถึง +1.0 (เสี่ยงร่วงคู่)</span><span>⚪ -0.2 ถึง +0.2 (ไม่เกี่ยวกัน)</span><span>🟢 -1.0 ถึง -0.2 (ช่วยพยุงพอร์ต)</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Cell Correlation Detail Modal */}
      {selectedCell && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCell(null); }}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>🔍 วิเคราะห์ความสัมพันธ์ระหว่างหุ้น</span>
              <button className="btn-close" onClick={() => setSelectedCell(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)", display: "block" }}>
                  {selectedCell.row && selectedCell.row.includes(".") ? selectedCell.row.split(".")[0] : selectedCell.row} vs {selectedCell.col && selectedCell.col.includes(".") ? selectedCell.col.split(".")[0] : selectedCell.col}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: selectedCell.value >= 0.4 ? "var(--loss)" : selectedCell.value <= -0.2 ? "var(--gain)" : "var(--text-muted)", display: "block", marginTop: 6 }}>
                  ค่าความสัมพันธ์: {selectedCell.value > 0 && selectedCell.row !== selectedCell.col ? `+${selectedCell.value}` : selectedCell.value}
                </span>
              </div>
              <div style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>บทวิเคราะห์เชิงลึก:</strong>
                  {selectedCell.row === selectedCell.col ? (
                    <div style={{ marginTop: 4 }}>• สินทรัพย์เดียวกันมีค่าความสัมพันธ์เป็น 1.0 (สมบูรณ์แบบ) เคลื่อนที่ล้อตามตัวเองเสมอ</div>
                  ) : selectedCell.value >= 0.5 ? (
                    <div style={{ marginTop: 4 }}>• หุ้นทั้งสองมีสหสัมพันธ์สูงมาก มักจะอยู่ในห่วงโซ่อุปทานหรืออุตสาหกรรมเดียวกัน การถือครองร่วมกันทำให้ราคาขยับขึ้นคู่เมื่อตลาดเป็นขาขึ้น แต่ก็เพิ่มความเปราะบางอย่างมากในการปรับฐานกลุ่ม</div>
                  ) : selectedCell.value >= 0.2 ? (
                    <div style={{ marginTop: 4 }}>• ความสัมพันธ์ปานกลาง หุ้นขยับในทิศทางคล้ายคลึงกัน แต่อาจมีโครงสร้างตลาดเฉพาะตัวที่แยกจากกันบางส่วน มีความเสี่ยงเชื่อมโยงกันเล็กน้อย</div>
                  ) : (
                    <div style={{ marginTop: 4 }}>• ความสัมพันธ์ต่ำมากหรือมีค่าติดลบ หุ้นสองตัวนี้ขยับแยกจากกัน หรือบางกรณีขยับสวนทางกัน ถือเป็นการกระจายความเสี่ยงเพื่อลดความเสี่ยงรวมของพอร์ตที่มีประสิทธิภาพสูง</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>คำแนะนำสำหรับนักลงทุน:</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {selectedCell.row === selectedCell.col ? "ไม่มีข้อแนะนำเพิ่มเติมสำหรับความสัมพันธ์กับตัวเอง" : selectedCell.value >= 0.4 ? "⚠️ แนะนำให้พิจารณาการ Hedge หรือลดน้ำหนักการซื้อเฉลี่ยพร้อมกันในหุ้นทั้งสองตัวนี้ เพื่อไม่ให้พอร์ตของคุณเผชิญแรงกระแทกสองเท่าเมื่อกลุ่มอุตสาหกรรมนี้ปรับฐาน" : "✓ ความเสี่ยงและประโยชน์ของคู่นี้มีความสมดุล เหมาะสมสำหรับการถือครองระยะยาวเพื่อช่วยพยุงลดแรงแกว่งของผลตอบแทนพอร์ต"}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
