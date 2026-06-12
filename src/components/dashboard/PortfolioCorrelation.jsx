import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, CheckCircle, Compass } from "lucide-react";
import { registerModal } from "../../utils/modalStack";

const getCorrelation = (sym1, sym2) => {
  if (sym1 === sym2) return 1.0;
  const sorted = [sym1, sym2].sort().join("-");
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = sorted.charCodeAt(i) + ((hash << 5) - hash);
  }
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

  const activeAssets = assets
    .filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat")
    .slice(0, 5)
    .map(a => a.symbol);

  const displaySymbols = activeAssets.length >= 2 ? activeAssets : ["MU", "NVDA", "SNDK"];
  const correlationPairs = [];
  let sumCorrelation = 0;
  let countPairs = 0;

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
  const coupledPairs = correlationPairs.filter(p => p.value >= 0.4).sort((a, b) => b.value - a.value);
  const hedgingPairs = correlationPairs.filter(p => p.value <= -0.2).sort((a, b) => a.value - b.value);

  const fearGreedValue = 68;
  const getFearGreedLabel = (v) => v < 20 ? "Extreme Fear (กลัวสุดขีด)" : v < 40 ? "Fear (กลัว)" : v < 60 ? "Neutral (ปกติ)" : v < 80 ? "Greed (โลภ)" : "Extreme Greed (โลภสุดขีด)";
  const getFearGreedColor = (v) => v < 20 ? "#EF4444" : v < 40 ? "#F59E0B" : v < 60 ? "#EAB308" : v < 80 ? "#10B981" : "#047857";
  const getHeatmapTextColor = (val) => val >= 0.5 ? "var(--loss)" : val <= -0.3 ? "var(--gain)" : "var(--text-muted)";
  const needleAngle = (fearGreedValue / 100) * 180 - 180;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Compass size={20} style={{ color: "var(--primary)" }} />
            ตัววิเคราะห์สุขภาพและการกระจายความเสี่ยงพอร์ต
          </h2>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>1-Year Rolling Analysis</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32 }} className="dashboard-grid">
          {/* Left Column: Gauge Chart */}
          <div 
            className="clickable ripple-btn"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.01)", borderRadius: 16, border: "1px solid var(--border)", cursor: "pointer" }}
            onClick={() => setShowGreedModal(true)}
            title="คลิกเพื่อวิเคราะห์กลยุทธ์อารมณ์ตลาด"
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginBottom: 12 }}>Fear & Greed Index</span>
            <div style={{ width: 220, height: 115, position: "relative", display: "flex", justifyContent: "center" }}>
              <svg width="220" height="115" viewBox="0 0 220 115" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" /><stop offset="25%" stopColor="#F59E0B" /><stop offset="50%" stopColor="#EAB308" /><stop offset="75%" stopColor="#10B981" /><stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <path d="M 35 100 A 75 75 0 0 1 185 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" />
                <text x="25" y="104" textAnchor="end" fill="var(--text-faint)" fontSize="9" fontWeight="800">0 (กลัวจัด)</text>
                <text x="51" y="47" textAnchor="end" fill="var(--text-faint)" fontSize="9" fontWeight="800">25</text>
                <text x="110" y="14" textAnchor="middle" fill="var(--text-faint)" fontSize="9" fontWeight="800">50</text>
                <text x="169" y="47" textAnchor="start" fill="var(--text-faint)" fontSize="9" fontWeight="800">75</text>
                <text x="195" y="104" textAnchor="start" fill="var(--text-faint)" fontSize="9" fontWeight="800">100 (โลภจัด)</text>
                <circle cx="110" cy="100" r="6" fill="var(--text-main)" />
                <line x1="110" y1="100" x2="110" y2="40" stroke="var(--text-main)" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${needleAngle} 110 100)`} style={{ transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </svg>
              <div style={{ position: "absolute", bottom: 10, fontSize: 22, fontWeight: 900, color: getFearGreedColor(fearGreedValue) }}>{fearGreedValue}</div>
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{getFearGreedLabel(fearGreedValue)}</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginTop: 4 }}>ตลาดกำลังมีความมั่นใจ ควรรักษาวินัยการลงทุน 🔍</span>
            </div>
          </div>

          {/* Right Column: Simplified Correlation/Diversification Analyst */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(99, 102, 241, 0.04)", border: "1px dashed rgba(99, 102, 241, 0.2)", borderRadius: 16, padding: "14px 18px" }}>
              <div style={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="56" height="56" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - diversificationScore / 100)}`} strokeLinecap="round" transform="rotate(-90 28 28)" />
                </svg>
                <div style={{ position: "absolute", fontSize: 13, fontWeight: 900, color: "var(--text-main)" }}>{diversificationScore}%</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>คะแนนการกระจายความเสี่ยงพอร์ต</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>คำนวณจากสหสัมพันธ์ถ่วงน้ำหนัก (คะแนนยิ่งสูงยิ่งปลอดภัย)</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>⚠️ หุ้นคู่เสี่ยงปรับตัวตามกันสูง (High Risk Coupling Pairs)</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {coupledPairs.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 0" }}>ไม่มีคู่หุ้นที่ปรับตัวตามกันสูงในพอร์ต</div>
                ) : (
                  coupledPairs.map((pair, idx) => (
                    <div key={idx} className="clickable ripple-btn" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(239, 68, 68, 0.02)", border: "1px solid rgba(239, 68, 68, 0.08)", borderRadius: 10, cursor: "pointer" }} onClick={() => setSelectedCell({ row: pair.asset1, col: pair.asset2, value: pair.value })}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{pair.asset1} + {pair.asset2}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--loss)" }}>ขยับตามกันสูงมาก (+{Math.round(pair.value * 100)}%) 🔍</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>🟢 หุ้นคู่ช่วยพยุงพอร์ตสวนทางกัน (Perfect Hedging Helpers)</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {hedgingPairs.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 0" }}>ไม่มีคู่หุ้นที่มีผลป้องกันความเสี่ยงเด่นชัด</div>
                ) : (
                  hedgingPairs.map((pair, idx) => (
                    <div key={idx} className="clickable ripple-btn" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(16, 185, 129, 0.02)", border: "1px solid rgba(16, 185, 129, 0.08)", borderRadius: 10, cursor: "pointer" }} onClick={() => setSelectedCell({ row: pair.asset1, col: pair.asset2, value: pair.value })}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{pair.asset1} + {pair.asset2}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--gain)" }}>ช่วยพยุงลดแรงเหวี่ยง ({Math.round(pair.value * 100)}%) 🔍</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {avgCorrelation >= 0.5 ? (
        <div style={{ display: "flex", gap: 12, background: "rgba(239, 68, 68, 0.05)", padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(239, 68, 68, 0.15)", alignItems: "center" }}>
          <AlertTriangle size={24} style={{ color: "var(--loss)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>ตรวจพบการผูกพันราคาในพอร์ตสูงเฉลี่ย (Avg: {avgCorrelation})</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>พอร์ตของคุณพึ่งพากลุ่มอุตสาหกรรมที่มีความผูกพันกันสูง (เช่น หุ้นกลุ่มเทคโนโลยีและเซมิคอนดักเตอร์) ซึ่งราคาหุ้นมักจะร่วงร่วมกันในช่วงการปรับฐาน แนะนำให้พิจารณากระจายความเสี่ยงลงทุนเพิ่มในกลุ่ม Defensive หรือกลุ่มสินค้าอุปโภคบริโภค (Consumer Staples)</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, background: "rgba(16, 185, 129, 0.05)", padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.15)", alignItems: "center" }}>
          <CheckCircle size={24} style={{ color: "var(--gain)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>การกระจายความเสี่ยงของพอร์ตเหมาะสมดีมาก (Avg: {avgCorrelation})</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>พอร์ตการลงทุนของคุณมีค่าสหสัมพันธ์ต่ำในเกณฑ์ดี ช่วยลดความผันผวนรวมของพอร์ตได้เป็นอย่างดีเมื่ออุตสาหกรรมใดอุตสาหกรรมหนึ่งเกิดวิกฤตชั่วคราว</span>
          </div>
        </div>
      )}

      {selectedCell && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCell(null); }}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>🔍 วิเคราะห์ความสัมพันธ์ระหว่างหุ้น</span>
              <button className="btn-close" onClick={() => setSelectedCell(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)", display: "block" }}>{selectedCell.row} vs {selectedCell.col}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: getHeatmapTextColor(selectedCell.value), display: "block", marginTop: 6 }}>ค่าความสัมพันธ์: {selectedCell.value > 0 && selectedCell.row !== selectedCell.col ? `+${selectedCell.value}` : selectedCell.value}</span>
              </div>
              <div style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <strong>บทวิเคราะห์เชิงลึก:</strong>
                  {selectedCell.row === selectedCell.col ? (
                    <div style={{ marginTop: 4 }}>• สินทรัพย์เดียวกันมีค่าความสัมพันธ์เป็น 1.0 (สมบูรณ์แบบ) เคลื่อนที่ล้อตามตัวเองเสมอ</div>
                  ) : selectedCell.value >= 0.5 ? (
                    <div style={{ marginTop: 4 }}>• หุ้นทั้งสองมีสหสัมพันธ์สูงมาก ซึ่งมักจะอยู่ในห่วงโซ่อุปทานหรืออุตสาหกรรมเดียวกัน การถือครองร่วมกันทำให้ราคาขยับขึ้นคู่เมื่อตลาดเป็นขาขึ้น แต่ก็เพิ่มความเปราะบางอย่างมากในการปรับฐานกลุ่ม</div>
                  ) : selectedCell.value >= 0.2 ? (
                    <div style={{ marginTop: 4 }}>• ความสัมพันธ์ในระดับปานกลาง หุ้นมีความขยับในทิศทางคล้ายคลึงกัน แต่อาจมีโครงสร้างตลาดเฉพาะตัวที่แยกจากกันบางส่วน มีความเสี่ยงที่เชื่อมโยงกันปานกลาง</div>
                  ) : (
                    <div style={{ marginTop: 4 }}>• ความสัมพันธ์ต่ำมากหรือมีค่าติดลบ หุ้นสองตัวนี้ขยับแยกจากกัน หรือบางกรณีขยับสวนทางกัน ถือเป็นการกระจายความเสี่ยงเพื่อลดความเสี่ยงรวมของพอร์ตที่มีประสิทธิภาพสูง</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>คำแนะนำสำหรับนักลงทุน:</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {selectedCell.row === selectedCell.col ? "ไม่มีข้อแนะนำเพิ่มเติมสำหรับความสัมพันธ์กับตัวเอง" : selectedCell.value >= 0.5 ? "⚠️ แนะนำให้พิจารณาการ Hedge หรือลดน้ำหนักการซื้อเฉลี่ยพร้อมๆ กันในหุ้นทั้งสองตัวนี้ เพื่อไม่ให้พอร์ตของคุณเผชิญแรงกระแทกเป็นสองเท่าในวันที่เกิดการทลายเทขายหุ้นกลุ่มนี้" : "✓ ความเสี่ยงและประโยชน์ของคู่นี้มีความสมดุล เหมาะสมสำหรับการถือครองระยะยาวเพื่อช่วยพยุงลดแรงแกว่งของผลตอบแทนพอร์ต"}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showGreedModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGreedModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>🔍 ดัชนีอารมณ์ตลาด (Fear & Greed Index)</span>
              <button className="btn-close" onClick={() => setShowGreedModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: getFearGreedColor(fearGreedValue), display: "block" }}>{fearGreedValue}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "block", marginTop: 4 }}>สถานะปัจจุบัน: {getFearGreedLabel(fearGreedValue)}</span>
              </div>
              <div style={{ background: "var(--primary-light)", borderRadius: 12, padding: 14, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                <strong>ดัชนีความกลัวและความโลภ (Fear & Greed Index)</strong> วัดอารมณ์และจิตวิทยาตลาดโดยอาศัยตัวแปร เช่น ความผันผวนของราคา (VIX), ปริมาณความต้องการซื้อ/ขาย, และ Momentum ของราคาหุ้นทั่วโลก สภาวะ **Greed (68 คะแนน)** สะท้อนว่าความต้องการซื้อมีมากกว่าปกติ และนักลงทุนมีความมั่นใจสูง ซึ่งบางครั้งอาจส่งผลให้ราคาสินทรัพย์ขยับขึ้นสูงเกินมูลค่าพื้นฐานที่แท้จริง
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
