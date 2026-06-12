import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, CheckCircle, Compass, Grid, BarChart3, HelpCircle } from "lucide-react";
import { registerModal } from "../../utils/modalStack";
import { getSector, getSectorColor, getCorrelation } from "../../utils/sectorHelpers";

export default function PortfolioCorrelation({ assets = [], hideValues }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [showGreedModal, setShowGreedModal] = useState(false);
  const [activeTab, setActiveTab] = useState("sectors"); // "sectors" | "correlation"
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    if (!selectedCell && !showGreedModal) return;
    return registerModal(() => { setSelectedCell(null); setShowGreedModal(false); });
  }, [selectedCell, showGreedModal]);

  const activeAssetsForCorr = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat").slice(0, 5).map(a => a.symbol);
  const displaySymbols = activeAssetsForCorr.length >= 2 ? activeAssetsForCorr : ["MU", "NVDA", "SNDK"];

  const allHoldings = assets.filter(a => a.qty > 0 && a.category !== "fiat" && a.type !== "fiat");
  const totalHoldingsValue = allHoldings.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  const sectorMap = {};
  allHoldings.forEach(a => { const sec = getSector(a.symbol); sectorMap[sec] = (sectorMap[sec] || 0) + (a.valueUSD || 0); });

  const sectorBreakdown = Object.keys(sectorMap).map(name => ({ name, amount: sectorMap[name], pct: totalHoldingsValue > 0 ? (sectorMap[name] / totalHoldingsValue) * 100 : 0 })).sort((a, b) => b.pct - a.pct);

  const correlationPairs = [];
  let sumCorrelation = 0, countPairs = 0;

  for (let i = 0; i < displaySymbols.length; i++) {
    for (let j = i + 1; j < displaySymbols.length; j++) {
      const coeff = getCorrelation(displaySymbols[i], displaySymbols[j]);
      correlationPairs.push({ asset1: displaySymbols[i], asset2: displaySymbols[j], value: coeff });
      sumCorrelation += coeff; countPairs++;
    }
  }

  const avgCorrelation = countPairs > 0 ? parseFloat((sumCorrelation / countPairs).toFixed(2)) : 0;
  const diversificationScore = Math.max(0, Math.min(100, Math.round(75 - avgCorrelation * 35)));
  const coupledPairs = correlationPairs.filter(p => p.value >= 0.4).sort((a, b) => b.value - a.value);
  const hedgingPairs = correlationPairs.filter(p => p.value <= -0.2).sort((a, b) => a.value - b.value);

  const fearGreedValue = 68;
  const getFearGreedLabel = (v) => v < 20 ? "Extreme Fear (กลัวจัด)" : v < 40 ? "Fear (กลัว)" : v < 60 ? "Neutral (ปกติ)" : v < 80 ? "Greed (โลภ)" : "Extreme Greed (โลภจัด)";
  const getFearGreedColor = (v) => v < 20 ? "#EF4444" : v < 40 ? "#F59E0B" : v < 60 ? "#EAB308" : v < 80 ? "#10B981" : "#047857";
  const needleAngle = (fearGreedValue / 100) * 180 - 180;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Information Header Banner */}
      <div style={{ background: "rgba(99, 102, 241, 0.04)", border: "1px solid rgba(99, 102, 241, 0.12)", borderRadius: 16, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <HelpCircle size={22} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>วิเคราะห์การจัดสรรสินทรัพย์อย่างเข้าใจง่าย</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
            การจัดพอร์ตที่มีประสิทธิภาพวัดจาก <strong>อุตสาหกรรม (Sectors)</strong> ที่กระจายตัวเหมาะสม ไม่กระจุกในกลุ่มใดกลุ่มหนึ่งเกิน 40% และ <strong>สหสัมพันธ์ (Correlation)</strong> หรือการเคลื่อนที่ของราคาหุ้น (ค่าบวกสูง = เคลื่อนที่ไปพร้อมกัน เสี่ยงกระจุกตัว | ค่าติดลบ = เคลื่อนที่สวนทางกัน ช่วยลดความเสี่ยงพอร์ต)
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Compass size={20} style={{ color: "var(--primary)" }} /> ตัววิเคราะห์สุขภาพและการกระจายความเสี่ยงพอร์ต
          </h2>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>1-Year Rolling Analysis</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32 }} className="dashboard-grid">
          {/* Left Column: Fear & Greed Gauge */}
          <div className="clickable ripple-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.01)", borderRadius: 16, border: "1px solid var(--border)", cursor: "pointer" }} onClick={() => setShowGreedModal(true)} title="คลิกเพื่อวิเคราะห์กลยุทธ์อารมณ์ตลาด">
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", marginBottom: 12 }}>Fear & Greed Index</span>
            <div style={{ width: 220, height: 115, position: "relative", display: "flex", justifyContent: "center" }}>
              <svg width="220" height="115" viewBox="0 0 220 115" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" /><stop offset="25%" stopColor="#F59E0B" /><stop offset="50%" stopColor="#EAB308" /><stop offset="75%" stopColor="#10B981" /><stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <path d="M 35 100 A 75 75 0 0 1 185 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" />
                <circle cx="110" cy="100" r="6" fill="var(--text-main)" />
                <line x1="110" y1="100" x2="110" y2="40" stroke="var(--text-main)" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${needleAngle} 110 100)`} style={{ transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              </svg>
              <div style={{ position: "absolute", bottom: 10, fontSize: 22, fontWeight: 900, color: getFearGreedColor(fearGreedValue) }}>{fearGreedValue}</div>
            </div>
            
            {/* Segmented Gradient Pill Legend */}
            <div style={{ width: "100%", marginTop: 8 }}>
              <div style={{ display: "flex", width: "100%", gap: 3, height: 5, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ flex: 1, background: "#EF4444" }} title="0-20 Extreme Fear" /><div style={{ flex: 1, background: "#F59E0B" }} title="21-40 Fear" /><div style={{ flex: 1, background: "#EAB308" }} title="41-60 Neutral" /><div style={{ flex: 1, background: "#10B981" }} title="61-80 Greed" /><div style={{ flex: 1, background: "#047857" }} title="81-100 Extreme Greed" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 5, fontSize: 9, color: "var(--text-muted)", fontWeight: 800 }}>
                <span>0 (กลัวจัด)</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100 (โลภจัด)</span>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{getFearGreedLabel(fearGreedValue)}</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", display: "block", marginTop: 4 }}>ตลาดกำลังมีความมั่นใจ ควรรักษาวินัยการลงทุน 🔍</span>
            </div>
          </div>

          {/* Right Column: Dynamic Analysts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tab switchers */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <button onClick={() => setActiveTab("sectors")} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 800, background: activeTab === "sectors" ? "rgba(99, 102, 241, 0.08)" : "transparent", color: activeTab === "sectors" ? "var(--primary)" : "var(--text-muted)", border: `1px solid ${activeTab === "sectors" ? "var(--primary)" : "transparent"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
                <BarChart3 size={14} /> สัดส่วนอุตสาหกรรม
              </button>
              <button onClick={() => setActiveTab("correlation")} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 800, background: activeTab === "correlation" ? "rgba(99, 102, 241, 0.08)" : "transparent", color: activeTab === "correlation" ? "var(--primary)" : "var(--text-muted)", border: `1px solid ${activeTab === "correlation" ? "var(--primary)" : "transparent"}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
                <Grid size={14} /> ตัววิเคราะห์สหสัมพันธ์
              </button>
            </div>

            {/* TAB 1: Sector Diversification */}
            {activeTab === "sectors" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-in">
                <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(99, 102, 241, 0.03)", border: "1px dashed rgba(99, 102, 241, 0.15)", borderRadius: 12, padding: "10px 14px" }}>
                  <div style={{ position: "relative", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="48" height="48" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 24}`} strokeDashoffset={`${2 * Math.PI * 24 * (1 - diversificationScore / 100)}`} strokeLinecap="round" transform="rotate(-90 28 28)" />
                    </svg>
                    <div style={{ position: "absolute", fontSize: 11, fontWeight: 900, color: "var(--text-main)" }}>{diversificationScore}%</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>คะแนนสุขภาพการกระจายความเสี่ยง</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>ประเมินจากความหลากหลายของอุตสาหกรรมและสหสัมพันธ์</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>สัดส่วนกลุ่มอุตสาหกรรมในพอร์ต (Sectors)</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                    {sectorBreakdown.length === 0 ? (
                      <div style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", padding: "10px 0" }}>ไม่มีข้อมูลสินทรัพย์ที่ระบุอุตสาหกรรมได้</div>
                    ) : (
                      sectorBreakdown.map((sec, idx) => {
                        const secColor = getSectorColor(sec.name), isConcentrated = sec.pct > 40;
                        return (
                          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                              <span style={{ fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: secColor }} /> {sec.name}
                              </span>
                              <span style={{ fontWeight: 800, color: isConcentrated ? "var(--loss)" : "var(--text-muted)" }}>
                                {sec.pct.toFixed(1)}% {isConcentrated ? "⚠️ กระจุกตัวสูง" : sec.pct > 20 ? "🟡 ปานกลาง" : "🟢 สมดุลดี"}
                              </span>
                            </div>
                            <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.03)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${sec.pct}%`, height: "100%", background: secColor, borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Asset Correlation Analyst */}
            {activeTab === "correlation" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>รายงานความสัมพันธ์ราคาคู่หุ้น</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}>
                    <input type="checkbox" checked={showMatrix} onChange={() => setShowMatrix(!showMatrix)} style={{ cursor: "pointer" }} /> แสดงตารางเมทริกซ์เต็ม
                  </label>
                </div>

                {!showMatrix ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)" }}>⚠️ หุ้นคู่เสี่ยงปรับตัวตามกันสูง (High Risk Coupling)</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {coupledPairs.length === 0 ? (
                          <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 0" }}>ไม่มีคู่หุ้นที่ปรับตัวตามกันสูงในพอร์ต</div>
                        ) : (
                          coupledPairs.map((pair, idx) => (
                            <div key={idx} className="clickable ripple-btn" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(239, 68, 68, 0.02)", border: "1px solid rgba(239, 68, 68, 0.08)", borderRadius: 10, cursor: "pointer" }} onClick={() => setSelectedCell({ row: pair.asset1, col: pair.asset2, value: pair.value })}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{pair.asset1} + {pair.asset2}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--loss)" }}>ขยับตามกันสูง (+{Math.round(pair.value * 100)}%) 🔍</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)" }}>🟢 หุ้นคู่ช่วยพยุงพอร์ตสวนทางกัน (Perfect Hedging)</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {hedgingPairs.length === 0 ? (
                          <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "4px 0" }}>ไม่มีคู่หุ้นที่มีผลป้องกันความเสี่ยงเด่นชัด</div>
                        ) : (
                          hedgingPairs.map((pair, idx) => (
                            <div key={idx} className="clickable ripple-btn" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(16, 185, 129, 0.02)", border: "1px solid rgba(16, 185, 129, 0.08)", borderRadius: 10, cursor: "pointer" }} onClick={() => setSelectedCell({ row: pair.asset1, col: pair.asset2, value: pair.value })}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{pair.asset1} + {pair.asset2}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--gain)" }}>ช่วยพยุงลดแรงแกว่ง ({Math.round(pair.value * 100)}%) 🔍</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="fade-in">
                    <div className="table-wrapper" style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px" }}>
                        <thead>
                          <tr>
                            <th style={{ background: "transparent", border: "none" }}></th>
                            {displaySymbols.map((sym, idx) => (
                              <th key={idx} style={{ padding: "4px 6px", fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textAlign: "center" }}>{sym}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {displaySymbols.map((rowSym, rIdx) => (
                            <tr key={rIdx}>
                              <td style={{ padding: "4px 6px", fontSize: 10, fontWeight: 800, color: "var(--text-muted)", verticalAlign: "middle" }}>{rowSym}</td>
                              {displaySymbols.map((colSym, cIdx) => {
                                const coeff = getCorrelation(rowSym, colSym), isDiagonal = rowSym === colSym;
                                return (
                                  <td key={cIdx} 
                                    style={{ 
                                      padding: "10px 6px", textAlign: "center", borderRadius: 6, 
                                      background: isDiagonal ? "rgba(99, 102, 241, 0.08)" : coeff >= 0.4 ? "rgba(239, 68, 68, 0.1)" : coeff <= -0.2 ? "rgba(16, 185, 129, 0.1)" : "rgba(241, 245, 249, 0.9)",
                                      color: isDiagonal ? "var(--primary)" : coeff >= 0.4 ? "var(--loss)" : coeff <= -0.2 ? "var(--gain)" : "var(--text-muted)",
                                      fontWeight: 900, fontSize: 11, cursor: "pointer",
                                      border: isDiagonal ? "1px dashed var(--primary)" : "1px solid transparent", transition: "all 0.2s"
                                    }}
                                    className="ripple-btn" onClick={() => setSelectedCell({ row: rowSym, col: colSym, value: coeff })} title={`${rowSym} vs ${colSym}: ${coeff}`}
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
            )}
          </div>
        </div>
      </div>

      {/* Warning/Success Alert banner at the bottom */}
      {avgCorrelation >= 0.5 ? (
        <div style={{ display: "flex", gap: 12, background: "rgba(239, 68, 68, 0.05)", padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(239, 68, 68, 0.15)", alignItems: "center" }}>
          <AlertTriangle size={24} style={{ color: "var(--loss)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>ตรวจพบการผูกพันราคาในพอร์ตสูงเฉลี่ย (Avg: {avgCorrelation})</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>พอร์ตของคุณพึ่งพากลุ่มอุตสาหกรรมที่มีความผูกพันกันสูง (เช่น เทคโนโลยีและเซมิคอนดักเตอร์) แนะนำพิจารณากระจายการลงทุนเพิ่มในกลุ่ม Defensive เช่น สินค้าอุปโภคบริโภค หรือสาธารณูปโภคเพื่อลดแรงกระแทก</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, background: "rgba(16, 185, 129, 0.05)", padding: "16px 20px", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.15)", alignItems: "center" }}>
          <CheckCircle size={24} style={{ color: "var(--gain)", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>การกระจายความเสี่ยงของพอร์ตเหมาะสมดีมาก (Avg: {avgCorrelation})</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>พอร์ตการลงทุนของคุณมีค่าสหสัมพันธ์เฉลี่ยต่ำในเกณฑ์ดีเลิศ ช่วยกระจายความผันผวนรวมของสินทรัพย์หลักได้อย่างมีประสิทธิภาพสูงเมื่อมีเซกเตอร์ใดเซกเตอร์หนึ่งเกิดวิกฤตชั่วคราว</span>
          </div>
        </div>
      )}

      {/* Selected Cell Correlation Detail Modal */}
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
                <span style={{ fontSize: 18, fontWeight: 800, color: selectedCell.value >= 0.4 ? "var(--loss)" : selectedCell.value <= -0.2 ? "var(--gain)" : "var(--text-muted)", display: "block", marginTop: 6 }}>ค่าความสัมพันธ์: {selectedCell.value > 0 && selectedCell.row !== selectedCell.col ? `+${selectedCell.value}` : selectedCell.value}</span>
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

      {/* Fear & Greed Details Modal */}
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
