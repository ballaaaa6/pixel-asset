import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";

export default function StockQuarterlyTab({ earnings = [], calendar = [], currency = "USD", metrics = {} }) {
  const [selectedEarning, setSelectedEarning] = useState(null);

  const getScreenerNextEstimate = () => {
    if (!calendar || calendar.length === 0) return null;
    const sorted = [...calendar].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted[0];
  };

  const nextEstimate = getScreenerNextEstimate();

  const formatMoney = (val) => {
    if (val == null) return "-";
    const prefix = currency === "THB" ? "฿" : "$";
    if (Math.abs(val) >= 1e12) return `${prefix}${(val / 1e12).toFixed(2)}T`;
    if (Math.abs(val) >= 1e9) return `${prefix}${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `${prefix}${(val / 1e6).toFixed(2)}M`;
    return `${prefix}${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const getGrowthStats = () => {
    if (!selectedEarning) return null;
    const idx = earnings.indexOf(selectedEarning);
    let revGrowth = null;
    let netGrowth = null;
    let type = "YoY";

    if (idx === 0) {
      revGrowth = metrics?.metric?.revenueGrowthYoY;
      netGrowth = metrics?.metric?.earningsGrowthYoY;
    }

    if ((revGrowth == null || netGrowth == null) && idx + 4 < earnings.length) {
      const prevYoY = earnings[idx + 4];
      if (prevYoY) {
        if (revGrowth == null && selectedEarning.revenue != null && prevYoY.revenue) {
          revGrowth = ((selectedEarning.revenue - prevYoY.revenue) / prevYoY.revenue) * 100;
        }
        if (netGrowth == null && selectedEarning.netIncome != null && prevYoY.netIncome) {
          netGrowth = ((selectedEarning.netIncome - prevYoY.netIncome) / prevYoY.netIncome) * 100;
        }
        type = "YoY";
      }
    }

    if ((revGrowth == null || netGrowth == null) && idx + 1 < earnings.length) {
      const prevQoQ = earnings[idx + 1];
      if (prevQoQ) {
        if (revGrowth == null && selectedEarning.revenue != null && prevQoQ.revenue) {
          revGrowth = ((selectedEarning.revenue - prevQoQ.revenue) / prevQoQ.revenue) * 100;
          type = "QoQ";
        }
        if (netGrowth == null && selectedEarning.netIncome != null && prevQoQ.netIncome) {
          netGrowth = ((selectedEarning.netIncome - prevQoQ.netIncome) / prevQoQ.netIncome) * 100;
          type = "QoQ";
        }
      }
    }

    return { revGrowth, netGrowth, type };
  };

  const growth = getGrowthStats();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>ประวัติการรายงานกำไร (คลิกเพื่อดูรายละเอียดเชิงลึก)</span>
        {nextEstimate && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--primary)", background: "rgba(99,102,241,0.06)", padding: "2px 8px", borderRadius: 8 }}>
            คาดการณ์ครั้งถัดไป: {nextEstimate.date} (EPS: {nextEstimate.epsEstimate?.toFixed(2) ?? "-"})
          </span>
        )}
      </div>
      
      {(!earnings || earnings.length === 0) ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>ไม่มีข้อมูลรายงานกำไรสุทธิไตรมาสล่าสุด</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {earnings.map((e, idx) => {
            const surpriseColor = e.surprise >= 0 ? "var(--gain)" : "var(--loss)";
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedEarning(e)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "10px 14px", 
                  background: "rgba(0,0,0,0.015)", 
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.015)"}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>ไตรมาส {e.quarter} / ปี {e.year}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>วันที่รายงาน: {e.period}</span>
                </div>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>คาดการณ์ / จริง</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>
                      {e.estimate?.toFixed(2) ?? "-"} / <strong style={{ color: "var(--primary)" }}>{e.actual?.toFixed(2) ?? "-"}</strong>
                    </span>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 70 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Surprise</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: surpriseColor }}>
                      {e.surprisePercent >= 0 ? `+${e.surprisePercent.toFixed(1)}%` : `${e.surprisePercent.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── EARNINGS DETAIL MODAL ── */}
      {selectedEarning && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedEarning(null)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>📊 รายละเอียดงบไตรมาส (Quarterly Earnings)</span>
              <button className="btn-close" onClick={() => setSelectedEarning(null)}><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", background: "rgba(99,102,241,0.03)", borderRadius: 16, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>ไตรมาส {selectedEarning.quarter} / ปี {selectedEarning.year}</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-main)", marginTop: 4 }}>
                  จริง: {selectedEarning.actual?.toFixed(2) ?? "-"} | คาด: {selectedEarning.estimate?.toFixed(2) ?? "-"}
                </span>
                
                <div style={{ 
                  marginTop: 10,
                  fontSize: 12, 
                  fontWeight: 900, 
                  color: selectedEarning.surprise >= 0 ? "var(--gain)" : "var(--loss)", 
                  background: selectedEarning.surprise >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  padding: "4px 12px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  <AlertCircle size={14} />
                  {selectedEarning.surprise >= 0 
                    ? `เข้าเป้า (Beat คาดการณ์ +${selectedEarning.surprisePercent?.toFixed(1)}%)` 
                    : `ต่ำกว่าคาด (Miss คาดการณ์ ${selectedEarning.surprisePercent?.toFixed(1)}%)`
                  }
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-muted)" }}>ข้อมูลประกอบงบไตรมาส:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: "var(--text-main)", lineHeight: 1.4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>ส่วนต่างกำไรต่อหุ้น (Surprise Value):</span>
                    <strong>{selectedEarning.surprise >= 0 ? `+${selectedEarning.surprise?.toFixed(2)}` : selectedEarning.surprise?.toFixed(2)} EPS</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>วันประกาศปิดรอบงบ (Report Period):</span>
                    <strong>{selectedEarning.period}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border)", paddingTop: 8 }}>
                    <span>รายได้รวมประเมินไตรมาส (Revenue):</span>
                    <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {formatMoney(selectedEarning.revenue)}
                      {growth?.revGrowth != null && (
                        <span style={{ fontSize: 10, fontWeight: 900, color: growth.revGrowth >= 0 ? "var(--gain)" : "var(--loss)" }}>
                          ({growth.type}: {growth.revGrowth >= 0 ? "+" : ""}{growth.revGrowth.toFixed(1)}% {growth.revGrowth >= 0 ? "เข้าเป้า 🟢" : "ไม่เข้าเป้า 🔴"})
                        </span>
                      )}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>กำไรสุทธิไตรมาส (Net Income):</span>
                    <strong style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {formatMoney(selectedEarning.netIncome)}
                      {growth?.netGrowth != null && (
                        <span style={{ fontSize: 10, fontWeight: 900, color: growth.netGrowth >= 0 ? "var(--gain)" : "var(--loss)" }}>
                          ({growth.type}: {growth.netGrowth >= 0 ? "+" : ""}{growth.netGrowth.toFixed(1)}% {growth.netGrowth >= 0 ? "เข้าเป้า 🟢" : "ไม่เข้าเป้า 🔴"})
                        </span>
                      )}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>อัตรากำไรสุทธิไตรมาส (Net Margin):</span>
                    <strong>
                      {selectedEarning.revenue && selectedEarning.netIncome 
                        ? `${((selectedEarning.netIncome / selectedEarning.revenue) * 100).toFixed(2)}%`
                        : "-"
                      }
                    </strong>
                  </div>
                  
                  {nextEstimate && (
                    <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)" }}>🔮 คาดการณ์งบรอบถัดไป:</span>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>วันประกาศคาดการณ์ถัดไป:</span>
                        <strong>{nextEstimate.date}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>ประมาณการกำไรต่อหุ้น (EPS Estimate):</span>
                        <strong>{nextEstimate.epsEstimate?.toFixed(2) ?? "-"} EPS</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedEarning(null)} 
                style={{ width: "100%", padding: "10px 0", background: "var(--primary)", color: "#ffffff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 800 }}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
