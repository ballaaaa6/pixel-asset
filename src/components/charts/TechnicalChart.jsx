import React, { useState } from "react";

export default function TechnicalChart({ candles = [], symbol = "", currentPrice = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!candles || candles.length < 5) {
    return (
      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: 16, color: "var(--text-muted)", fontSize: 14 }}>
        ไม่มีข้อมูลประวัติราคาเพียงพอสำหรับการคำนวณเทคนิคคัล
      </div>
    );
  }

  // Calculate Support & Resistance levels using Pivot Points of the entire period
  const highs = candles.map(c => c.high ?? c.close);
  const lows = candles.map(c => c.low ?? c.close);
  const closes = candles.map(c => c.close);

  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const lastClose = currentPrice || closes[closes.length - 1];

  // Pivot point calculations
  const pp = (maxPrice + minPrice + lastClose) / 3;
  const r1 = 2 * pp - minPrice;
  const s1 = 2 * pp - maxPrice;
  const r2 = pp + (maxPrice - minPrice);
  const s2 = pp - (maxPrice - minPrice);

  // Calculate RSI (14 periods)
  const calculateRSI = (data) => {
    const period = 14;
    if (data.length <= period) return 50;
    
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  };

  const rsi = calculateRSI(closes);

  // RSI Alert Badge
  const getRSIBadge = (v) => {
    if (v < 30) return { text: `🟢 Oversold (จุดซื้อสะสม / RSI: ${v})`, color: "#10B981" };
    if (v > 70) return { text: `🔴 Overbought (ซื้อมากเกินไป / RSI: ${v})`, color: "#EF4444" };
    return { text: `🔵 Neutral (ปกติ / RSI: ${v})`, color: "var(--primary)" };
  };
  const rsiBadge = getRSIBadge(rsi);

  // SVG dimensions
  const width = 500;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 95;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Determine overall min/max bounds for the chart viewport (include R2 and S2 to fit lines)
  const viewMax = Math.max(maxPrice, r2) * 1.02;
  const viewMin = Math.min(minPrice, s2) * 0.98;

  const getX = (index) => paddingLeft + (index / (candles.length - 1)) * chartWidth;
  const getY = (price) => {
    const pct = (price - viewMin) / (viewMax - viewMin);
    return height - paddingBottom - pct * chartHeight;
  };

  // Build line path
  let pathD = "";
  candles.forEach((c, i) => {
    const x = getX(i);
    const y = getY(c.close);
    if (i === 0) pathD = `M ${x} ${y}`;
    else pathD += ` L ${x} ${y}`;
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - paddingLeft) / chartWidth;
    let idx = Math.round(ratio * (candles.length - 1));
    idx = Math.max(0, Math.min(candles.length - 1, idx));
    setHoveredIdx(idx);
  };

  const activeCandle = hoveredIdx !== null ? candles[hoveredIdx] : candles[candles.length - 1];

  const renderSRLine = (val, label, color) => {
    const y = getY(val);
    if (y < paddingTop || y > height - paddingBottom) return null;
    return (
      <g key={label}>
        <line 
          x1={paddingLeft} 
          y1={y} 
          x2={width - paddingRight} 
          y2={y} 
          stroke={color} 
          strokeWidth="1.2" 
          strokeDasharray="4,4" 
        />
        <rect 
          x={width - paddingRight + 5} 
          y={y - 8} 
          width={85} 
          height={16} 
          rx={4} 
          fill={color} 
          opacity="0.1" 
        />
        <text 
          x={width - paddingRight + 8} 
          y={y + 4} 
          fill={color} 
          fontSize="10" 
          fontWeight="800"
        >
          {label}: ${val.toFixed(2)}
        </text>
      </g>
    );
  };

  const fmtDate = (dStr) => {
    if (!dStr) return "";
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    } catch { return dStr; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Chart Headers */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>ราคาเป้าหมาย & สถานะเทคนิคคัล</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "var(--text-main)" }}>
              ${lastClose.toFixed(2)}
            </span>
            <span style={{ fontSize: 13, color: rsiBadge.color, fontWeight: 800 }}>
              {rsiBadge.text}
            </span>
          </div>
        </div>
        
        {hoveredIdx !== null && (
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
              วันที่ {fmtDate(activeCandle.date)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>
              ปิด: ${activeCandle.close.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Area */}
      <div 
        style={{ position: "relative", background: "rgba(0,0,0,0.01)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted grid lines */}
          <line x1={paddingLeft} y1={getY(pp)} x2={width - paddingRight} y2={getY(pp)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2,2" />

          {/* Support and Resistance Lines */}
          {renderSRLine(r2, "แนวต้าน 2 (R2)", "#EF4444")}
          {renderSRLine(r1, "แนวต้าน 1 (R1)", "#F59E0B")}
          {renderSRLine(s1, "แนวรับ 1 (S1)", "#10B981")}
          {renderSRLine(s2, "แนวรับ 2 (S2)", "#047857")}

          {/* Gradient area under line */}
          {pathD && (
            <path 
              d={`${pathD} L ${getX(candles.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`} 
              fill="url(#chartLineGrad)" 
            />
          )}

          {/* Price Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Vertical indicator line on hover */}
          {hoveredIdx !== null && (
            <g>
              <line 
                x1={getX(hoveredIdx)} 
                y1={paddingTop} 
                x2={getX(hoveredIdx)} 
                y2={height - paddingBottom} 
                stroke="var(--border)" 
                strokeWidth="1" 
              />
              <circle 
                cx={getX(hoveredIdx)} 
                cy={getY(activeCandle.close)} 
                r="5" 
                fill="var(--primary)" 
                stroke="#ffffff" 
                strokeWidth="2.5" 
              />
            </g>
          )}

          {/* X Axis labels (First, Middle, Last dates) */}
          <text x={getX(0)} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="start">
            {fmtDate(candles[0].date)}
          </text>
          <text x={getX(Math.floor(candles.length / 2))} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="middle">
            {fmtDate(candles[Math.floor(candles.length / 2)].date)}
          </text>
          <text x={getX(candles.length - 1)} y={height - 10} fill="var(--text-muted)" fontSize="9" textAnchor="end">
            {fmtDate(candles[candles.length - 1].date)}
          </text>
        </svg>
      </div>
    </div>
  );
}
