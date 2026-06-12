import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Info, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { registerModal } from "../../utils/modalStack";

// Deterministic mock correlation coefficients based on string hashing
const getCorrelation = (sym1, sym2) => {
  if (sym1 === sym2) return 1.0;
  const sorted = [sym1, sym2].sort().join("-");
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = sorted.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Yield values ranging between -1.00 and 1.00
  const val = ((Math.abs(hash) % 201) - 100) / 100;
  return parseFloat(val.toFixed(2));
};

export default function PortfolioCorrelation({ assets = [], hideValues }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showGreedModal, setShowGreedModal] = useState(false);

  useEffect(() => {
    if (!selectedCell && !showGreedModal) return;
    return registerModal(() => {
      setSelectedCell(null);
      setShowGreedModal(false);
    });
  }, [selectedCell, showGreedModal]);

  // Extract active assets for correlation matrix (limit to top 5 assets by value/quantity for readability)
  const activeAssets = assets
    .filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat")
    .slice(0, 5)
    .map(a => a.symbol);

  // Fallback to default symbols if fewer than 2 assets exist
  const displaySymbols = activeAssets.length >= 2 ? activeAssets : ["MU", "NVDA", "SNDK"];

  // Calculate Average Correlation (excluding diagonal 1.0s)
  let sumCorrelation = 0;
  let countPairs = 0;
  for (let i = 0; i < displaySymbols.length; i++) {
    for (let j = i + 1; j < displaySymbols.length; j++) {
      sumCorrelation += getCorrelation(displaySymbols[i], displaySymbols[j]);
      countPairs++;
    }
  }
  const avgCorrelation = countPairs > 0 ? parseFloat((sumCorrelation / countPairs).toFixed(2)) : 0;

  // Fear & Greed configuration
  const fearGreedValue = 68; // Mocked dynamic value (Greed)
  const getFearGreedLabel = (val) => {
    if (val < 20) return "Extreme Fear (กลัวสุดขีด)";
    if (val < 40) return "Fear (กลัว)";
    if (val < 60) return "Neutral (ปกติ)";
    if (val < 80) return "Greed (โลภ)";
    return "Extreme Greed (โลภสุดขีด)";
  };

  const getFearGreedColor = (val) => {
    if (val < 20) return "#EF4444"; // Red
    if (val < 40) return "#F59E0B"; // Amber
    if (val < 60) return "#EAB308"; // Gold
    if (val < 80) return "#10B981"; // Mint/Green
    return "#047857"; // Emerald
  };

  // Heatmap Tri-color Gradient Scale (Amber/Coral, Cream/Grey, Cool Mint)
  const getHeatmapColor = (val) => {
    if (val === 1.0) return "rgba(99, 102, 241, 0.15)"; // Highlight diagonals with soft primary tint
    if (val >= 0.5) {
      // Coupling สูง: Amber / Coral
      return val >= 0.75 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)";
    }
    if (val <= -0.3) {
      // วิ่งสวนทางกัน: Cool Mint
      return "rgba(16, 185, 129, 0.15)";
    }
    // ไม่เกี่ยวข้องกัน: Neutral Cream / Grey
    return "rgba(241, 245, 249, 0.95)";
  };

  const getHeatmapTextColor = (val) => {
    if (val === 1.0) return "var(--primary)";
    if (val >= 0.5) {
      return val >= 0.75 ? "var(--loss)" : "var(--gold)";
    }
    if (val <= -0.3) {
      return "var(--gain)";
    }
    return "var(--text-muted)";
  };

  // Needle angle for Gauge: 0 is left (-90 deg), 100 is right (+90 deg)
  const needleAngle = (fearGreedValue / 100) * 180 - 180;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div 
        className="card" 
        style={{ 
          padding: 24, 
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            📊 สหสัมพันธ์ราคา & ดัชนีอารมณ์ตลาด
          </h2>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>1-Year Rolling Analysis</span>
        </div>

        {/* 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32 }} className="dashboard-grid">
          
          {/* Left Column: Gauge Chart */}
          <div 
            className="clickable ripple-btn"
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center",
              padding: 20,
              background: "rgba(0,0,0,0.01)",
              borderRadius: 16,
              border: "1px solid var(--border)",
              cursor: "pointer"
            }}
            onClick={() => setShowGreedModal(true)}
            title="คลิกเพื่อวิเคราะห์กลยุทธ์อารมณ์ตลาด"
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginBottom: 8 }}>
              Fear & Greed Index
            </span>

            {/* Semicircular SVG Gauge */}
            <div style={{ width: 180, height: 100, position: "relative", display: "flex", justifyContent: "center" }}>
              <svg width="180" height="100" viewBox="0 0 180 100" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="25%" stopColor="#F59E0B" />
                    <stop offset="50%" stopColor="#EAB308" />
                    <stop offset="75%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                {/* Arc */}
                <path 
                  d="M 20 90 A 70 70 0 0 1 160 90" 
                  fill="none" 
                  stroke="url(#gaugeGrad)" 
                  strokeWidth="12" 
                  strokeLinecap="round"
                />
                {/* Center cap */}
                <circle cx="90" cy="90" r="6" fill="var(--text-main)" />
                {/* Needle */}
                <line 
                  x1="90" y1="90" 
                  x2="90" y2="35" 
                  stroke="var(--text-main)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                  transform={`rotate(${needleAngle} 90 90)`}
                  style={{ transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
              </svg>
              {/* Floating score indicator */}
              <div 
                style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  fontSize: 22, 
                  fontWeight: 900, 
                  color: getFearGreedColor(fearGreedValue) 
                }}
              >
                {fearGreedValue}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
                {getFearGreedLabel(fearGreedValue)}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                ตลาดกำลังมีความมั่นใจ ควรรักษาวินัยการลงทุน 🔍
              </span>
            </div>
          </div>

          {/* Right Column: Heatmap Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
              ตารางความสัมพันธ์สหสัมพันธ์ (Correlation Matrix)
            </span>

            {/* Matrix Table */}
            <div className="table-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px" }}>
                <thead>
                  <tr>
                    <th style={{ background: "transparent", border: "none" }}></th>
                    {displaySymbols.map((sym, idx) => (
                      <th key={idx} style={{ padding: "6px 8px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textAlign: "center" }}>
                        {sym}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displaySymbols.map((rowSym, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ padding: "6px 8px", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", verticalAlign: "middle" }}>
                        {rowSym}
                      </td>
                      {displaySymbols.map((colSym, cIdx) => {
                        const coeff = getCorrelation(rowSym, colSym);
                        const isDiagonal = rowSym === colSym;
                        return (
                          <td 
                            key={cIdx} 
                            style={{ 
                              padding: "14px 10px", 
                              textAlign: "center", 
                              borderRadius: 8, 
                              background: getHeatmapColor(coeff),
                              color: getHeatmapTextColor(coeff),
                              fontWeight: 900,
                              fontSize: 13,
                              cursor: "pointer",
                              border: isDiagonal ? "1.5px dashed var(--primary)" : "1px solid transparent",
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

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-faint)", fontWeight: 700, padding: "0 4px", gap: 8 }}>
              <span>🔴 +0.5 ถึง +1.0 (Coupling สูง)</span>
              <span>⚪ -0.2 ถึง +0.2 (ไม่เกี่ยวข้องกัน)</span>
              <span>🟢 -1.0 ถึง -0.3 (Perfect Hedging)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Warning alert if average correlation is high (>0.7) */}
      {avgCorrelation >= 0.7 ? (
        <div style={{ display: "flex", gap: 12, background: "rgba(239, 68, 68, 0.05)", padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(239, 68, 68, 0.15)", alignItems: "center" }}>
          <AlertTriangle size={24} style={{ color: "var(--loss)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>ตรวจพบสหสัมพันธ์ของพอร์ตสูงผิดปกติ (Avg: {avgCorrelation})</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
              พอร์ตของคุณพึ่งพากลุ่มอุตสาหกรรมที่มีความผูกพันกันสูง (เช่น หุ้นกลุ่มเทคโนโลยีและเซมิคอนดักเตอร์) ซึ่งราคาหุ้นมักจะร่วงร่วมกันในช่วงการปรับฐาน แนะนำให้พิจารณากระจายความเสี่ยงลงทุนเพิ่มในกลุ่ม Defensive, สาธารณูปโภค (Utilities) หรือกลุ่มสินค้าอุปโภคบริโภค (Consumer Staples)
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, background: "rgba(16, 185, 129, 0.05)", padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.15)", alignItems: "center" }}>
          <CheckCircle size={24} style={{ color: "var(--gain)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>สหสัมพันธ์พอร์ตโดยรวมมีความเหมาะสม (Avg: {avgCorrelation})</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
              พอร์ตการลงทุนของคุณมีการประสานกำลังการเคลื่อนที่ของราคาต่ำในเกณฑ์ดี ช่วยลดความเสี่ยงเชิงโครงสร้างภาพรวมของพอร์ตได้เป็นอย่างดีในกรณีที่อุตสาหกรรมใดอุตสาหกรรมหนึ่งเกิดปัญหาวิกฤตชั่วคราว
            </span>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Cell Click Modal */}
      {selectedCell && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCell(null); }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                🔍 วิเคราะห์ความสัมพันธ์ระหว่างหุ้น
              </span>
              <button className="btn-close" onClick={() => setSelectedCell(null)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)", display: "block" }}>
                  {selectedCell.row} vs {selectedCell.col}
                </span>
                <span 
                  style={{ 
                    fontSize: 18, 
                    fontWeight: 800, 
                    color: getHeatmapTextColor(selectedCell.value), 
                    display: "block",
                    marginTop: 6
                  }}
                >
                  ค่าความสัมพันธ์: {selectedCell.value > 0 && selectedCell.row !== selectedCell.col ? `+${selectedCell.value}` : selectedCell.value}
                </span>
              </div>

              <div style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>บทวิเคราะห์เชิงลึก:</strong>
                  {selectedCell.row === selectedCell.col ? (
                    <div style={{ marginTop: 4 }}>• สินทรัพย์เดียวกันมีค่าความสัมพันธ์เป็น 1.0 (สมบูรณ์แบบ) เคลื่อนที่ล้อตามตัวเองเสมอ</div>
                  ) : selectedCell.value >= 0.7 ? (
                    <div style={{ marginTop: 4 }}>• หุ้นทั้งสองมีสหสัมพันธ์สูงมาก ซึ่งมักจะอยู่ในห่วงโซ่อุปทานหรืออุตสาหกรรมเดียวกัน (เช่น เซมิคอนดักเตอร์) การถือครองร่วมกันทำให้ราคาขยับขึ้นคู่เมื่อตลาดเป็นขาขึ้น แต่ก็เพิ่มความเปราะบางอย่างมากในการปรับฐานกลุ่ม</div>
                  ) : selectedCell.value >= 0.4 ? (
                    <div style={{ marginTop: 4 }}>• ความสัมพันธ์ในระดับปานกลาง หุ้นมีความขยับในทิศทางคล้ายคลึงกัน แต่อาจมีโครงสร้างตลาดเฉพาะตัวที่แยกจากกันบางส่วน มีความเสี่ยงที่เชื่อมโยงกันปานกลาง</div>
                  ) : (
                    <div style={{ marginTop: 4 }}>• ความสัมพันธ์ต่ำมากหรือมีค่าติดลบ หุ้นสองตัวนี้ขยับแยกจากกัน หรือบางกรณีขยับสวนทางกัน (เช่น หุ้นเติบโตกับหุ้นปลอดภัย) ถือเป็นการกระจายความเสี่ยงเพื่อลดความเสี่ยงรวมของพอร์ตที่มีประสิทธิภาพสูง</div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>คำแนะนำสำหรับนักลงทุน:</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {selectedCell.row === selectedCell.col 
                    ? "ไม่มีข้อแนะนำเพิ่มเติมสำหรับความสัมพันธ์กับตัวเอง"
                    : selectedCell.value >= 0.7 
                    ? "⚠️ แนะนำให้พิจารณาการ Hedge หรือลดน้ำหนักการซื้อเฉลี่ยพร้อมๆ กันในหุ้นทั้งสองตัวนี้ เพื่อไม่ให้พอร์ตของคุณเผชิญแรงกระแทกเป็นสองเท่าในวันที่เกิดการทลายเทขายหุ้นกลุ่มนี้"
                    : "✓ ความเสี่ยงและประโยชน์ของคู่นี้มีความสมดุล เหมาะสมสำหรับการถือครองระยะยาวเพื่อช่วยพยุงลดแรงแกว่งของผลตอบแทนพอร์ต"}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fear & Greed Details Modal */}
      {showGreedModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGreedModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                🔍 ดัชนีอารมณ์ตลาด (Fear & Greed Index)
              </span>
              <button className="btn-close" onClick={() => setShowGreedModal(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: getFearGreedColor(fearGreedValue), display: "block" }}>
                  {fearGreedValue}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "block", marginTop: 4 }}>
                  สถานะปัจจุบัน: {getFearGreedLabel(fearGreedValue)}
                </span>
              </div>

              <div style={{ background: "var(--primary-light)", borderRadius: 12, padding: 14, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                <strong>ดัชนีความกลัวและความโลภ (Fear & Greed Index)</strong> วัดอารมณ์และจิตวิทยาตลาดโดยอาศัยตัวแปร เช่น ความผันผวนของราคา (VIX), ปริมาณความต้องการซื้อ/ขาย, และ Momentum ของราคาหุ้นทั่วโลก 
                <br />
                สภาวะ **Greed (68 คะแนน)** สะท้อนว่าความต้องการซื้อมีมากกว่าปกติ และนักลงทุนมีความมั่นใจสูง ซึ่งบางครั้งอาจส่งผลให้ราคาสินทรัพย์ขยับขึ้นสูงเกินมูลค่าพื้นฐานที่แท้จริง
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>แนวทางการปฏิบัติทางการเงินเวลานี้:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  <div>• ⚖️ <strong>รักษาวินัยการลงทุน:</strong> หลีกเลี่ยงการรีบซื้อไล่ตามราคาของหุ้นที่วิ่งขึ้นมาสูงมากเกินไป (FOMO)</div>
                  <div>• 📈 <strong>แบ่งทำกำไร (Take Profit):</strong> อาจพิจารณาขายทำกำไรบางส่วนในหุ้นที่มีมูลค่าแพงเพื่อสะสมเงินสด</div>
                  <div>• 🔍 <strong>สะสมเงินสด:</strong> เตรียมพร้อมโอกาสซื้อเมื่อตลาดเกิดความกลัวและย่อตัวในอนาคต</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
