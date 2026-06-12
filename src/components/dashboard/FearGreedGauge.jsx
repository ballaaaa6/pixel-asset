import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, HelpCircle } from "lucide-react";
import { registerModal } from "../../utils/modalStack";

export default function FearGreedGauge() {
  const [showGreedModal, setShowGreedModal] = useState(false);

  useEffect(() => {
    if (!showGreedModal) return;
    return registerModal(() => { setShowGreedModal(false); });
  }, [showGreedModal]);

  const fearGreedValue = 68;

  const getFearGreedLabel = (v) => {
    if (v < 20) return "Extreme Fear (กลัวจัด)";
    if (v < 40) return "Fear (กลัว)";
    if (v < 60) return "Neutral (ปกติ)";
    if (v < 80) return "Greed (โลภ)";
    return "Extreme Greed (โลภจัด)";
  };

  const getFearGreedColor = (v) => {
    if (v < 20) return "#EF4444";
    if (v < 40) return "#F59E0B";
    if (v < 60) return "#EAB308";
    if (v < 80) return "#10B981";
    return "#047857";
  };

  // SVG Gauge calculations
  // Center is (110, 100), Radius is 75
  const needleAngle = (fearGreedValue / 100) * 180 - 180; // -180 to 0
  const angleRad = (fearGreedValue / 100) * Math.PI - Math.PI; // -PI to 0
  const markerX = 110 + 75 * Math.cos(angleRad);
  const markerY = 100 + 75 * Math.sin(angleRad);

  return (
    <div 
      className="clickable card" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: 24, 
        background: "var(--bg-card)", 
        borderRadius: 24, 
        border: "1px solid var(--border)", 
        cursor: "pointer",
        position: "relative",
        boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
        height: "100%",
        boxSizing: "border-box"
      }} 
      onClick={() => setShowGreedModal(true)} 
      title="คลิกเพื่อวิเคราะห์กลยุทธ์อารมณ์ตลาด"
    >
      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-main)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        🔥 Fear & Greed Index
      </span>
      
      <div style={{ width: 220, height: 115, position: "relative", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <svg width="220" height="115" viewBox="0 0 220 115" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="25%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Subtle background track */}
          <path d="M 35 100 A 75 75 0 0 1 185 100" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="16" strokeLinecap="round" />
          
          {/* Main gradient track */}
          <path d="M 35 100 A 75 75 0 0 1 185 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" />
          
          {/* Floating needle that doesn't overlap the center score area (starts from r=22 to r=65) */}
          <line 
            x1="110" 
            y1="78" 
            x2="110" 
            y2="38" 
            stroke="var(--text-main)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            transform={`rotate(${needleAngle} 110 100)`} 
            style={{ transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} 
          />
          
          {/* Glowing marker dot at the current value position on the arc */}
          <circle 
            cx={markerX} 
            cy={markerY} 
            r="8" 
            fill={getFearGreedColor(fearGreedValue)} 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            filter="url(#glow)"
            style={{ 
              transition: "cx 1.2s ease, cy 1.2s ease",
              boxShadow: "0px 2px 8px rgba(0,0,0,0.3)"
            }} 
          />
        </svg>
        
        {/* Centered value score (clean, readable, no overlap) */}
        <div style={{ 
          position: "absolute", 
          bottom: 15, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: getFearGreedColor(fearGreedValue), lineHeight: 1 }}>
            {fearGreedValue}
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
            {getFearGreedLabel(fearGreedValue)}
          </span>
        </div>
      </div>
      
      {/* Segmented Gradient Pill Legend */}
      <div style={{ width: "100%", marginTop: 12 }}>
        <div style={{ display: "flex", width: "100%", gap: 3, height: 6, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#EF4444" }} title="0-20 Extreme Fear" />
          <div style={{ flex: 1, background: "#F59E0B" }} title="21-40 Fear" />
          <div style={{ flex: 1, background: "#EAB308" }} title="41-60 Neutral" />
          <div style={{ flex: 1, background: "#10B981" }} title="61-80 Greed" />
          <div style={{ flex: 1, background: "#047857" }} title="81-100 Extreme Greed" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 6, fontSize: 9, color: "var(--text-muted)", fontWeight: 800 }}>
          <span>0 (กลัวจัด)</span>
          <span>50 (ปกติ)</span>
          <span>100 (โลภจัด)</span>
        </div>
      </div>
      
      <div style={{ textAlign: "center", marginTop: 12, background: "rgba(0,0,0,0.01)", padding: "8px 12px", borderRadius: 12, border: "1px solid var(--border)", width: "100%", boxSizing: "border-box" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          ตลาดกำลังมีความมั่นใจ ควรรักษาวินัยการลงทุน 🔍
        </span>
      </div>

      {/* Fear & Greed Details Modal */}
      {showGreedModal && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowGreedModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>🔍 ดัชนีอารมณ์ตลาด (Fear & Greed Index)</span>
              <button className="btn-close" onClick={() => setShowGreedModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: getFearGreedColor(fearGreedValue), display: "block" }}>{fearGreedValue}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)", display: "block", marginTop: 4 }}>สถานะปัจจุบัน: {getFearGreedLabel(fearGreedValue)}</span>
              </div>
              <div style={{ background: "rgba(99, 102, 241, 0.04)", borderRadius: 12, padding: 14, border: "1px solid rgba(99, 102, 241, 0.12)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
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
